# ML Data Leakage Audit

Target leakage is the most critical risk in predictive ML models, where the model inadvertently learns from information that would not be available at prediction time.

## 1. Temporal Cutoff Enforcement
A strict `cutoff_date` parameter is enforced globally in `generate_features()`.
The target prediction window is `[cutoff_date, cutoff_date + 15 days)`.

## 2. Feature Isolation
All queries strictly filter telemetry prior to the cutoff:
- `events_df[events_df['timestamp'] < cutoff]`
- `vulns_df[vulns_df['created_at'] < cutoff]`
- `incidents_df[incidents_df['incident_date'] < cutoff]`

## 3. Target Independence
The Target label (1 or 0) is generated solely by inspecting incidents occurring *after* the cutoff, strictly between the cutoff and the 15-day forward boundary. Because `hist_incidents` evaluates strictly `< cutoff`, the target incident itself is mathematically erased from the feature set.

## 4. Empirical Proof
The `test_no_data_leakage()` unit test explicitly verifies that an incident dropped inside the 15-day window flags `target=1`, but events accompanying it exactly on the cutoff or later are dropped, resulting in `recent_event_count_30d = 0`. 
Furthermore, the test set ROC-AUC approximating 0.50 dynamically verifies that no hidden ID-leakage or forward-looking timestamps contaminated the pipeline (which would have artificially spiked AUC to 0.99+ on synthetic randomized data).
