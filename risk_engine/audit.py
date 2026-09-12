import numpy as np
from scipy.stats import spearmanr, poisson

from risk_engine.fair.models import FAIRScenarioInput, PERTDistribution, SusceptibilityDistribution
from risk_engine.fair.distributions import sample_pert
from risk_engine.fair.calculator import calculate_fair
from risk_engine.fair.monte_carlo import run_monte_carlo
import time
import os

def get_base_scenario():
    return FAIRScenarioInput(
        scenario_id="123",
        scenario_name="Test",
        tef=PERTDistribution(min_val=2.0, likely_val=10.0, max_val=25.0),
        susceptibility=SusceptibilityDistribution(min_val=0.4, likely_val=0.6, max_val=0.9),
        productivity_loss=PERTDistribution(min_val=100000, likely_val=500000, max_val=2000000),
        response_cost=PERTDistribution(min_val=50000, likely_val=100000, max_val=300000),
        regulatory_loss=PERTDistribution(min_val=0, likely_val=0, max_val=1000000),
        reputation_loss=PERTDistribution(min_val=0, likely_val=200000, max_val=1500000),
        simulation_count=10000,
        seed=20260907
    )

def audit_driver_bug():
    print("--- AUDIT: RISK DRIVER DISCREPANCY ---")
    scen = get_base_scenario()
    
    # 1. Show that the current method yields 0 correlation because of independent draws
    res = calculate_fair(scen)
    print("Current Drivers:", res.risk_drivers)
    
    # Let's extract the actual average loss per event from grouped_losses if we instrument monte_carlo
    # We will write a patched run_monte_carlo here to see the true correlation
    
    rng = np.random.default_rng(scen.seed)
    tef_samples = sample_pert(scen.tef.min_val, scen.tef.likely_val, scen.tef.max_val, scen.simulation_count, rng)
    sus_samples = sample_pert(scen.susceptibility.min_val, scen.susceptibility.likely_val, scen.susceptibility.max_val, scen.simulation_count, rng)
    lef_samples = tef_samples * sus_samples
    
    event_counts = rng.poisson(lef_samples)
    total_events = np.sum(event_counts)
    
    loss_params_list = [scen.productivity_loss, scen.response_cost, scen.regulatory_loss, scen.reputation_loss]
    event_losses = np.zeros(total_events)
    for p in loss_params_list:
        event_losses += sample_pert(p.min_val, p.likely_val, p.max_val, total_events, rng)
        
    split_indices = np.cumsum(event_counts)[:-1]
    grouped_losses = np.split(event_losses, split_indices)
    
    annual_losses = np.zeros(scen.simulation_count)
    avg_event_losses = np.zeros(scen.simulation_count)
    
    for i in range(scen.simulation_count):
        if event_counts[i] > 0:
            annual_losses[i] = np.sum(grouped_losses[i])
            avg_event_losses[i] = np.mean(grouped_losses[i])
        else:
            annual_losses[i] = 0
            avg_event_losses[i] = np.nan
            
    # Calculate spearman correlation on non-zero years
    valid_idx = ~np.isnan(avg_event_losses)
    if np.sum(valid_idx) > 0:
        corr_loss, _ = spearmanr(avg_event_losses[valid_idx], annual_losses[valid_idx])
        print(f"True Spearman Correlation (Loss Magnitude | N > 0) vs Annual Loss: {corr_loss:.3f}")
    
    # TEF and Susc correlations on all years
    corr_tef, _ = spearmanr(tef_samples, annual_losses)
    corr_sus, _ = spearmanr(sus_samples, annual_losses)
    print(f"TEF Correlation: {corr_tef:.3f}")
    print(f"Susc Correlation: {corr_sus:.3f}")

def audit_analytical_sanity():
    print("\\n--- AUDIT: ANALYTICAL SANITY CHECK ---")
    scen = get_base_scenario()
    
    # Expected TEF
    mean_tef = (scen.tef.min_val + 4*scen.tef.likely_val + scen.tef.max_val) / 6.0
    # Expected Susceptibility
    mean_sus = (scen.susceptibility.min_val + 4*scen.susceptibility.likely_val + scen.susceptibility.max_val) / 6.0
    # Expected LEF (TEF and Susc are independent)
    expected_lef = mean_tef * mean_sus
    
    # Expected Loss Magnitude per event
    expected_loss = 0
    for p in [scen.productivity_loss, scen.response_cost, scen.regulatory_loss, scen.reputation_loss]:
        expected_loss += (p.min_val + 4*p.likely_val + p.max_val) / 6.0
        
    analytical_eal = expected_lef * expected_loss
    
    res = calculate_fair(scen)
    
    print(f"Analytical EAL: {analytical_eal:,.2f}")
    print(f"Monte Carlo EAL: {res.eal:,.2f}")
    print(f"Relative Error: {abs(analytical_eal - res.eal) / analytical_eal * 100:.3f}%")

def audit_zero_loss():
    print("\\n--- AUDIT: ZERO-LOSS YEARS ---")
    scen = get_base_scenario()
    # Force very low LEF
    scen.tef = PERTDistribution(min_val=0.01, likely_val=0.05, max_val=0.1)
    res = calculate_fair(scen)
    
    mean_tef = (0.01 + 4*0.05 + 0.1) / 6.0
    mean_sus = (0.4 + 4*0.6 + 0.9) / 6.0
    expected_lef = mean_tef * mean_sus
    
    analytical_p0 = np.exp(-expected_lef)
    
    # We must run monte carlo to get the raw zero loss count since calculate_fair doesn't return it
    mc_res = run_monte_carlo(scen.tef, scen.susceptibility, [scen.productivity_loss, scen.response_cost, scen.regulatory_loss, scen.reputation_loss], scen.simulation_count, scen.seed)
    
    mc_p0 = np.sum(mc_res['annual_loss'] == 0) / scen.simulation_count
    
    print(f"Analytical P(N=0) ≈ {analytical_p0:.4f}")
    print(f"Monte Carlo P(N=0) = {mc_p0:.4f}")

def run_performance():
    print("\\n--- AUDIT: PERFORMANCE ---")
    scen = get_base_scenario()
    start = time.perf_counter()
    res = calculate_fair(scen)
    end = time.perf_counter()
    print(f"Execution time (10,000 simulations): {(end - start) * 1000:.2f} ms")

if __name__ == "__main__":
    audit_driver_bug()
    audit_analytical_sanity()
    audit_zero_loss()
    run_performance()
