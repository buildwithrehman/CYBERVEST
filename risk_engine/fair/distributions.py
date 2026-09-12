import numpy as np
from scipy.stats import beta

def sample_pert(min_val, likely_val, max_val, size, random_state=None):
    '''
    Samples from a PERT distribution using the Beta distribution transformation.
    The PERT distribution is commonly used in risk analysis (like FAIR) because it 
    allows subject matter experts to estimate optimistic (min), most likely (mode), 
    and pessimistic (max) values.
    
    Mean = (min + 4*likely + max) / 6
    Alpha = 1 + 4 * (likely - min) / (max - min)
    Beta = 1 + 4 * (max - likely) / (max - min)
    '''
    if min_val == max_val:
        return np.full(size, min_val)
        
    rng = np.random.default_rng(random_state)
    
    if min_val > max_val or min_val > likely_val or likely_val > max_val:
        raise ValueError("Invalid PERT parameters")
        
    range_val = max_val - min_val
    mean = (min_val + 4 * likely_val + max_val) / 6.0
    
    if mean == min_val:
        alpha = 1.0
        beta_param = 5.0
    elif mean == max_val:
        alpha = 5.0
        beta_param = 1.0
    else:
        alpha = 1.0 + 4.0 * (likely_val - min_val) / range_val
        beta_param = 1.0 + 4.0 * (max_val - likely_val) / range_val
        
    samples = beta.rvs(alpha, beta_param, size=size, random_state=rng)
    return min_val + samples * range_val
