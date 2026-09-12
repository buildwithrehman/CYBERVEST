# CYBERVEST — ML MODEL CERTIFICATION REPORT
**STATUS:** COMPLETE
**DATE:** 2026-09-09
**VERSION:** MILESTONE 6.1

This document provides the rigorous, auditable model-selection certification for the Incident Likelihood Prediction engine, required prior to API integration with the frontend.

---

## 1. DATASET AUDIT (STATUS: PASS WITH LIMITATIONS)

The dataset utilizes a point-in-time extraction architecture applied to the Supabase backend.
- **Dataset Version:** Synthetic V2
- **Total Temporal Snapshots:** 11,064 
- **Target Prevalence (Incident Likelihood):** ~37.3%
- **Unique Assets Evaluated:** 922
- **Feature Count:** 8 (Asset Type, Criticality, Internet Exposed, Vuln Count, CVSS Max, Known Exploited Count, Recent Event Count 30D, Prior Incident Count)

*Limitations:* The underlying events, vulnerabilities, and incidents are synthetically generated.

## 2. LEAKAGE AUDIT (STATUS: PASS)

- **Mechanism:** The `generate_features` module strictly filters all `security_events`, `vulnerabilities`, and `incidents` where `timestamp >= cutoff_date`.
- **Validation:** Visual and programmatic inspection confirms no future information breaches the chronological cutoff boundary.

## 3. TRAIN / VALIDATION / TEST METHODOLOGY (STATUS: PASS)

Data was split using strict, non-overlapping chronological bounds (no random shuffling):
- **TRAIN** (2026-06-11 to 2026-07-26): 3,688 snapshots (1,157 positive)
- **VALIDATION** (2026-07-26 to 2026-08-10): 3,688 snapshots (1,190 positive)
- **TEST** (2026-08-10 to 2026-08-25): 3,688 snapshots (1,218 positive)

## 4. CANDIDATE MODELS

Using a fixed random seed (42), we trained the following baseline and non-linear candidates:
1. `DummyClassifier` (prior strategy)
2. `LogisticRegression`
3. `HistGradientBoostingClassifier`

## 5. VALIDATION METRICS (STATUS: PASS)

Evaluation exclusively on the VALIDATION set yielded:

| Model | ROC-AUC | PR-AUC | Brier Score |
|-------|---------|--------|-------------|
| Dummy | 0.500 | 0.323 | 0.219 |
| LogisticRegression | 0.718 | 0.527 | 0.190 |
| HistGradientBoosting | 0.710 | 0.511 | 0.195 |

## 6. MODEL-SELECTION RATIONALE (STATUS: PASS)

**Selection:** `LogisticRegression`

**Rationale:** The previous Milestone arbitrarily favored HistGradientBoosting. However, rigorous validation on the temporal split demonstrates that **Logistic Regression** is objectively superior on this dataset. It achieves a higher PR-AUC (0.527 vs 0.511), a higher ROC-AUC (0.718 vs 0.710), and better calibration via a lower Brier Score (0.190 vs 0.195). We have abandoned HGB and promoted Logistic Regression to the prototype production candidate.

## 7. THRESHOLD ANALYSIS

Tested across the Validation Set:
- Threshold 0.20: F1 = 0.556 | FPR = 0.622 | FNR = 0.113
- Threshold 0.25: F1 = 0.558 | FPR = 0.470 | FNR = 0.230
- **Threshold 0.30: F1 = 0.564 | FPR = 0.414 | FNR = 0.266**
- Threshold 0.40: F1 = 0.500 | FPR = 0.180 | FNR = 0.540

**Selected Threshold: 0.30** because it maximizes the F1 score, striking an optimal balance between precision and recall for alert generation. *Note: The continuous probability output remains the primary artifact for downstream risk calculations.*

## 8. FINAL TEST METRICS

Evaluated `LogisticRegression` strictly once on the untouched TEST set:
- **ROC-AUC:** 0.734
- **PR-AUC:** 0.573
- **Precision:** 0.477
- **Recall:** 0.747
- **F1 Score:** 0.582
- **Brier Score:** 0.186

## 9. CALIBRATION

The calibration curve indicates structural conservative bias:
- `prob_pred` bins scale from ~0.09 to ~0.62.
- `prob_true` observations scale from ~0.12 to ~0.69.
*Result:* The model generally underestimates the synthetic likelihood slightly but remains monotonically calibrated.

## 10. FEATURE IMPORTANCE

Logistic Regression Standardized Coefficients (Top 5):
1. `internet_exposed`: +1.5691
2. `asset_type_WEB_APPLICATION`: -1.2941
3. `criticality_high`: -0.5301
4. `criticality_critical`: +0.4479
5. `criticality_low`: -0.4331

*Disclaimer:* Feature importance indicates predictive contribution within this specific synthetic dataset; it does not establish real-world causality. (E.g., Event counts exhibited negative coefficients due to synthetic incident suppression logic).

## 11. MODEL ARTIFACT

The verified model was serialized and saved with corresponding schema metadata:
- `models/incident_likelihood/incident_likelihood_v1.joblib`
- `models/incident_likelihood/incident_likelihood_v1.json`

## 12. REPRODUCIBILITY (STATUS: PASS)

Run 1 AUC: 0.718343
Run 2 AUC: 0.718343
Training is completely deterministic given the fixed random seed and temporal structure.

## 13. INFERENCE VALIDATION (STATUS: PASS)

Loaded the serialized `joblib` artifacts in an isolated Python process and executed boundary testing.
- Probabilities successfully generated for unseen categorical and missing numerical structures.
- Verified invariant: $0 \le P(\text{incident}) \le 1$.

## 14. ML → FAIR INTEGRATION STATUS (STATUS: NOT VALIDATED)

**ML → FAIR transformation NOT YET VALIDATED.**

*Analysis:* The current integration script (`test_cybervest_end_to_end.py`) utilizes the ML output loosely to inform the configuration of a `PERTDistribution` for the FAIR `Threat Event Frequency (TEF)` variable. There is currently no mathematically rigorous or formal transformation function mapping ML probability space (0-1) to TEF event frequencies ($N$ events/year). 

## 15. SYNTHETIC DATA DISCLOSURE

The underlying dataset is synthetic. Therefore, we explicitly DO NOT claim:
- Real-world predictive accuracy.
- Production-grade incident prediction.
- Industry-wide probability.
- Validated cybersecurity incident rates.

This model demonstrates end-to-end ML pipeline functionality, temporal leakage prevention, predictive signal recovery on controlled data, and serialization readiness.

## 16. FINAL RECOMMENDATION

**OVERALL ML STATUS: PASS WITH LIMITATIONS**

The `LogisticRegression` model is certified for deployment within the CYBERVEST prototype. The backend integration may proceed to the frontend, but the ML->FAIR transformation function must be mathematically defined in a future milestone.
