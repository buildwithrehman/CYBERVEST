# ML TO FAIR INTEGRATION ANALYSIS

## 1. Problem Definition
The CYBERVEST ML Incident Likelihood engine outputs $p_{15}$, which represents the probability of at least one incident occurring within a forward-looking 15-day horizon. 

The FAIR Risk Quantification Engine natively models:
- **Threat Event Frequency (TEF):** Attempted attacks per year (PERT Distribution).
- **Susceptibility (S):** Probability that an attempt succeeds (PERT Distribution).
- **Loss Event Frequency (LEF):** Successful attacks per year, where $LEF = TEF \times S$.

## 2. Mathematical Bridging
To convert the ML probability output $p_{15}$ into a usable FAIR input, we must establish a stochastic bridge. Assuming incident arrivals follow a homogeneous Poisson process, the expected number of incidents in the 15-day window ($\lambda_{15}$) is mathematically defined as:

$P(N \ge 1) = 1 - e^{-\lambda_{15}}$

Setting $P(N \ge 1) = p_{15}$, we derive:
$\lambda_{15} = -\ln(1 - p_{15})$

To annualize this rate for FAIR:
$LEF_{\text{annual}} = \lambda_{15} \times \frac{365.25}{15}$

**Example:**
If the ML model predicts a 30% chance of an incident in 15 days ($p_{15} = 0.30$):
$LEF_{\text{annual}} = -\ln(0.70) \times 24.35 = 0.3567 \times 24.35 \approx 8.68$ incidents per year.

## 3. The Conceptual and Mathematical Block
While we can perfectly transform the ML probability into an annualized **Loss Event Frequency (LEF)** point estimate, FAIR explicitly requires independent **TEF** and **Susceptibility** components to evaluate mitigations (e.g., patching reduces Susceptibility, filtering reduces TEF).

The equation:
$TEF \times S = LEF_{\text{annual}}$
presents a system with one known ($LEF_{\text{annual}}$) and two unknowns ($TEF$, $S$). 

This system is **mathematically underdetermined**. It is impossible to uniquely disaggregate a single LEF point estimate into distinct TEF and Susceptibility variables without fabricating arbitrary assumptions. Furthermore, ML yields a point estimate, whereas FAIR requires robust PERT distributions ($min$, $likely$, $max$) conveying variance and epistemic uncertainty.

## 4. Conclusion
Because the transformation from an ML likelihood point estimate to independent FAIR PERT distributions for TEF and Susceptibility requires arbitrary mathematical fabrication, the integration cannot be validated. 

**Status: ML $\rightarrow$ FAIR = NOT VALIDATED.**

**Recommendation:** Maintain the ML engine as a separate risk-evidence and intelligence layer. Analysts should use the ML probability as objective context (e.g., "The ML model indicates high vulnerability exploitation likelihood") when manually defining FAIR PERT parameters, rather than attempting direct, unvalidated automation.
