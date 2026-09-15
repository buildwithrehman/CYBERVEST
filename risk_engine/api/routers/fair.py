from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from ...auth.dependencies import require_read_access, require_write_access, get_current_user
from ...auth.models import AuthenticatedUser
from ...fair.models import FAIRScenarioInput
from ...fair.calculator import calculate_fair
from ...services.audit import log_audit_event
import os
from supabase import create_client
def get_supabase_client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


router = APIRouter()

@router.post("/run")
async def run_fair_scenario(
    request: FAIRScenarioInput, 
    user: AuthenticatedUser = Depends(require_write_access())
):
    # Enforce Organization Scope explicitly
    if request.scenario_id == "demo_baseline" or getattr(request, 'organization_id') is None:
        pass # Handle synthetic test data where org is intentionally omitted
    elif request.organization_id != user.organization_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Cross-tenant access forbidden.")
        
    from ...utils.idempotency import check_duplicate_request
    check_duplicate_request(request.model_dump_json(), ttl_seconds=5)
        
    result = await run_in_threadpool(calculate_fair, request)
    
    if request.scenario_id == "demo_baseline" or str(request.scenario_id).startswith("fair_whatif"):
        result.scenario_id = request.scenario_id
        result.scenario_name = request.scenario_name
        return result.model_dump()
    
    client = get_supabase_client()
    
    from fastapi import HTTPException
    import uuid
    # Asset validation and scenario creation logic
    if request.asset_id:
        try:
            uuid.UUID(request.asset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")
            
        asset_check = client.table("assets").select("id, business_service_id, name").eq("id", request.asset_id).eq("organization_id", user.organization_id).execute()
        if not asset_check.data:
            raise HTTPException(status_code=404, detail="Asset not found or access denied")
            
        asset_data = asset_check.data[0]
        business_service_id = asset_data.get("business_service_id")
        
        # Determine if we have an existing scenario for this asset or if we need to create one
        if request.scenario_id == "fair_baseline" or not request.scenario_id:
            new_id = str(uuid.uuid4())
            request.scenario_id = new_id
            request.scenario_name = f"Asset Analysis: {asset_data['name']}"
            
            client.table("fair_scenarios").insert({
                "id": new_id,
                "organization_id": user.organization_id,
                "asset_id": request.asset_id,
                "business_service_id": business_service_id,
                "name": request.scenario_name
            }).execute()
        else:
            # Validate caller's scenario_id belongs to their org and matches the asset
            res_check = client.table("fair_scenarios").select("id").eq("id", request.scenario_id).eq("organization_id", user.organization_id).execute()
            if not res_check.data:
                raise HTTPException(status_code=403, detail="Scenario not found or access denied.")
                
    elif request.scenario_id == "dash_baseline" or request.scenario_id == "fair_baseline":
        # Global organization baseline scenario
        res_scene = client.table("fair_scenarios").select("id").eq("organization_id", user.organization_id).eq("name", "Annual Baseline Exposure").execute()
        if res_scene.data:
            request.scenario_id = res_scene.data[0]["id"]
            request.scenario_name = "Annual Baseline Exposure"
        else:
            new_id = str(uuid.uuid4())
            client.table("fair_scenarios").insert({
                "id": new_id,
                "organization_id": user.organization_id,
                "name": "Annual Baseline Exposure"
            }).execute()
            request.scenario_id = new_id
            request.scenario_name = "Annual Baseline Exposure"
    else:
        # Validate caller's scenario_id belongs to their org
        res_check = client.table("fair_scenarios").select("id").eq("id", request.scenario_id).eq("organization_id", user.organization_id).execute()
        if not res_check.data:
            raise HTTPException(status_code=403, detail="Scenario not found or access denied.")

    # Audit logging
    await run_in_threadpool(
        log_audit_event,
        organization_id=user.organization_id,
        user_id=user.user_id,
        action="RUN_FAIR_SCENARIO",
        resource_type="FAIR_CALCULATION",
        resource_id=request.scenario_id,
        new_value={"eal": float(result.eal), "p50": float(result.p50)}
    )

    client.table("fair_results").insert({
        "scenario_id": request.scenario_id,
        "tef": float(result.tef_mean),
        "susceptibility": float(result.susceptibility_mean),
        "lef": float(result.lef_mean),
        "primary_loss": float(result.primary_loss_mean),
        "secondary_loss": float(result.secondary_loss_mean),
        "total_loss": float(result.total_loss_mean),
        "p10": float(result.p10),
        "p50": float(result.p50),
        "p90": float(result.p90),
        "eal": float(result.eal)
    }).execute()
    
    result.scenario_id = request.scenario_id
    result.scenario_name = request.scenario_name
    return result.model_dump()

@router.get("/latest")
async def get_latest_fair_result(user: AuthenticatedUser = Depends(require_read_access())):
    client = get_supabase_client()
    
    # Find all legitimate scenarios for the organization
    scenarios_res = client.table("fair_scenarios").select("id, name").eq("organization_id", user.organization_id).execute()
    if not scenarios_res.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No FAIR results found")
        
    scenario_ids = [s["id"] for s in scenarios_res.data]
    scenario_map = {s["id"]: s["name"] for s in scenarios_res.data}
    
    res = client.table("fair_results").select("*").in_("scenario_id", scenario_ids).order("created_at", desc=True).limit(1).execute()
    if not res.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No FAIR results found")
    
    db_row = res.data[0]
    return {
        "scenario_id": db_row.get("scenario_id"),
        "scenario_name": scenario_map.get(db_row.get("scenario_id"), "Unknown Scenario"),
        "tef_mean": db_row.get("tef", 0),
        "susceptibility_mean": db_row.get("susceptibility", 0),
        "lef_mean": db_row.get("lef", 0),
        "primary_loss_mean": db_row.get("primary_loss", 0),
        "secondary_loss_mean": db_row.get("secondary_loss", 0),
        "total_loss_mean": db_row.get("total_loss", 0),
        "p10": db_row.get("p10", 0),
        "p50": db_row.get("p50", 0),
        "p90": db_row.get("p90", 0),
        "eal": db_row.get("eal", 0),
    }
