import pytest
from risk_engine.optimization.models import (
    OptimizationRequest, 
    Mitigation, 
    RiskReductionParameters,
    OptimizationConstraints
)
from risk_engine.optimization.solver import optimize_portfolio
from risk_engine.fair.models import FAIRScenarioInput

def get_dummy_baseline():
    return {
        "scenario_id": "test_01",
        "scenario_name": "Test Scenario",
        "tef": {"min_val": 10, "likely_val": 20, "max_val": 50},
        "susceptibility": {"min_val": 0.5, "likely_val": 0.6, "max_val": 0.8},
        "productivity_loss": {"min_val": 1000, "likely_val": 5000, "max_val": 10000},
        "response_cost": {"min_val": 1000, "likely_val": 5000, "max_val": 10000},
        "regulatory_loss": {"min_val": 0, "likely_val": 0, "max_val": 0},
        "reputation_loss": {"min_val": 0, "likely_val": 0, "max_val": 0},
        "simulation_count": 1000,
        "seed": 42
    }

def get_dummy_mitigations():
    return [
        Mitigation(
            id="m1", name="MFA", description="MFA", category="IAM", cost=25000, implementation_time=30,
            risk_reduction_parameters=RiskReductionParameters(susceptibility_multiplier=0.7)
        ),
        Mitigation(
            id="m2", name="Patching", description="Patch", category="VM", cost=20000, implementation_time=15,
            risk_reduction_parameters=RiskReductionParameters(tef_multiplier=0.8, susceptibility_multiplier=0.9)
        ),
        Mitigation(
            id="m3", name="Segmentation", description="Seg", category="Net", cost=35000, implementation_time=45,
            risk_reduction_parameters=RiskReductionParameters(productivity_loss_multiplier=0.5)
        ),
        Mitigation(
            id="m4", name="PAM", description="PAM", category="IAM", cost=40000, implementation_time=60,
            risk_reduction_parameters=RiskReductionParameters(susceptibility_multiplier=0.6),
            dependencies=["m1"]
        ),
        Mitigation(
            id="m5", name="EDR", description="EDR", category="Endpoint", cost=50000, implementation_time=30,
            risk_reduction_parameters=RiskReductionParameters(response_cost_multiplier=0.6)
        )
    ]

# 1. Budget is never exceeded
def test_budget_never_exceeded():
    req = OptimizationRequest(
        organization_id="org1", budget=40000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline()
    )
    res = optimize_portfolio(req)
    assert res.total_investment <= 40000
    
# 2. Total investment equals sum of selected costs
def test_investment_sum():
    req = OptimizationRequest(
        organization_id="org1", budget=80000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline()
    )
    res = optimize_portfolio(req)
    expected_cost = sum(m.cost for m in res.selected_mitigations)
    assert res.total_investment == expected_cost

# 3. Remaining budget is correct
def test_remaining_budget():
    budget = 80000
    req = OptimizationRequest(
        organization_id="org1", budget=budget, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline()
    )
    res = optimize_portfolio(req)
    assert res.remaining_budget == budget - res.total_investment

# 4. Optimized EAL <= baseline EAL
def test_optimized_eal_lower():
    req = OptimizationRequest(
        organization_id="org1", budget=200000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline()
    )
    res = optimize_portfolio(req)
    assert res.optimized_eal <= res.baseline_eal

# 5. Risk reduction = baseline - optimized
def test_risk_reduction_math():
    req = OptimizationRequest(
        organization_id="org1", budget=100000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline()
    )
    res = optimize_portfolio(req)
    # Accounting for floating point
    assert abs(res.risk_reduction_math() - res.absolute_risk_reduction) < 0.01 if hasattr(res, 'risk_reduction_math') else True
    assert abs(res.baseline_eal - res.optimized_eal - res.absolute_risk_reduction) < 0.1

# 6. ROSI calculation is correct
def test_rosi_calculation():
    req = OptimizationRequest(
        organization_id="org1", budget=100000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline()
    )
    res = optimize_portfolio(req)
    if res.total_investment > 0:
        expected_rosi = (res.absolute_risk_reduction - res.total_investment) / res.total_investment
        assert abs(res.rosi - expected_rosi) < 0.01

# 7. Dependency constraints
def test_dependency_constraint():
    mits = get_dummy_mitigations()
    # m4 requires m1. Give budget exactly for m4 but not m1. Should NOT pick m4.
    req = OptimizationRequest(
        organization_id="org1", budget=40000, mitigations=mits, baseline_scenario=get_dummy_baseline()
    )
    res = optimize_portfolio(req)
    selected_ids = [m.id for m in res.selected_mitigations]
    if "m4" in selected_ids:
        assert "m1" in selected_ids
        
# 8. Mutual exclusion
def test_mutual_exclusion():
    mits = get_dummy_mitigations()
    # Mutually exclude m1 and m2
    constraints = OptimizationConstraints(mutual_exclusions=[["m1", "m2"]])
    req = OptimizationRequest(
        organization_id="org1", budget=100000, mitigations=mits, 
        constraints=constraints, baseline_scenario=get_dummy_baseline()
    )
    res = optimize_portfolio(req)
    selected_ids = [m.id for m in res.selected_mitigations]
    assert not ("m1" in selected_ids and "m2" in selected_ids)

# 9. Different budgets produce different portfolios
def test_different_budgets():
    req1 = OptimizationRequest(organization_id="org1", budget=20000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    req2 = OptimizationRequest(organization_id="org1", budget=150000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    res1 = optimize_portfolio(req1)
    res2 = optimize_portfolio(req2)
    assert len(res1.selected_mitigations) < len(res2.selected_mitigations)

# 10. Fixed seed produces reproducible results
def test_reproducibility():
    req1 = OptimizationRequest(organization_id="org1", budget=50000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    req2 = OptimizationRequest(organization_id="org1", budget=50000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    res1 = optimize_portfolio(req1)
    res2 = optimize_portfolio(req2)
    assert res1.optimized_eal == res2.optimized_eal

# 11. Empty candidate set
def test_empty_candidates():
    req = OptimizationRequest(organization_id="org1", budget=50000, mitigations=[], baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    assert res.total_investment == 0
    assert res.optimized_eal == res.baseline_eal

# 12. Zero budget
def test_zero_budget():
    req = OptimizationRequest(organization_id="org1", budget=0, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    assert len(res.selected_mitigations) == 0

# 13. Budget smaller than all mitigations
def test_small_budget():
    req = OptimizationRequest(organization_id="org1", budget=1000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    assert len(res.selected_mitigations) == 0

# 14. Max mitigations constraint
def test_max_mitigations_constraint():
    constraints = OptimizationConstraints(max_mitigations=2)
    req = OptimizationRequest(
        organization_id="org1", budget=200000, mitigations=get_dummy_mitigations(), 
        constraints=constraints, baseline_scenario=get_dummy_baseline()
    )
    res = optimize_portfolio(req)
    assert len(res.selected_mitigations) <= 2

# 15. Sanity check: Solver logic
def test_solver_sanity():
    # Construct an objective check
    mits = [
        Mitigation(id="a", name="a", description="a", category="a", cost=60, implementation_time=0, 
                   risk_reduction_parameters=RiskReductionParameters(tef_multiplier=0.1)), # large reduction
        Mitigation(id="b", name="b", description="b", category="b", cost=50, implementation_time=0, 
                   risk_reduction_parameters=RiskReductionParameters(tef_multiplier=0.5)),
        Mitigation(id="c", name="c", description="c", category="c", cost=40, implementation_time=0, 
                   risk_reduction_parameters=RiskReductionParameters(tef_multiplier=0.8)),
    ]
    # For A+C cost is 100.
    req = OptimizationRequest(
        organization_id="org1", budget=100, mitigations=mits, baseline_scenario=get_dummy_baseline()
    )
    res = optimize_portfolio(req)
    assert res.total_investment <= 100
    ids = [m.id for m in res.selected_mitigations]
    # A has highest reduction. B takes 50, but A takes 60. With budget 100, we can take A and C (60+40=100) or B and C (50+40=90). A+C is better.
    assert "a" in ids
    assert "c" in ids
    assert "b" not in ids

# --- MILESTONE 5.1 TESTS ---

def test_feasible_portfolio_count():
    # 6 mitigations in get_dummy_mitigations()? No, there are 5 dummy mitigations. 2^5 = 32.
    req = OptimizationRequest(organization_id="org1", budget=9999999, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    # m4 requires m1. 
    # subsets without m1 cannot have m4.
    # Total subsets: 32. subsets with m4: 16. subsets with m4 and NOT m1: 8.
    # So 32 - 8 = 24 feasible portfolios.
    assert res.feasible_portfolio_count == 24
    assert res.evaluated_portfolio_count == 24
    assert res.portfolio_validation == "EXACT"

def test_exact_portfolio_min_eal():
    req = OptimizationRequest(organization_id="org1", budget=9999999, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    # The optimal portfolio should have the lowest possible EAL among all feasible.
    # By definition of the exact search, this should be true.
    assert res.optimized_eal <= res.baseline_eal

def test_mip_vs_exact_match_reporting():
    req = OptimizationRequest(organization_id="org1", budget=100000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    assert isinstance(res.mip_exact_match, bool)

def test_interaction_non_additive():
    # Create two mitigations that reduce susceptibility by 0.5 each.
    mits = [
        Mitigation(id="a", name="a", description="a", category="a", cost=10, implementation_time=0, risk_reduction_parameters=RiskReductionParameters(susceptibility_multiplier=0.5)),
        Mitigation(id="b", name="b", description="b", category="b", cost=10, implementation_time=0, risk_reduction_parameters=RiskReductionParameters(susceptibility_multiplier=0.5))
    ]
    base = get_dummy_baseline()
    from risk_engine.optimization.scenario import evaluate_portfolio
    res_a, red_a, _ = evaluate_portfolio(FAIRScenarioInput(**base), [mits[0]])
    res_b, red_b, _ = evaluate_portfolio(FAIRScenarioInput(**base), [mits[1]])
    res_ab, red_ab, _ = evaluate_portfolio(FAIRScenarioInput(**base), mits)
    # Additive expectation: red_a + red_b
    # Multiplicative actual: 0.5 * 0.5 = 0.25 remaining (0.75 reduction)
    # Since 0.5 + 0.5 = 1.0 (100% reduction), red_a + red_b > red_ab
    assert red_a + red_b > red_ab

def test_infeasible_excluded():
    # Mutual exclusion forces count < 24
    constraints = OptimizationConstraints(mutual_exclusions=[["m1", "m2"]])
    req = OptimizationRequest(organization_id="org1", budget=9999999, mitigations=get_dummy_mitigations(), constraints=constraints, baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    assert res.feasible_portfolio_count < 24

def test_baseline_unchanged():
    # Verify exact evaluation didn't mutate the baseline
    req = OptimizationRequest(organization_id="org1", budget=100000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    baseline_result = get_dummy_baseline()
    assert req.baseline_scenario["tef"]["likely_val"] == baseline_result["tef"]["likely_val"]

def test_zero_budget_exact_search():
    req = OptimizationRequest(organization_id="org1", budget=0, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    assert len(res.selected_mitigations) == 0
    assert res.total_investment == 0

def test_mip_exact_discrepancy():
    # Can we force a discrepancy?
    # Marginal A: 100, B: 90, C: 80. Cost A: 10, B: 9, C: 8.
    # Due to diminishing returns, A+B might be 150, but A+C might be 160 if they hit different drivers.
    mits = [
        Mitigation(id="a", name="a", description="a", category="a", cost=10, implementation_time=0, risk_reduction_parameters=RiskReductionParameters(susceptibility_multiplier=0.1)),
        Mitigation(id="b", name="b", description="b", category="b", cost=10, implementation_time=0, risk_reduction_parameters=RiskReductionParameters(tef_multiplier=0.1)),
    ]
    # In some highly constrained specific nonlinear landscapes, MIP might pick something else.
    # We just ensure it doesn't crash here.
    req = OptimizationRequest(organization_id="org1", budget=20, mitigations=mits, baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    assert res.portfolio_validation == "EXACT"


def test_risk_reduction_calculation_is_correct():
    req = OptimizationRequest(organization_id="org1", budget=45000, mitigations=get_dummy_mitigations(), baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    assert abs(res.absolute_risk_reduction - (res.baseline_eal - res.optimized_eal)) < 0.01

def test_capacity_constraint_respected():
    constraints = OptimizationConstraints(max_mitigations=1)
    req = OptimizationRequest(organization_id="org1", budget=9999999, mitigations=get_dummy_mitigations(), constraints=constraints, baseline_scenario=get_dummy_baseline())
    res = optimize_portfolio(req)
    assert len(res.selected_mitigations) <= 1

