# FAIR Mathematical Methodology

The engine calculates risk fundamentally grounded by the quantitative bounds of Factor Analysis of Information Risk (FAIR).

## Core Equations & Compound Frequency

To capture the potential for multiple incidents dynamically while incorporating periods of zero loss, a robust **Compound Poisson Frequency Model** was deployed as opposed to basic expected value approximation.

1. **Threat Event Frequency (TEF)**: Sampled directly from the PERT distribution bounded by Minimum, Likely, and Maximum occurrences (`events / year`).
2. **Susceptibility**: The conditional probability that a generated threat event translates into an actual loss. Evaluated on a 0-1 decimal scale.
3. **Loss Event Frequency (LEF)**:
   $$ LEF = TEF \times Susceptibility $$

**Poisson Iteration**:
To model realistic distribution over annual timelines (inclusive of zero-incident years), the engine draws the integer occurrences (`N`) from a Poisson distribution defined by the mean LEF:
   $$ N \sim Poisson(LEF) $$

4. **Loss Magnitude**:
For each occurrence $i$ in $N$, a direct iteration of loss magnitude is drawn consisting of:
   $$ Primary\_Loss_i = Productivity\_Loss_i + Response\_Cost_i $$
   $$ Secondary\_Loss_i = Regulatory\_Loss_i + Reputation\_Loss_i $$
   $$ Total\_Loss_i = Primary\_Loss_i + Secondary\_Loss_i $$

5. **Annual Loss**:
Annualization aggregates every individual total loss for the duration of the year mapped to $N$:
   $$ Annual\_Loss = \sum_{i=1}^{N} Total\_Loss_i $$

## Distributions
- **PERT (Beta-PERT) Distribution**: The engine exclusively utilizes PERT mapping translated via `scipy.stats.beta`. This was selected explicitly to reflect Subject Matter Expert (SME) estimations accurately matching real-world skewed risk parameters better than simple normal distributions.

## Output Definitions
- **P10**: 10th percentile annual loss across 10,000 simulations (Highly optimistic boundary).
- **P50**: Median expected loss outcome.
- **P90**: 90th percentile annual loss (Pessimistic severe threshold used for extreme tail-risk appetite validation).
- **Expected Annual Loss (EAL)**: The statistical **Mean** of the annual loss simulation distribution. (NOT the P50 median or arbitrary weighting). EAL exactly matches $ E[Annual\_Loss] $.

## Risk Driver Analysis
Spearman Rank-Order correlation is utilized to analyze variance drivers. For a Compound Poisson model where $N$ fluctuates heavily (and $N=0$ years exist):
- TEF and Susceptibility are correlated globally against all iteration years.
- Loss Magnitude is calculated by isolating the average single-event loss per active year ($N > 0$). Years where $N=0$ are filtered out to prevent confounding magnitude with frequency, resulting in mathematically sound magnitude correlations.
