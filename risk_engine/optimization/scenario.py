from typing import List, Dict, Tuple
from ..fair.models import FAIRScenarioInput, PERTDistribution, SusceptibilityDistribution
from ..fair.calculator import calculate_fair, FAIRResultOutput
from .models import Mitigation

def apply_mitigations_to_scenario(baseline: FAIRScenarioInput, mitigations: List[Mitigation]) -> FAIRScenarioInput:
    """
    Applies a combination of mitigations to a baseline FAIR scenario and returns a new scenario.
    Multipliers are multiplied to avoid double-counting additive risk reduction.
    """
    tef_mult = 1.0
    sus_mult = 1.0
    prod_mult = 1.0
    resp_mult = 1.0
    reg_mult = 1.0
    rep_mult = 1.0
    
    for m in mitigations:
        tef_mult *= m.risk_reduction_parameters.tef_multiplier
        sus_mult *= m.risk_reduction_parameters.susceptibility_multiplier
        prod_mult *= m.risk_reduction_parameters.productivity_loss_multiplier
        resp_mult *= m.risk_reduction_parameters.response_cost_multiplier
        reg_mult *= m.risk_reduction_parameters.regulatory_loss_multiplier
        rep_mult *= m.risk_reduction_parameters.reputation_loss_multiplier
        
    # Create new distributions
    # Susceptibility is capped at 1.0, and floor at 0.0
    def scale_pert(pert: PERTDistribution, mult: float, is_sus: bool = False):
        new_min = pert.min_val * mult
        new_likely = pert.likely_val * mult
        new_max = pert.max_val * mult
        
        if is_sus:
            new_min = max(0.0, min(1.0, new_min))
            new_likely = max(0.0, min(1.0, new_likely))
            new_max = max(0.0, min(1.0, new_max))
            return SusceptibilityDistribution(min_val=new_min, likely_val=new_likely, max_val=new_max)
        else:
            return PERTDistribution(min_val=new_min, likely_val=new_likely, max_val=new_max)
            
    # Modify assumptions slightly to show it's mitigated
    new_assumptions = baseline.assumptions.copy()
    new_assumptions['applied_mitigations'] = [m.name for m in mitigations]
    
    return FAIRScenarioInput(
        scenario_id=f"{baseline.scenario_id}_mitigated",
        scenario_name=f"{baseline.scenario_name} (Mitigated)",
        tef=scale_pert(baseline.tef, tef_mult),
        susceptibility=scale_pert(baseline.susceptibility, sus_mult, True),
        productivity_loss=scale_pert(baseline.productivity_loss, prod_mult),
        response_cost=scale_pert(baseline.response_cost, resp_mult),
        regulatory_loss=scale_pert(baseline.regulatory_loss, reg_mult),
        reputation_loss=scale_pert(baseline.reputation_loss, rep_mult),
        simulation_count=baseline.simulation_count,
        seed=baseline.seed,
        source_type="optimization",
        confidence=baseline.confidence,
        assumptions=new_assumptions
    )

def evaluate_portfolio(baseline: FAIRScenarioInput, mitigations: List[Mitigation]) -> Tuple[FAIRResultOutput, float, float]:
    """
    Evaluates a specific portfolio of mitigations.
    Returns:
    - FAIR result for the mitigated scenario
    - Absolute Risk Reduction (Baseline EAL - Mitigated EAL)
    - Total cost of the portfolio
    """
    baseline_result = calculate_fair(baseline)
    
    if not mitigations:
        return baseline_result, 0.0, 0.0
        
    mitigated_scenario = apply_mitigations_to_scenario(baseline, mitigations)
    mitigated_result = calculate_fair(mitigated_scenario)
    
    absolute_reduction = max(0.0, baseline_result.eal - mitigated_result.eal)
    total_cost = sum(m.cost for m in mitigations)
    
    return mitigated_result, absolute_reduction, total_cost
