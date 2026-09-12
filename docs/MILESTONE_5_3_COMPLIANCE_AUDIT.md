# Milestone 5.3 Compliance Engine Audit

## 1. Existing Compliance Tables
There are **no existing dedicated compliance or regulatory tables**. The initial database schema does not include `frameworks`, `framework_controls`, `control_mappings`, `evidence`, or `compliance_findings`.

## 2. Existing Control Tables
- **`controls`**: An organization-scoped table (has `organization_id`) acting as an internal asset/control catalog. It tracks `name`, `control_type`, `implementation_cost`, `effectiveness`, and `implementation_status`. It is not linked to any external regulatory requirement.
- **`optimization_controls`**: Maps `controls(id)` to optimization parameters (`estimated_cost`, `estimated_risk_reduction`).

## 3. Existing Relationships
- `controls` references `organizations`.
- `optimization_controls` references `controls`.
- `assets`, `business_services`, `vulnerabilities` are all securely mapped and scoped to `organizations`.
- `incidents` and `fair_scenarios` are securely mapped to `organizations`.

## 4. Existing RLS & Organization Ownership
- Strong Multi-Tenant isolation is active across the platform (Milestone 5.2). 
- All organization-owned tables are wrapped with RLS checking `organization_id IN (SELECT get_user_organizations())`.
- Role-Based Access Control (RBAC) supports the following roles: `ADMIN`, `CISO`, `SECURITY_ANALYST`, `RISK_MANAGER`, `EXECUTIVE`, `AUDITOR`.

## 5. Missing Components for Compliance Engine
- `frameworks`: To store RBI, SEBI CSCRF, NIST, ISO, CIS.
- `framework_controls`: To store the hierarchical requirements of each framework globally (not tied to a single tenant).
- `control_mappings`: To normalize cross-framework relationships (RBI ↔ NIST).
- `organization_frameworks`: To track which frameworks are applicable to an organization.
- `organization_controls`: To link `framework_controls` to a specific tenant's implementation status (or adapt the existing `controls` table).
- `evidence` and `control_evidence`: To store and map evidence artifacts.
- `compliance_findings`: To record generated gaps and link them to affected assets.

## 6. Proposed Changes
1. **New Global Tables (No RLS / Global Read RLS)**:
   - `frameworks`
   - `framework_controls`
   - `control_mappings`
2. **New Tenant-Scoped Tables (Strict RLS)**:
   - `organization_frameworks`
   - `organization_controls` (replaces or maps to the existing `controls` table). I propose creating `organization_controls` explicitly for compliance status mapping, leaving the existing `controls` table strictly for the quantitative investment catalog, then linking `organization_controls(id) -> controls(id)` for remediation.
   - `evidence`
   - `control_evidence`
   - `compliance_findings`
3. **Data Linkage Workflow**:
   `framework_control` -> `organization_control` -> `compliance_finding` -> `asset` -> `fair_scenario` -> `controls` (remediation) -> `optimization_runs`.
