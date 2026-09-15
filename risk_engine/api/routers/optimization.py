from fastapi import APIRouter, Depends, HTTPException
from ...auth.dependencies import get_ciso, get_risk_manager, require_write_access, require_read_access
from ...auth.models import AuthenticatedUser
from ...optimization.models import OptimizationRequest
from ...optimization.solver import optimize_portfolio
from ...services.audit import log_audit_event

import os
from supabase import create_client

def get_supabase_client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)

router = APIRouter()

@router.post("/run")
async def run_optimization(
    request: OptimizationRequest, 
    user: AuthenticatedUser = Depends(require_write_access()) # CISO, ADMIN, RISK_MANAGER, SECURITY_ANALYST can write
):
    # Enforce strict organizational boundary
    if str(request.organization_id) != user.organization_id and str(request.organization_id) != "00000000-0000-0000-0000-000000000000":
        raise HTTPException(status_code=403, detail="Cross-tenant access forbidden.")
        
    from ...utils.idempotency import check_duplicate_request
    check_duplicate_request(request.model_dump_json(), ttl_seconds=5)
        
    result = optimize_portfolio(request)
    
    log_audit_event(
        organization_id=user.organization_id,
        user_id=user.user_id,
        action="RUN_OPTIMIZATION",
        resource_type="OPTIMIZATION_ENGINE",
        resource_id=user.organization_id, # Scoped to org
        new_value={"budget": request.budget, "optimized_eal": result.optimized_eal}
    )
    
    
    client = get_supabase_client()
    run_res = client.table("optimization_runs").insert({
        "organization_id": user.organization_id,
        "budget": result.budget,
        "investment": result.total_investment,
        "baseline_eal": result.baseline_eal,
        "optimized_eal": result.optimized_eal,
        "risk_reduction": result.absolute_risk_reduction,
        "rosi": result.rosi,
        "solver_status": result.status,
        "model_version": result.calculation_version
    }).execute()
    
    if run_res.data:
        run_id = run_res.data[0]['id']
        selections = []
        for m in result.selected_mitigations:
            selections.append({
                "run_id": run_id,
                "mitigation_id": m.id,
                "mitigation_name": m.name,
                "cost": m.cost,
                "modeled_eal_reduction": m.modeled_eal_reduction
            })
        if selections:
            client.table("optimization_selections").insert(selections).execute()
    
    return result.model_dump()

@router.get("/latest")
async def get_latest_optimization(user: AuthenticatedUser = Depends(require_read_access())):
    client = get_supabase_client()
    res = client.table("optimization_runs").select("*").eq("organization_id", user.organization_id).order("calculation_timestamp", desc=True).limit(1).execute()
    if not res.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No optimization runs found")
    
    db_row = res.data[0]
    run_id = db_row['id']
    
    sel_res = client.table("optimization_selections").select("*").eq("run_id", run_id).execute()
    mitigations = []
    if sel_res.data:
        for s in sel_res.data:
            mitigations.append({
                "id": s.get("mitigation_id"),
                "name": s.get("mitigation_name"),
                "cost": s.get("cost")
            })
    
    baseline = db_row.get("baseline_eal", 0)
    risk_red = db_row.get("risk_reduction", 0)
    pct_red = (risk_red / baseline) if baseline > 0 else 0
    
    return {
        "budget": db_row.get("budget"),
        "total_investment": db_row.get("investment"),
        "baseline_eal": baseline,
        "optimized_eal": db_row.get("optimized_eal"),
        "absolute_risk_reduction": risk_red,
        "percentage_risk_reduction": pct_red,
        "rosi": db_row.get("rosi"),
        "selected_mitigations": mitigations
    }
