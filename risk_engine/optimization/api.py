from .models import OptimizationRequest, OptimizationResponse
from .solver import optimize_portfolio

def run_optimization_endpoint(request: dict) -> dict:
    """
    Mock FastAPI Endpoint /optimization/run
    Accepts JSON dictionary, validates via Pydantic, returns JSON.
    """
    req_obj = OptimizationRequest(**request)
    resp_obj = optimize_portfolio(req_obj)
    return resp_obj.model_dump()
