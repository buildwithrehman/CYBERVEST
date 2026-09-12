import numpy as np
from .distributions import sample_pert

def run_monte_carlo(tef_params, sus_params, loss_params_list, simulation_count, seed=None):
    '''
    Runs the Monte Carlo simulation using a Compound Poisson approach.
    
    1. Sample TEF (Threat Event Frequency) and Susceptibility (Probability).
    2. LEF (Loss Event Frequency) = TEF * Susceptibility.
    3. N = Poisson(LEF) events for each simulation year.
    4. For each event in N, sample from the Loss magnitude distributions and sum them.
    '''
    rng = np.random.default_rng(seed)
    
    # 1 & 2. Sample LEF
    tef_samples = sample_pert(tef_params.min_val, tef_params.likely_val, tef_params.max_val, simulation_count, rng)
    sus_samples = sample_pert(sus_params.min_val, sus_params.likely_val, sus_params.max_val, simulation_count, rng)
    lef_samples = tef_samples * sus_samples
    
    # 3. Sample N events per year (Poisson)
    event_counts = rng.poisson(lef_samples)
    
    annual_losses = np.zeros(simulation_count)
    avg_event_losses = np.zeros(simulation_count)
    
    # Process losses. We can optimize this by generating all needed loss samples at once.
    total_events = np.sum(event_counts)
    
    if total_events > 0:
        event_losses = np.zeros(total_events)
        for loss_p in loss_params_list:
            if loss_p.max_val > 0:
                event_losses += sample_pert(loss_p.min_val, loss_p.likely_val, loss_p.max_val, total_events, rng)
                
        # 4. Sum losses per simulation year
        # np.split creates a list of arrays based on cumulative event counts
        split_indices = np.cumsum(event_counts)[:-1]
        grouped_losses = np.split(event_losses, split_indices)
        
        for i in range(simulation_count):
            if event_counts[i] > 0:
                annual_losses[i] = np.sum(grouped_losses[i])
                avg_event_losses[i] = np.mean(grouped_losses[i])
            else:
                annual_losses[i] = 0
                avg_event_losses[i] = np.nan
    else:
        avg_event_losses[:] = np.nan
            
    return {
        "tef": tef_samples,
        "susceptibility": sus_samples,
        "lef": lef_samples,
        "annual_loss": annual_losses,
        "avg_event_losses": avg_event_losses
    }
