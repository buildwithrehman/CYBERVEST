# Synthetic Data Model

The data model for CYBERVEST has been expanded to support future engines (FAIR, ML, Optimization) while preserving the Milestone 1 core tables and DemoFin Bank seeds.

## Additions for Risk Engines
1. **FAIR Model Variables**:
   - `probability_distribution` and `model_version` added to `fair_scenarios`.
   - `calculation_timestamp` to track evaluation currency.

2. **ML Predictions Context**:
   - `prediction_probability` (0-1 metric).
   - `prediction_label` (categorical classification output).
   - `prediction_timestamp`.

3. **Financial Impact Breakdown**:
   - `incidents` now cleanly distinguishes `direct_loss`, `indirect_loss`, `regulatory_loss`, and `reputational_loss` summing to `total_loss`.
   - Fields explicitly mapped to vulnerability exploiting and business context.

4. **Scenario and Optimization Modeling**:
   - `mitigation_control_id` connects scenarios to specific tested controls.
   - `baseline_risk`, `optimized_risk`, `roi`, and `rosi` added to `optimization_results` explicitly for downstream OR-Tools implementation.

## Data Provenance
- Stringent explicit metadata labeling.
- `is_synthetic = TRUE` default flags applied across all transactional elements (`incidents`, `security_events`, `vulnerabilities`, etc.).
- `data_quality_status` in assets ensures model evaluation has visibility on data reliability.
