from pydantic import BaseModel, Field, model_validator
from typing import Optional, Dict, Any, List

class PERTDistribution(BaseModel):
    min_val: float = Field(..., ge=0)
    likely_val: float = Field(..., ge=0)
    max_val: float = Field(..., ge=0)

    @model_validator(mode='after')
    def check_bounds(self) -> 'PERTDistribution':
        if not (self.min_val <= self.likely_val <= self.max_val):
            raise ValueError(f"PERT bounds invalid: min({self.min_val}) <= likely({self.likely_val}) <= max({self.max_val}) is violated.")
        return self

class SusceptibilityDistribution(PERTDistribution):
    min_val: float = Field(..., ge=0, le=1)
    likely_val: float = Field(..., ge=0, le=1)
    max_val: float = Field(..., ge=0, le=1)

class FAIRScenarioInput(BaseModel):
    scenario_id: str
    scenario_name: str
    organization_id: Optional[str] = None
    
    tef: PERTDistribution
    susceptibility: SusceptibilityDistribution
    
    productivity_loss: PERTDistribution
    response_cost: PERTDistribution
    regulatory_loss: PERTDistribution
    reputation_loss: PERTDistribution
    
    simulation_count: int = Field(default=10000, ge=1)
    seed: Optional[int] = None
    
    source_type: str = "synthetic"
    confidence: str = "medium"
    assumptions: Dict[str, Any] = Field(default_factory=dict)
    probability_distribution: str = "PERT"
    
class RiskDriver(BaseModel):
    name: str
    importance: float

class FAIRResultOutput(BaseModel):
    scenario_id: str
    scenario_name: str
    model_version: str
    simulation_count: int
    
    tef_mean: float
    susceptibility_mean: float
    lef_mean: float
    
    primary_loss_mean: float
    secondary_loss_mean: float
    total_loss_mean: float
    
    p10: float
    p50: float
    p90: float
    eal: float
    
    risk_drivers: List[RiskDriver]
    assumptions: Dict[str, Any]
    confidence: str
    source_type: str
