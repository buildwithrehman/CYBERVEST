# Compliance Architecture

The CYBERVEST compliance architecture introduces a dynamic, framework-agnostic regulatory engine that enforces data provenance and explicit scoping.

## 1. Data Model
1. **`frameworks`**: Master regulatory frameworks (RBI, SEBI, NIST).
2. **`framework_controls`**: The explicit hierarchical requirements belonging to a framework.
3. **`control_mappings`**: Connects analytical equivalencies (e.g., SEBI-RES-1 -> RBI-INC-1).
4. **`organization_frameworks`**: Tracks which frameworks legally apply to a tenant.
5. **`organization_controls`**: Maps `framework_controls` to a tenant, maintaining implementation status and review cycles.
6. **`evidence` / `control_evidence`**: Tracks supporting documentation and metadata for control verification.
7. **`compliance_findings`**: Tracks identified gaps.
8. **`compliance_risk_links`**: Joins a gap to a physical Asset, FAIR Scenario, or Mitigation candidate.

## 2. API Endpoints
Provided via FastAPI at `/api/compliance/`:
- GET `/frameworks`, `/frameworks/{id}/controls`
- GET `/overview`, `/gaps`, `/findings`, `/mappings`
- POST `/evidence`
- PATCH `/controls/{id}`

## 3. Threat Model & RBAC
- Tenant boundaries are enforced via PostgreSQL RLS checking the `organization_id`.
- FastAPI endpoints enforce Milestone 5.2 RBAC:
  - `require_read_access()`: All roles.
  - `require_write_access()`: Prevents `AUDITOR` and `EXECUTIVE` from arbitrarily modifying control status.
