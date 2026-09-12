import pytest
import numpy as np
from risk_engine.ml.fair_transformation import ml_prob_to_annual_lef, can_derive_fair_inputs_from_ml

def test_probability_bounds():
    # Valid probabilities
    assert ml_prob_to_annual_lef(0.0) == 0.0
    assert ml_prob_to_annual_lef(0.5) > 0.0
    
    # Invalid probabilities
    with pytest.raises(ValueError):
        ml_prob_to_annual_lef(-0.1)
    with pytest.raises(ValueError):
        ml_prob_to_annual_lef(1.0) # LEF is infinite at p=1
    with pytest.raises(ValueError):
        ml_prob_to_annual_lef(1.5)

def test_time_horizon_consistency():
    # If p=0.5 for 15 days, lambda_15 = -ln(0.5) = 0.693
    # LEF_annual = 0.693 * (365.25 / 15) = 16.879
    lef_15 = ml_prob_to_annual_lef(0.5, horizon_days=15)
    assert np.isclose(lef_15, 16.879, atol=0.01)
    
    # If horizon is 1 year (365.25 days), LEF should just be -ln(1-p)
    lef_year = ml_prob_to_annual_lef(0.5, horizon_days=365.25)
    assert np.isclose(lef_year, 0.693, atol=0.01)

def test_monotonicity():
    # Higher probability -> Higher LEF
    p_low = 0.1
    p_med = 0.5
    p_high = 0.9
    
    lef_low = ml_prob_to_annual_lef(p_low)
    lef_med = ml_prob_to_annual_lef(p_med)
    lef_high = ml_prob_to_annual_lef(p_high)
    
    assert lef_low < lef_med < lef_high

def test_edge_cases():
    # Extremely small probability
    lef_tiny = ml_prob_to_annual_lef(1e-6)
    assert lef_tiny > 0.0
    assert lef_tiny < 1e-3
    
    # Extremely high probability
    lef_huge = ml_prob_to_annual_lef(0.9999)
    assert lef_huge > 200.0 # -ln(0.0001) = 9.2 * 24 = ~220

def test_underdetermined_system():
    # Must explicitly state it is false
    assert can_derive_fair_inputs_from_ml(0.5) is False
