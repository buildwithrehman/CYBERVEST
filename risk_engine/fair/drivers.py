import numpy as np
from scipy.stats import spearmanr

def calculate_risk_drivers(tef_samples, sus_samples, loss_samples, annual_losses):
    '''
    Uses Spearman rank-order correlation coefficient to identify which input 
    variables drive the most variance in the final annual loss.
    '''
    drivers = []
    
    # Avoid calculating correlation if output is completely flat (variance = 0)
    if np.var(annual_losses) == 0:
        return drivers
        
    for name, samples in [("TEF", tef_samples), ("Susceptibility", sus_samples), ("Loss_Magnitude", loss_samples)]:
        # Filter NaNs for years with zero events (specifically for Loss_Magnitude)
        valid_idx = ~np.isnan(samples)
        if np.sum(valid_idx) > 1 and np.var(samples[valid_idx]) > 0:
            corr, _ = spearmanr(samples[valid_idx], annual_losses[valid_idx])
            if not np.isnan(corr):
                drivers.append({"name": name, "importance": round(float(corr), 3)})
                
    # Sort by absolute correlation
    drivers.sort(key=lambda x: abs(x["importance"]), reverse=True)
    return drivers
