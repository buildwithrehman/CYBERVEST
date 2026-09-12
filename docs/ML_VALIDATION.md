# ML Intelligence Engine Validation

## 1. Problem Definition
The CYBERVEST Machine Learning Intelligence Engine provides dynamic likelihood predictions estimating the probability of an asset experiencing a qualifying incident within a **15-day forward horizon**. 
It strictly acts as an intelligence signal and does **not** override quantitative parameters in the FAIR Monte Carlo engine automatically.

## 2. Point-In-Time Dataset Construction
To evaluate predictive validity fairly without temporal leakage, the dataset was constructed via a rigorous Point-In-Time (PIT) pipeline:
* **Train Set**: Snapshots aggregated uniformly between T-90 and T-45 days.
* **Validation Set**: Snapshots uniformly aggregated between T-45 and T-30 days.
* **Test Set**: Snapshots aggregated uniformly between T-30 and T-15 days.

All feature calculations (vulnerability age, recent event count) were strictly bounded by the asset's random cutoff date. Future information (events past the cutoff, incidents inside the target 15-day window) is mathematically masked in `generate_features`.

## 3. Incident Generation Methodology & Synthetic Data Limitations
The original synthetic dataset placed incidents entirely randomly across the timeline. To test real-world behavior responsibly, the incidents were regenerated via a Latent Risk Model:
1. `Base Risk` was defined.
2. Causal factors (Criticality, CVSS Severity > 8.0, Internet Exposure, Known Exploited flag, Event Volume) cumulatively increased the latent log-odds of an incident.
3. Stochastic noise (mean 0, std 0.5) was added to ensure risk was probabilistic, not deterministic.
4. Incidents were simulated dynamically per asset across the 90-day window based on this point-in-time condition curve.

**CRITICAL LIMITATION**: The synthetic incident generator intentionally creates predictive relationships between cyber-risk features and future incidents. Therefore, ML performance demonstrates recovery of signal in the synthetic environment and does not establish real-world cyberattack predictive accuracy. Additionally, the incident prevalence of approximately 35–39% in this dataset is strictly synthetic and must NOT be interpreted as an empirical real-world incident rate.

## 4. Leakage Prevention
Target leakage (the model cheating by looking into the future) was prevented by:
* Isolating the target variable explicitly to incidents falling precisely into the `[cutoff, cutoff + 15)` window.
* Filtering `security_events` strictly `< cutoff`.
* Using only vulnerabilities that existed `created_at <= cutoff`.

## 5. Feature Definitions
* **Categorical**: `asset_type`, `criticality` (One-hot encoded to avoid arbitrary numerical rankings).
* **Boolean**: `internet_exposed`, `known_exploited_count > 0`.
* **Numeric**: `vuln_count`, `cvss_max`, `recent_event_count_30d`, `prior_incident_count`.

## 6. Threshold Selection
Instead of naively using `0.5`, the classification boundary was optimized via an F1 sweep exclusively against the **Validation Set**. The selected threshold was then locked before calculating Test Set metrics, mimicking a real operational deployment. 

The product primarily exposes the **predicted probability**. The operational binary threshold of `0.25` is a prototype classification threshold selected using validation F1. It does not imply that a probability > 0.25 is a real-world attack probability threshold.

## 7. Model Artifact Versioning
Artifacts are uniquely named `incident_likelihood_hgb_v1.joblib` to resolve previous naming ambiguity. The `HistGradientBoostingClassifier` natively processes large sparse bounds cleanly on MacOS sandbox architectures without external `libomp` binary links.

## 8. ML to FAIR Integration Boundary
The architecture maintains explicit separation. The ML pipeline predicts $P(Incident \mid 15-Days)$. This vector acts as a visual overlay in the FAIR application, allowing Risk Analysts to raise the Threat Event Frequency (TEF) bounds based on intelligence, rather than replacing the simulation automatically.

## 9. Calibration
In this evaluation, Logistic Regression achieved slightly better Brier performance (`0.216`) compared to the HistGradientBoosting model (`0.228`). Deep calibration curves and reliability analysis are not sufficiently supported by the synthetic sample limitations, and no native calibration quality is fabricated.

## 10. Interpretability & Feature Importance
Permutation importance indicates that the model relies most strongly on features that were also intentionally associated with incident likelihood in the synthetic generator (e.g., `internet_exposed`, `criticality_critical`). **Feature importance does not establish causality.**
