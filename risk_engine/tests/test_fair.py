import pytest
import numpy as np
from pydantic import ValidationError
from risk_engine.fair.models import FAIRScenarioInput, PERTDistribution, SusceptibilityDistribution
from risk_engine.fair.distributions import sample_pert
from risk_engine.fair.calculator import calculate_fair
from risk_engine.fair.monte_carlo import run_monte_carlo

def get_base_scenario():
    return FAIRScenarioInput(
        scenario_id="123",
        scenario_name="Test",
        tef=PERTDistribution(min_val=1.0, likely_val=5.0, max_val=10.0),
        susceptibility=SusceptibilityDistribution(min_val=0.1, likely_val=0.5, max_val=0.9),
        productivity_loss=PERTDistribution(min_val=1000, likely_val=5000, max_val=10000),
        response_cost=PERTDistribution(min_val=0, likely_val=0, max_val=0),
        regulatory_loss=PERTDistribution(min_val=0, likely_val=0, max_val=0),
        reputation_loss=PERTDistribution(min_val=0, likely_val=0, max_val=0),
        simulation_count=10000,
        seed=42
    )

def test_1_valid_pert_bounds():
    samples = sample_pert(10, 20, 30, size=1000)
    assert np.all(samples >= 10)
    assert np.all(samples <= 30)

def test_2_invalid_pert_bounds():
    with pytest.raises(ValidationError):
        PERTDistribution(min_val=30, likely_val=20, max_val=10)

def test_3_susceptibility_bounds():
    s = SusceptibilityDistribution(min_val=0.1, likely_val=0.5, max_val=0.9)
    assert s.min_val >= 0 and s.max_val <= 1
    with pytest.raises(ValidationError):
        SusceptibilityDistribution(min_val=0.1, likely_val=1.5, max_val=2.0)

def test_4_lef_relationship():
    scen = get_base_scenario()
    res = calculate_fair(scen)
    # Means are approximately E[TEF]*E[Susceptibility] since they are independent
    expected_lef = res.tef_mean * res.susceptibility_mean
    assert np.isclose(res.lef_mean, expected_lef, rtol=0.05)

def test_5_loss_components_sum():
    scen = get_base_scenario()
    res = calculate_fair(scen)
    assert np.isclose(res.primary_loss_mean + res.secondary_loss_mean, res.total_loss_mean)

def test_6_percentile_ordering():
    scen = get_base_scenario()
    res = calculate_fair(scen)
    assert res.p10 <= res.p50 <= res.p90

def test_7_eal_is_mean():
    # EAL should be the mean of annual loss distribution
    scen = get_base_scenario()
    res = run_monte_carlo(scen.tef, scen.susceptibility, [scen.productivity_loss], scen.simulation_count, scen.seed)
    mean_annual_loss = np.mean(res['annual_loss'])
    fair_res = calculate_fair(scen)
    assert np.isclose(mean_annual_loss, fair_res.eal, rtol=0.01)

def test_8_increasing_tef_increases_eal():
    s1 = get_base_scenario()
    s2 = get_base_scenario()
    s2.tef = PERTDistribution(min_val=20.0, likely_val=50.0, max_val=100.0)

    r1 = calculate_fair(s1)
    r2 = calculate_fair(s2)
    assert r2.eal > r1.eal

def test_9_increasing_susceptibility_increases_eal():
    s1 = get_base_scenario()
    s2 = get_base_scenario()
    s2.susceptibility = SusceptibilityDistribution(min_val=0.8, likely_val=0.9, max_val=0.99)

    r1 = calculate_fair(s1)
    r2 = calculate_fair(s2)
    assert r2.eal > r1.eal

def test_10_increasing_loss_increases_eal():
    s1 = get_base_scenario()
    s2 = get_base_scenario()
    s2.productivity_loss = PERTDistribution(min_val=100000, likely_val=500000, max_val=1000000)

    r1 = calculate_fair(s1)
    r2 = calculate_fair(s2)
    assert r2.eal > r1.eal

def test_12_deterministic_seed():
    s1 = get_base_scenario()
    s2 = get_base_scenario()
    r1 = calculate_fair(s1)
    r2 = calculate_fair(s2)
    assert r1.eal == r2.eal
    assert r1.p90 == r2.p90

def test_13_zero_loss_years():
    # Using Compound Poisson, if LEF is very low, many years should have 0 loss.
    scen = get_base_scenario()
    scen.tef = PERTDistribution(min_val=0.01, likely_val=0.05, max_val=0.1)
    res = run_monte_carlo(scen.tef, scen.susceptibility, [scen.productivity_loss], scen.simulation_count, scen.seed)
    zero_years = np.sum(res['annual_loss'] == 0)
    assert zero_years > (scen.simulation_count * 0.5) # At least 50% of years should have 0 loss

def test_api_endpoint_structure(monkeypatch):
    # Test the API endpoint directly to ensure run_in_threadpool doesn't alter response
    from fastapi.testclient import TestClient
    from risk_engine.main import app
    from risk_engine.auth.dependencies import get_current_user
    from risk_engine.auth.models import AuthenticatedUser
    from risk_engine.auth.models import Role

    # Mock authentication
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        user_id="11111111-1111-1111-1111-111111111111",
        email="test@example.com",
        organization_id="11111111-1111-1111-1111-111111111111",
        role=Role.ADMIN
    )

    
    from unittest.mock import MagicMock
    mock = MagicMock()
    mock.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [{"id": "123"}]
    monkeypatch.setattr("risk_engine.api.routers.fair.get_supabase_client", lambda t: mock)

    client = TestClient(app)

    # We use a very fast scenario to ensure tests complete quickly
    fast_scenario = {
        "scenario_id": "fast_test",
        "scenario_name": "Fast API Test",
        "tef": {"min_val": 1.0, "likely_val": 5.0, "max_val": 10.0},
        "susceptibility": {"min_val": 0.1, "likely_val": 0.5, "max_val": 0.9},
        "productivity_loss": {"min_val": 1000, "likely_val": 5000, "max_val": 10000},
        "response_cost": {"min_val": 0, "likely_val": 0, "max_val": 0},
        "regulatory_loss": {"min_val": 0, "likely_val": 0, "max_val": 0},
        "reputation_loss": {"min_val": 0, "likely_val": 0, "max_val": 0},
        "simulation_count": 1000,
        "seed": 42,
        "organization_id": "11111111-1111-1111-1111-111111111111"
    }

    response = client.post("/api/fair/run", json=fast_scenario)
    assert response.status_code == 200, response.text
    data = response.json()

    # Validate structure
    assert "eal" in data
    assert "p10" in data
    assert "p50" in data
    assert "p90" in data
    assert data["scenario_id"] == "fast_test"

    # Clear overrides
    app.dependency_overrides = {}

def test_fair_memory_bounded_execution(monkeypatch):
    """
    Regression test to ensure the DemoFin 10,000-simulation scenario
    completes without violating Render's 512 MB memory limit.
    """
    import tracemalloc
    from risk_engine.fair.models import FAIRScenarioInput
    from risk_engine.fair.calculator import calculate_fair

    payload = {
      "scenario_id": "baseline",
      "scenario_name": "Annual Baseline Exposure",
      "organization_id": "00000000-0000-0000-0000-000000000001",
      "tef": {"min_val": 100, "likely_val": 14200, "max_val": 20000},
      "susceptibility": {"min_val": 0.2, "likely_val": 0.44, "max_val": 0.8},
      "productivity_loss": {"min_val": 500000, "likely_val": 2000000, "max_val": 5000000},
      "response_cost": {"min_val": 100000, "likely_val": 500000, "max_val": 1500000},
      "regulatory_loss": {"min_val": 50000, "likely_val": 150000, "max_val": 2000000},
      "reputation_loss": {"min_val": 200000, "likely_val": 800000, "max_val": 3000000},
      "simulation_count": 10000
    }
    req = FAIRScenarioInput(**payload)

    tracemalloc.start()
    res = calculate_fair(req)
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    # Assert Peak memory is under 300 MB (safely below 512 MB)
    assert peak < 300 * 1024 * 1024, f"Peak memory was {peak / 10**6} MB, exceeds 300 MB budget"

    # Assert mathematical invariants
    assert res.p10 <= res.p50 <= res.p90
    assert res.eal > 0
