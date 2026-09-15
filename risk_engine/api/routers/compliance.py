from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from ...auth.dependencies import require_read_access, require_write_access, get_current_user, get_auditor, get_admin
from ...auth.models import AuthenticatedUser
from ...services.audit import log_audit_event
from supabase import create_client
import os

router = APIRouter()

def get_supabase_client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)

# --- MODELS ---

class EvidencePayload(BaseModel):
    organization_control_id: str
    title: str
    description: str
    storage_path: str
    evidence_type: str
    source: str

class ControlUpdatePayload(BaseModel):
    status: str
    notes: Optional[str] = None
    owner: Optional[str] = None

class GapAnalysisResult(BaseModel):
    organization_control_id: str
    framework_id: str
    control_code: str
    title: str
    status: str
    evidence_status: str
    has_gap: bool

# --- API ROUTES ---

@router.get("/frameworks")
async def list_frameworks(user: AuthenticatedUser = Depends(require_read_access())):
    client = get_supabase_client()
    res = client.table("frameworks").select("*").execute()
    return res.data

@router.get("/frameworks/{framework_id}")
async def get_framework(framework_id: str, user: AuthenticatedUser = Depends(require_read_access())):
    client = get_supabase_client()
    res = client.table("frameworks").select("*").eq("id", framework_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Framework not found")
    return res.data[0]

@router.get("/frameworks/{framework_id}/controls")
async def list_framework_controls(framework_id: str, user: AuthenticatedUser = Depends(require_read_access())):
    client = get_supabase_client()
    res = client.table("framework_controls").select("*").eq("framework_id", framework_id).execute()
    return res.data

@router.get("/overview")
async def get_compliance_overview(user: AuthenticatedUser = Depends(require_read_access())):
    client = get_supabase_client()
    org_id = user.organization_id
    
    # Query organization controls
    controls_res = client.table("organization_controls").select(
        "*, framework_controls(framework_id, frameworks(short_name))"
    ).eq("organization_id", org_id).execute()
    
    framework_stats = {}
    for c in controls_res.data:
        fw_name = c["framework_controls"]["frameworks"]["short_name"]
        if fw_name not in framework_stats:
            framework_stats[fw_name] = {"IMPLEMENTED": 0, "PARTIALLY_IMPLEMENTED": 0, "GAP": 0, "NOT_ASSESSED": 0}
        
        status = c["status"]
        if status in ("NOT_IMPLEMENTED", "EXCEPTION"):
            framework_stats[fw_name]["GAP"] += 1
        elif status == "PARTIALLY_IMPLEMENTED":
            framework_stats[fw_name]["PARTIALLY_IMPLEMENTED"] += 1
        elif status == "IMPLEMENTED":
            framework_stats[fw_name]["IMPLEMENTED"] += 1
        else:
            framework_stats[fw_name]["NOT_ASSESSED"] += 1
            
    # Calculate Gaps
    findings_res = client.table("compliance_findings").select("severity").eq("organization_id", org_id).eq("status", "OPEN").execute()
    critical = sum(1 for f in findings_res.data if f["severity"] == "CRITICAL")
    high = sum(1 for f in findings_res.data if f["severity"] == "HIGH")
            
    return {
        "organization_id": org_id,
        "framework_posture": framework_stats,
        "critical_gaps": critical,
        "high_gaps": high
    }

@router.get("/gaps")
async def list_gaps(user: AuthenticatedUser = Depends(require_read_access())):
    client = get_supabase_client()
    org_id = user.organization_id
    
    controls_res = client.table("organization_controls").select(
        "id, status, framework_controls(control_code, title, framework_id)"
    ).eq("organization_id", org_id).in_("status", ["NOT_IMPLEMENTED", "PARTIALLY_IMPLEMENTED"]).execute()
    
    gaps = []
    for c in controls_res.data:
        gaps.append({
            "organization_control_id": c["id"],
            "framework_id": c["framework_controls"]["framework_id"],
            "control_code": c["framework_controls"]["control_code"],
            "title": c["framework_controls"]["title"],
            "status": c["status"],
            "has_gap": True
        })
    return gaps

@router.get("/findings")
async def list_findings(user: AuthenticatedUser = Depends(require_read_access())):
    client = get_supabase_client()
    res = client.table("compliance_findings").select("*").eq("organization_id", user.organization_id).execute()
    return res.data

@router.patch("/controls/{organization_control_id}")
async def update_control_status(
    organization_control_id: str, 
    payload: ControlUpdatePayload,
    user: AuthenticatedUser = Depends(require_write_access()) # Only writers can modify status. Auditor/Executive blocked.
):
    client = get_supabase_client()
    
    # Verify ownership
    existing = client.table("organization_controls").select("organization_id, status").eq("id", organization_control_id).execute()
    if not existing.data or existing.data[0]["organization_id"] != user.organization_id:
        raise HTTPException(status_code=403, detail="Cross-tenant access forbidden.")
        
    old_status = existing.data[0]["status"]
    
    update_data = {"status": payload.status}
    if payload.notes: update_data["notes"] = payload.notes
    if payload.owner: update_data["owner"] = payload.owner
    
    res = client.table("organization_controls").update(update_data).eq("id", organization_control_id).execute()
    
    log_audit_event(
        organization_id=user.organization_id,
        user_id=user.user_id,
        action="UPDATE_CONTROL_STATUS",
        resource_type="COMPLIANCE_CONTROL",
        resource_id=organization_control_id,
        old_value={"status": old_status},
        new_value={"status": payload.status}
    )
    
    return res.data[0]

@router.post("/evidence")
async def submit_evidence(payload: EvidencePayload, user: AuthenticatedUser = Depends(require_write_access())):
    client = get_supabase_client()
    
    # 1. Prevent IDOR by asserting ownership of the target control
    target_control_res = client.table("organization_controls").select("organization_id").eq("id", payload.organization_control_id).execute()
    
    if not target_control_res.data:
        raise HTTPException(status_code=404, detail="Target control not found.")
        
    if target_control_res.data[0]["organization_id"] != user.organization_id:
        raise HTTPException(status_code=403, detail="Cross-tenant access forbidden. Control does not belong to your organization.")
    
    # Insert evidence
    ev_res = client.table("evidence").insert({
        "organization_id": user.organization_id,
        "title": payload.title,
        "description": payload.description,
        "storage_path": payload.storage_path,
        "evidence_type": payload.evidence_type,
        "source": payload.source,
        "uploaded_by": user.user_id
    }).execute()
    
    ev_id = ev_res.data[0]["id"]
    
    # Link to control
    client.table("control_evidence").insert({
        "organization_control_id": payload.organization_control_id,
        "evidence_id": ev_id,
        "evidence_present": True,
        "review_status": "PENDING"
    }).execute()
    
    return {"status": "success", "evidence_id": ev_id}

@router.get("/mappings")
async def get_mappings(user: AuthenticatedUser = Depends(require_read_access())):
    client = get_supabase_client()
    res = client.table("control_mappings").select("*").execute()
    return res.data
