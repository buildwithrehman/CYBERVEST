import numpy as np

def ml_prob_to_annual_lef(p: float, horizon_days: int = 15) -> float:
    """
    Transforms an ML-predicted probability of AT LEAST ONE incident occurring
    within a specific time horizon into an annualized Loss Event Frequency (LEF).
    
    Assumptions:
    1. Incidents follow a homogeneous Poisson process.
    2. The probability output `p` represents P(N >= 1) in `horizon_days`.
    
    Formula:
    P(N >= 1) = 1 - exp(-lambda_horizon)
    lambda_horizon = -ln(1 - p)
    LEF_annual = lambda_horizon * (365.25 / horizon_days)
    
    Args:
        p (float): Probability of incident (0 <= p < 1)
        horizon_days (int): Time horizon in days
        
    Returns:
        float: Annualized LEF (point estimate)
        
    Raises:
        ValueError: If p < 0 or p >= 1 (at p=1, LEF approaches infinity)
    """
    if p < 0.0 or p >= 1.0:
        raise ValueError("Probability must be in the range [0, 1).")
    if horizon_days <= 0:
        raise ValueError("Horizon days must be strictly positive.")
        
    lambda_horizon = -np.log(1.0 - p)
    lef_annual = lambda_horizon * (365.25 / horizon_days)
    
    return lef_annual

def can_derive_fair_inputs_from_ml(p: float) -> bool:
    """
    Determines if FAIR TEF (Threat Event Frequency) and Susceptibility 
    can be mathematically derived from the ML incident probability.
    
    Returns:
        False, because the system is mathematically underdetermined.
        LEF = TEF * Susceptibility. 
        A single LEF point estimate cannot uniquely solve for two independent 
        variables (TEF and Susceptibility) without arbitrary assumptions.
        Furthermore, ML provides a point estimate, not the min/max variance 
        required for FAIR PERT distributions.
    """
    return False
