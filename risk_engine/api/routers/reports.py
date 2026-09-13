from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ...auth.dependencies import require_read_access, get_current_user
from ...auth.models import AuthenticatedUser
from supabase import create_client
import os
import datetime

router = APIRouter()

def get_supabase_client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)

class ReportRequest(BaseModel):
    report_type: str
    parameters: Optional[Dict[str, Any]] = None

class ReportResponse(BaseModel):
    metadata: Dict[str, Any]
    content: Dict[str, Any]
    limitations: Optional[str] = None

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    user: AuthenticatedUser = Depends(require_read_access())
):
    client = get_supabase_client()
    org_id = user.organization_id
    
    # 1. FRAMEWORK / EVIDENCE REPORT
    if request.report_type == "FRAMEWORK_EVIDENCE":
        controls_res = client.table("organization_controls").select(
            "*, framework_controls(control_code, title, frameworks(short_name))"
        ).eq("organization_id", org_id).execute()
        
        findings_res = client.table("compliance_findings").select("*").eq("organization_id", org_id).execute()
        
        return ReportResponse(
            metadata={
                "report_type": "Framework / Evidence Report",
                "organization_id": org_id,
                "generated_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
            },
            content={
                "controls": controls_res.data,
                "findings": findings_res.data
            },
            limitations="This report indicates framework alignment and evidence mapping. It does NOT guarantee regulatory certification."
        )
        
    # Unsupported or missing data scopes
    
    elif request.report_type == "EXECUTIVE_RISK":
        from ...utils.pdf_generator import generate_executive_risk_pdf
        
        # Get parameters passed from frontend
        params = request.parameters or {}
        pdf_bytes = generate_executive_risk_pdf(
            organization_id=org_id,
            data=params
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=CYBERVEST_Executive_Brief.pdf"
            }
        )

    elif request.report_type in ["CISO_RISK", "INVESTMENT", "SCENARIO"]:
        raise HTTPException(
            status_code=422,
            detail="An organization-wide financial risk dataset is not available in the current demonstration scope."
        )
        
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported report type: {request.report_type}")


from fastapi.responses import Response
from ...utils.pdf_generator import generate_framework_evidence_pdf

@router.post("/pdf", response_class=Response)
async def generate_pdf(
    request: ReportRequest,
    user: AuthenticatedUser = Depends(require_read_access())
):
    client = get_supabase_client()
    org_id = user.organization_id
    
    if request.report_type == "FRAMEWORK_EVIDENCE":
        controls_res = client.table("organization_controls").select(
            "*, framework_controls(control_code, title, frameworks(short_name))"
        ).eq("organization_id", org_id).execute()
        
        findings_res = client.table("compliance_findings").select("*").eq("organization_id", org_id).execute()
        
        pdf_bytes = generate_framework_evidence_pdf(
            organization_id=org_id,
            controls=controls_res.data,
            findings=findings_res.data
        )
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=CYBERVEST_Framework_Evidence_Report.pdf"
            }
        )
        
    
    elif request.report_type == "EXECUTIVE_RISK":
        from ...utils.pdf_generator import generate_executive_risk_pdf
        
        # Get parameters passed from frontend
        params = request.parameters or {}
        pdf_bytes = generate_executive_risk_pdf(
            organization_id=org_id,
            data=params
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=CYBERVEST_Executive_Brief.pdf"
            }
        )

    elif request.report_type in ["CISO_RISK", "INVESTMENT", "SCENARIO"]:
        raise HTTPException(
            status_code=422,
            detail="An organization-wide financial risk dataset is not available in the current demonstration scope."
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported report type: {request.report_type}")
