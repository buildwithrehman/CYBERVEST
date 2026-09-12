# Milestone 2 Schema Audit

## Existing System Overview
The existing Supabase PostgreSQL schema (`CYBERVEST` project, Ref: `mohvhuwoishmmpeddepa`) provides a foundational architecture for Cyber Risk Quantification. The database contains 15 primary tables representing the organization, assets, vulnerabilities, events, controls, incidents, FAIR scenarios/results, ML predictions, generic scenarios, and optimization models. The data model is linked via foreign keys maintaining referential integrity cascading from `organizations`.

### Current Entities & Relationships
1. **organizations**: Base tenant table (PK: `id`).
2. **business_services**: Belongs to `organizations`.
3. **assets**: Belongs to `organizations`, optionally `business_services`.
4. **vulnerabilities**: Belongs to `assets`.
5. **security_events**: Belongs to `assets`.
6. **threat_intelligence**: Standalone, linked implicitly by `cve_id`.
7. **controls**: Belongs to `organizations`.
8. **incidents**: Belongs to `organizations` and `assets`.
9. **fair_scenarios**: Belongs to `organizations` and `assets`.
10. **fair_results**: Belongs to `fair_scenarios`.
11. **ml_predictions**: Belongs to `organizations` and `assets`.
12. **scenarios**: Belongs to `organizations`, references `fair_scenarios` and `fair_results`.
13. **optimization_controls**: Belongs to `organizations` and `controls`.
14. **optimization_results**: Belongs to `organizations`.
15. **audit_logs**: Belongs to `organizations`.

### Current Constraints & Indexes
- **UUID Primary Keys** for all tables.
- **Foreign Keys**: Proper `ON DELETE CASCADE` from `organizations`, `ON DELETE SET NULL` for non-critical relationships (like `asset_id` on `incidents`).
- **Indexes**: Exist for foreign keys (`organization_id`, `asset_id`), `cve_id`, `timestamp`, `severity`, and `criticality`.
- **RLS**: Enabled globally. Currently permissive (`USING (true)`) to facilitate prototyping.

## Missing Fields for Future Engines (Gap Analysis)

### 1. FAIR Schema (`fair_scenarios`, `fair_results`)
- Current schema has most min/likely/max bounds for TEF, susceptibility, and losses. 
- Missing `model_version` in `fair_scenarios` to track what engine version built the inputs.
- Missing explicit probability distributions type (e.g., PERT vs Lognormal) in `fair_scenarios`.

### 2. ML Schema (`ml_predictions`)
- Missing `prediction_probability` (currently only has `prediction_value`).
- Missing `prediction_label` (for classification tasks).
- Missing `prediction_timestamp` (currently relying on `created_at`).

### 3. Incident Schema (`incidents`)
- Missing `business_service_id` (currently only links to `asset_id`).
- Missing `incident_date` (currently has `detected_at` and `resolved_at`).
- Missing `vulnerability_id` (currently only has string `cve_id`).
- Missing `attack_vector` and `data_compromised`.
- Missing explicit financial breakdown: `direct_loss`, `indirect_loss`, `regulatory_loss`, `reputational_loss`, `total_loss` (currently only generic `financial_loss`).
- Missing `confidence` and `is_synthetic` flag.

### 4. Scenario Schema (`scenarios`)
- Missing explicit `mitigation_control_id` to link a scenario directly to a control tested.
- Missing `status` and `assumptions`.

### 5. Optimization Schema (`optimization_results`)
- Missing `baseline_risk` and `optimized_risk` (currently has `residual_eal` but lacks baseline context).
- Missing `roi` / `rosi`.
- Missing `optimization_objective` string to describe the goal.
- Missing `model_version` (has `solver_name`).

## Recommended Schema Changes
1. **Create a new migration** (`20260907000001_harden_schema.sql`) using `ALTER TABLE` to append these missing fields.
2. **Preserve existing data**: Ensure new columns are nullable or have safe defaults so existing DemoFin Bank seed data is not broken.
3. **Add `is_synthetic`** global boolean flags to relevant transactional tables (`incidents`, `security_events`, `threat_intelligence`).
