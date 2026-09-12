# CYBERVEST - POSTMAN API DISCOVERY REPORT
**Phase:** Discovery
**Target:** Actual running CYBERVEST FastAPI application (127.0.0.1:8000)

## A. COMPLETE 17-ROUTE TABLE

| HTTP Method | Exact Path | Purpose | Auth | RBAC Role(s) | Req Parameters/Body | Res Schema | Postman Cert. |
|-------------|------------|---------|------|--------------|---------------------|------------|---------------|
| `GET` | `/health` | Application health check | None | None | None | `{"status": "ok", "message": str}` | Yes |
| `POST` | `/api/fair/run` | Execute Monte Carlo Risk Calculation (also powers What-If) | Bearer | WRITE | `FAIRScenarioInput` (JSON) | `FAIRResultOutput` | Yes |
| `POST` | `/api/optimization/run` | Execute OR-Tools Portfolio Optimization | Bearer | WRITE | `OptimizationRequest` (JSON) | `OptimizationResponse` | Yes |
| `POST` | `/api/ml/predict` | Predict 15-day Incident Likelihood | Bearer | WRITE | `{ "organization_id": str }` (JSON) | `{"status": str, "prediction": float}` | Yes |
| `GET` | `/api/assets/` | List organization assets | Bearer | READ | None | `dict` | Yes |
| `POST` | `/api/assets/` | Create new asset | Bearer | WRITE | `dict` (JSON) | `{"status": "created"}` | Yes |
| `GET` | `/api/assets/{asset_id}` | Retrieve specific asset | Bearer | READ | Path: `asset_id` | `dict` | Yes |
| `POST` | `/api/admin/roles` | Assign RBAC role to user | Bearer | ADMIN | `{"target_user_id": str, "role": str}` | `{"status": "role_assigned"}` | Yes |
| `GET` | `/api/compliance/frameworks` | List supported frameworks (RBI, SEBI) | Bearer | READ | None | `list` of `dict` | Yes |
| `GET` | `/api/compliance/frameworks/{framework_id}` | Get specific framework details | Bearer | READ | Path: `framework_id` | `dict` | Yes |
| `GET` | `/api/compliance/frameworks/{framework_id}/controls` | List controls for a framework | Bearer | READ | Path: `framework_id` | `list` of `dict` | Yes |
| `GET` | `/api/compliance/overview` | Organization compliance posture summary | Bearer | READ | None | `{"organization_id": str, "framework_posture": dict, ...}` | Yes |
| `GET` | `/api/compliance/gaps` | List unimplemented/partially implemented controls | Bearer | READ | None | `list` of `GapAnalysisResult` | Yes |
| `GET` | `/api/compliance/findings` | List active compliance findings | Bearer | READ | None | `list` of `dict` | Yes |
| `PATCH` | `/api/compliance/controls/{organization_control_id}` | Update organization control status | Bearer | WRITE | Path: `organization_control_id`, Body: `ControlUpdatePayload` | `dict` | Yes |
| `POST` | `/api/compliance/evidence` | Submit and link evidence to control | Bearer | WRITE | `EvidencePayload` (JSON) | `{"status": str, "evidence_id": str}` | Yes |
| `GET` | `/api/compliance/mappings` | Get control-to-asset/threat mappings | Bearer | READ | None | `list` of `dict` | Yes |
| `POST` | `/api/ai/ask` | LLM Orchestrator to explain verified backend data | Bearer | READ | `AIQuery` (JSON) | `{"status": str, "query": str, "verified_data_source": str, "llm_explanation": str}` | Yes |

*Note: READ = All roles (ADMIN, CISO, SECURITY_ANALYST, RISK_MANAGER, EXECUTIVE, AUDITOR). WRITE = (ADMIN, CISO, SECURITY_ANALYST, RISK_MANAGER).*

## B. AUTHENTICATION MECHANISM
- **Type:** HTTP Bearer token via `Authorization: Bearer <token>`.
- **Provider:** Supabase Auth (JWT).
- **Enforcement:** The `get_current_user` FastAPI dependency intercepts the token and natively queries the Supabase instance using `client.auth.get_user()` to ensure cryptographically valid, unexpired sessions.

## C. RBAC ENFORCEMENT
Roles are mapped from the `organization_members` database table on authentication.
Endpoints strictly enforce permissions using closure dependencies:
- `require_read_access()` (All roles)
- `require_write_access()` (Blocks Executives and Auditors)
- `get_admin()` (Blocks all except Admin)

## D. TENANT/RLS ENFORCEMENT
- **Implicit Context:** `organization_id` is automatically extracted from the user's JWT database binding.
- **Explicit IDOR Protection:** Endpoints like `/api/optimization/run` and `/api/compliance/controls/...` actively check `if payload.organization_id != user.organization_id` and raise an `HTTP 403 Forbidden` if cross-tenant behavior is detected.
- **Underlying Database RLS:** Data retrieval queries executed via the Supabase Service Role Key bypass RLS implicitly, but the FastAPI routing layer explicitly enforces the multitenant boundaries using the logic described above.

## E. REQUEST VALIDATION
FastAPI relies on Pydantic schemas (e.g., `FAIRScenarioInput`, `OptimizationRequest`, `ControlUpdatePayload`, `EvidencePayload`, `AIQuery`). Sending missing required fields or invalid data types automatically yields `HTTP 422 Unprocessable Entity`.

## F. RESPONSE SCHEMAS
Most responses are strictly structured JSON objects (e.g., `FAIRResultOutput` contains exact precision outputs for P10, P50, P90, EAL, primary/secondary loss).

## G. ROUTES REQUIRING SPECIAL SETUP/DATA
- **FAIR & Optimization:** Require complex Pydantic structures. Postman tests must provide well-formed `PERTDistribution` objects.
- **Compliance PATCH:** Requires a valid `organization_control_id` existing in the DB for that specific tenant to bypass the 404/403.
- **Auth Tokens:** Tests cannot run without a valid Supabase JWT generated out-of-band or via a pre-request script.

## H. MISSING PLANNED ROUTES
- **No pure Auth Routes:** (e.g., `/api/auth/login`) handled exclusively by Supabase client libraries.
- **No explicit Security Events / Incidents routes:** Accessed directly by the backend ML pipeline without a CRUD API.
- **No Vulnerabilities route:** Handled implicitly via ML features.
- **No PDF/CSV Reporting generation endpoint.**

## I. RECOMMENDED POSTMAN TEST ORDER
1. **Health Check** (Unauthenticated) -> Verifies runtime.
2. **Authentication Injection** (Pre-request script to fetch/set JWT).
3. **RBAC & Tenant Negative Tests** -> `403 Forbidden` checks.
4. **Compliance Read Paths** -> Confirm basic data retrieval.
5. **AI Orchestrator** -> Validate explainability routes.
6. **Complex Write Paths (FAIR, Optimization)** -> Validate mathematics and schema constraints (`422` vs `200`).
