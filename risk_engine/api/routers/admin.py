from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from supabase import create_client

from ...auth.dependencies import (
    get_admin, 
    get_current_user, 
    get_supabase_url, 
    get_service_role_key
)
from ...auth.models import AuthenticatedUser, Role
from ...services.audit import log_audit_event

router = APIRouter()

def get_admin_supabase():
    url = get_supabase_url()
    key = get_service_role_key()
    return create_client(url, key)

class OrganizationMember(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str] = None
    role: str
    created_at: str
    status: str = "active"

class RoleListResponse(BaseModel):
    members: List[OrganizationMember]

class RoleUpdateRequest(BaseModel):
    target_user_id: str
    role: str

class RoleUpdateResponse(BaseModel):
    status: str

@router.get("/roles", response_model=RoleListResponse)
async def list_roles(user: AuthenticatedUser = Depends(get_current_user)):
    # Any member of the org can view the members list, but they can't manage it unless they are ADMIN
    client = get_admin_supabase()
    
    # Query organization_members and join profiles using supabase service role
    res = client.table("organization_members").select(
        "user_id, role, created_at, profiles(email, full_name)"
    ).eq("organization_id", user.organization_id).execute()
    
    members = []
    for item in res.data:
        profile = item.get("profiles", {}) or {}
        members.append(OrganizationMember(
            user_id=item["user_id"],
            email=profile.get("email", ""),
            full_name=profile.get("full_name", ""),
            role=item["role"],
            created_at=item["created_at"]
        ))
        
    return RoleListResponse(members=members)

@router.post("/roles", response_model=RoleUpdateResponse)
async def assign_role(payload: RoleUpdateRequest, user: AuthenticatedUser = Depends(get_admin)):
    # Validate role
    if payload.role not in Role.get_all():
        raise HTTPException(status_code=400, detail="Invalid role")
        
    client = get_admin_supabase()
    
    # 1. Enforce organization ownership server-side
    target_res = client.table("organization_members").select("role").eq("organization_id", user.organization_id).eq("user_id", payload.target_user_id).execute()
    
    if not target_res.data:
        raise HTTPException(status_code=403, detail="User not found in your organization")
        
    old_role = target_res.data[0]["role"]
    
    # 2. Final-admin protection
    if old_role == Role.ADMIN and payload.role != Role.ADMIN:
        admins_res = client.table("organization_members").select("user_id").eq("organization_id", user.organization_id).eq("role", Role.ADMIN).execute()
        if len(admins_res.data) <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the final administrator")
            
    # 3. Write the role
    update_res = client.table("organization_members").update({"role": payload.role}).eq("organization_id", user.organization_id).eq("user_id", payload.target_user_id).execute()
    
    if not update_res.data:
        raise HTTPException(status_code=500, detail="Failed to update role")
        
    log_audit_event(
        organization_id=user.organization_id,
        user_id=user.user_id,
        action="ROLE_UPDATED",
        resource_type="USER_ROLE",
        resource_id=payload.target_user_id,
        new_value={"old_role": old_role, "new_role": payload.role}
    )
    
    return RoleUpdateResponse(status="success")
