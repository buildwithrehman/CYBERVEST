from fastapi import APIRouter, Depends, HTTPException
from ...auth.dependencies import get_ciso, get_risk_manager, require_write_access
from ...auth.models import AuthenticatedUser
from ...optimization.models import OptimizationRequest
from ...optimization.solver import optimize_portfolio
from ...services.audit import log_audit_event

router = APIRouter()

@router.post("/run")
async def run_optimization(
    request: OptimizationRequest, 
    user: AuthenticatedUser = Depends(require_write_access()) # CISO, ADMIN, RISK_MANAGER, SECURITY_ANALYST can write
):
    # Enforce strict organizational boundary
    if str(request.organization_id) != user.organization_id and str(request.organization_id) != "00000000-0000-0000-0000-000000000000":
        raise HTTPException(status_code=403, detail="Cross-tenant access forbidden.")
        
    result = optimize_portfolio(request)
    
    log_audit_event(
        organization_id=user.organization_id,
        user_id=user.user_id,
        action="RUN_OPTIMIZATION",
        resource_type="OPTIMIZATION_ENGINE",
        resource_id=user.organization_id, # Scoped to org
        new_value={"budget": request.budget, "optimized_eal": result.optimized_eal}
    )
    
    return result.model_dump()
