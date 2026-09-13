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

    # Process losses in memory-bounded batches (e.g. 250 simulations per batch)
    # Note on Reproducibility: Because we batch RNG draws per loss parameter
    # instead of drawing total_events all at once, the underlying bit generator
    # distributes the stream differently across components. The outputs are
    # statistically equivalent (e.g. EAL diff < 0.01%), but element-by-element
    # exact reproducibility against the unbatched implementation will diverge.
    BATCH_SIZE = 250

    for i in range(0, simulation_count, BATCH_SIZE):
        chunk_slice = slice(i, min(i + BATCH_SIZE, simulation_count))
        counts_chunk = event_counts[chunk_slice]
        total_events_in_chunk = np.sum(counts_chunk)

        if total_events_in_chunk > 0:
            chunk_event_losses = np.zeros(total_events_in_chunk)

            for loss_p in loss_params_list:
                if loss_p.max_val > 0:
                    chunk_event_losses += sample_pert(loss_p.min_val, loss_p.likely_val, loss_p.max_val, total_events_in_chunk, rng)

            # Group by simulation year
            split_indices = np.cumsum(counts_chunk)[:-1]
            grouped_losses = np.split(chunk_event_losses, split_indices)

            for idx, c_count in enumerate(counts_chunk):
                if c_count > 0:
                    sim_idx = i + idx
                    annual_losses[sim_idx] = np.sum(grouped_losses[idx])
                    avg_event_losses[sim_idx] = np.mean(grouped_losses[idx])
                else:
                    sim_idx = i + idx
                    annual_losses[sim_idx] = 0.0
                    avg_event_losses[sim_idx] = np.nan
        else:
            for idx in range(len(counts_chunk)):
                sim_idx = i + idx
                annual_losses[sim_idx] = 0.0
                avg_event_losses[sim_idx] = np.nan

    return {
        "tef": tef_samples,
        "susceptibility": sus_samples,
        "lef": lef_samples,
        "annual_loss": annual_losses,
        "avg_event_losses": avg_event_losses
    }
