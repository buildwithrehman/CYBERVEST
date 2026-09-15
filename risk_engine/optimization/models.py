from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class RiskReductionParameters(BaseModel):
    tef_multiplier: float = 1.0
    susceptibility_multiplier: float = 1.0
    productivity_loss_multiplier: float = 1.0
    response_cost_multiplier: float = 1.0
    regulatory_loss_multiplier: float = 1.0
    reputation_loss_multiplier: float = 1.0

class Mitigation(BaseModel):
    id: str
    name: str
    description: str
    category: str
    cost: float
    implementation_time: int
    risk_reduction_parameters: RiskReductionParameters
    affected_assets: Optional[List[str]] = None
    affected_risk_drivers: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    minimum_budget: Optional[float] = None
    maximum_budget: Optional[float] = None
    status: str = "proposed"

class OptimizationConstraints(BaseModel):
    mutual_exclusions: Optional[List[List[str]]] = None
    max_mitigations: Optional[int] = None
    # We could add more constraints here if needed

class OptimizationRequest(BaseModel):
    organization_id: str = Field(..., max_length=100)
    budget: float = Field(..., ge=0)
    mitigations: List[Mitigation] = Field(..., max_length=100)
    constraints: Optional[OptimizationConstraints] = None
    baseline_scenario: Dict[str, Any]

class SelectedMitigationDetail(BaseModel):
    id: str
    name: str
    cost: float
    modeled_eal_reduction: float
    risk_drivers_affected: Optional[List[str]]
    dependencies: Optional[List[str]]
    assumptions: List[str]
    reason_for_selection: str

class OptimizationResponse(BaseModel):
    status: str
    portfolio_validation: str
    feasible_portfolio_count: int
    evaluated_portfolio_count: int
    mip_exact_match: bool
    budget: float
    selected_mitigations: List[SelectedMitigationDetail]
    total_investment: float
    remaining_budget: float
    baseline_eal: float
    optimized_eal: float
    absolute_risk_reduction: float
    percentage_risk_reduction: float
    rosi: float
    portfolio_score: float
    constraints: Dict[str, Any]
    assumptions: List[str]
    calculation_version: str
