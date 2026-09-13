from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Any
from supabase import create_client
from datetime import datetime

from ...auth.dependencies import (
    require_read_access,
    get_supabase_url,
    get_service_role_key
)
from ...auth.models import AuthenticatedUser

router = APIRouter()

def get_admin_supabase():
    url = get_supabase_url()
    key = get_service_role_key()
    return create_client(url, key)

class AuditRecord(BaseModel):
    id: str
    timestamp: datetime
    actor_id: str
    actor_email: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    resource_type: str
    resource_id: str
    status: str = "Success"
    details: Optional[Any] = None

class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int

class AuditListResponse(BaseModel):
    data: List[AuditRecord]
    pagination: PaginationMeta

@router.get("", response_model=AuditListResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(require_read_access())
):
    client = get_admin_supabase()
    
    # Start query
    query = client.table("audit_logs").select(
        "id, timestamp, user_id, action, resource_type, resource_id, new_value, old_value",
        count="exact"
    )
    
    # Enforce tenant isolation securely on the server!
    query = query.eq("organization_id", user.organization_id)
    
    # Apply filters if provided
    if action:
        query = query.eq("action", action)
    if resource_type:
        query = query.eq("resource_type", resource_type)
        
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.range(offset, offset + page_size - 1)
    
    # Order by newest first
    query = query.order("timestamp", desc=True)
    
    # Execute query
    response = query.execute()
    
    records = []
    for item in response.data:
        # Safely extract profile
        profile = {}
        
        # Sanitize details (don't expose raw potentially sensitive JSON payloads)
        # We can extract a summary or just ignore it.
        details_str = None
        if item.get("new_value"):
            nv = item.get("new_value")
            # For role updates
            if isinstance(nv, dict) and "new_role" in nv:
                details_str = f"Role changed to {nv.get('new_role')}"
            else:
                details_str = "Resource updated"
                
        records.append(AuditRecord(
            id=str(item["id"]),
            timestamp=item["timestamp"],
            actor_id=str(item["user_id"]) if item.get("user_id") else "system",
            actor_email="Unknown",
            actor_name="Unknown",
            action=item["action"],
            resource_type=item["resource_type"],
            resource_id=str(item["resource_id"]),
            status="Recorded Event",
            details=details_str
        ))
        
    total = response.count if response.count is not None else len(records)
    
    return AuditListResponse(
        data=records,
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total=total
        )
    )
