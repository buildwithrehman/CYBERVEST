from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import uuid

from ...auth.dependencies import require_read_access, require_write_access
from ...auth.models import AuthenticatedUser
from ...services.audit import log_audit_event

router = APIRouter()

class AssetBase(BaseModel):
    name: str
    asset_type: Optional[str] = None
    environment: Optional[str] = None
    criticality: Optional[str] = None
    internet_exposed: bool = False
    data_sensitivity: Optional[str] = None
    owner: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    business_service_id: Optional[str] = None

class AssetResponse(AssetBase):
    id: str
    organization_id: str
    created_at: str
    updated_at: str

def _get_db():
    import os
    from supabase import create_client
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

@router.get("/", response_model=List[AssetResponse])
async def list_assets(user: AuthenticatedUser = Depends(require_read_access())):
    client = _get_db()
    # Ensure isolation by organization_id
    res = client.table("assets").select("*").eq("organization_id", user.organization_id).execute()
    return res.data

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, user: AuthenticatedUser = Depends(require_read_access())):
    try:
        uuid.UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")

    client = _get_db()
    # Ensure isolation by organization_id
    res = client.table("assets").select("*").eq("id", asset_id).eq("organization_id", user.organization_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return res.data[0]

@router.post("/")
async def create_asset(payload: dict, user: AuthenticatedUser = Depends(require_write_access())):
    return {"status": "created"}
