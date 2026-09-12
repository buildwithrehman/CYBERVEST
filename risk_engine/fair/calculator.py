import numpy as np
from .models import FAIRScenarioInput, FAIRResultOutput
from .monte_carlo import run_monte_carlo
from .distributions import sample_pert
from .drivers import calculate_risk_drivers

def calculate_fair(scenario: FAIRScenarioInput) -> FAIRResultOutput:
    # Prepare all loss parameters
    loss_params = [
        scenario.productivity_loss, 
        scenario.response_cost, 
        scenario.regulatory_loss, 
        scenario.reputation_loss
    ]
    
    # Run Monte Carlo
    results = run_monte_carlo(
        scenario.tef, 
        scenario.susceptibility, 
        loss_params, 
        scenario.simulation_count, 
        scenario.seed
    )
    
    annual_losses = results["annual_loss"]
    avg_event_losses = results["avg_event_losses"]
    
    drivers = calculate_risk_drivers(results["tef"], results["susceptibility"], avg_event_losses, annual_losses)
    
    # Means of distributions
    rng = np.random.default_rng(scenario.seed)
    tef_mean = np.mean(results["tef"])
    sus_mean = np.mean(results["susceptibility"])
    lef_mean = np.mean(results["lef"])
    
    # P10, P50, P90, EAL
    p10 = np.percentile(annual_losses, 10)
    p50 = np.percentile(annual_losses, 50)
    p90 = np.percentile(annual_losses, 90)
    eal = np.mean(annual_losses)
    
    # To get primary vs secondary loss averages, we sample them directly for the mean estimates
    primary_loss_samples = sample_pert(scenario.productivity_loss.min_val, scenario.productivity_loss.likely_val, scenario.productivity_loss.max_val, scenario.simulation_count, rng) +                            sample_pert(scenario.response_cost.min_val, scenario.response_cost.likely_val, scenario.response_cost.max_val, scenario.simulation_count, rng)
                           
    secondary_loss_samples = sample_pert(scenario.regulatory_loss.min_val, scenario.regulatory_loss.likely_val, scenario.regulatory_loss.max_val, scenario.simulation_count, rng) +                              sample_pert(scenario.reputation_loss.min_val, scenario.reputation_loss.likely_val, scenario.reputation_loss.max_val, scenario.simulation_count, rng)
                             
    # Note: These are single event loss means, not annualized
    primary_mean = np.mean(primary_loss_samples)
    secondary_mean = np.mean(secondary_loss_samples)
    total_mean = primary_mean + secondary_mean
    
    return FAIRResultOutput(
        scenario_id=scenario.scenario_id,
        scenario_name=scenario.scenario_name,
        model_version="FAIR-v1.0-Compound-Poisson",
        simulation_count=scenario.simulation_count,
        tef_mean=round(float(tef_mean), 4),
        susceptibility_mean=round(float(sus_mean), 4),
        lef_mean=round(float(lef_mean), 4),
        primary_loss_mean=round(float(primary_mean), 2),
        secondary_loss_mean=round(float(secondary_mean), 2),
        total_loss_mean=round(float(total_mean), 2),
        p10=round(float(p10), 2),
        p50=round(float(p50), 2),
        p90=round(float(p90), 2),
        eal=round(float(eal), 2),
        risk_drivers=drivers,
        assumptions=scenario.assumptions,
        confidence=scenario.confidence,
        source_type=scenario.source_type
    )
