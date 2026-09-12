# CYBERVEST API DISCOVERY STATUS REPORT

## A. API DISCOVERY STATUS
Status: **COMPLETED**
Phase: READ-ONLY Verification
Target: CYBERVEST FastAPI Application (`risk_engine/api/routers`)

## B. TOTAL ROUTE COUNT
**Total Endpoints Discovered:** 13

## C. COMPLETE ROUTE TABLE

| Method | Exact Path | Router | Auth / Roles | Request Schema | Response Schema |
|--------|------------|--------|--------------|----------------|-----------------|
| POST | `/api/fair/run` | `fair.py` | Bearer Token / WRITE | `FAIRScenarioInput` | `FAIRResultOutput` (dict) |
| POST | `/api/ml/predict` | `ml.py` | Bearer Token / WRITE | `dict` | `dict` (`{"prediction": 0.45}`) |
| POST | `/api/optimization/run` | `optimization.py` | Bearer Token / WRITE | `OptimizationRequest` | `OptimizationResponse` (dict) |
| GET | `/api/assets/` | `assets.py` | Bearer Token / READ | None | `dict` |
| GET | `/api/assets/{asset_id}` | `assets.py` | Bearer Token / READ | Path: `asset_id` | `dict` |
| POST | `/api/assets/` | `assets.py` | Bearer Token / WRITE | `dict` | `dict` (`{"status": "created"}`) |
| POST | `/api/admin/roles` | `admin.py` | Bearer Token / ADMIN | `dict` (`target_user_id`, `role`) | `dict` (`{"status": "role_assigned"}`) |
| POST | `/api/ai/ask` | `ai.py` | Bearer Token / READ | `AIQuery` | `dict` (`llm_explanation`) |
| GET | `/api/compliance/summary` | `compliance.py` | Bearer Token / READ | None | `dict` (Stats per framework) |
| GET | `/api/compliance/gaps` | `compliance.py` | Bearer Token / READ | None | `list` of `dict` |
| GET | `/api/compliance/findings` | `compliance.py` | Bearer Token / READ | None | `list` of `dict` |
| PATCH | `/api/compliance/controls/{organization_control_id}` | `compliance.py` | Bearer Token / WRITE | `ControlUpdatePayload` | `dict` (Updated control row) |
| POST | `/api/compliance/evidence` | `compliance.py` | Bearer Token / WRITE | `EvidencePayload` | `dict` (`{"evidence_id": "..."}`) |
| GET | `/api/compliance/mappings` | `compliance.py` | Bearer Token / READ | None | `list` of `dict` |

*(Note: "READ" implies `Role.get_all()`. "WRITE" implies `[ADMIN, CISO, SECURITY_ANALYST, RISK_MANAGER]`)*

## D. AUTHENTICATION MODEL
- **Strategy:** HTTP Bearer Token (`HTTPBearer` dependency).
- **Provider:** Supabase Auth via JWT (`Authorization: Bearer <Supabase-JWT>`).
- **Validation:** The token is explicitly verified against the backend Supabase API via `client.auth.get_user()`.
- **Postman Configuration Needed:** Postman requests must explicitly inject a valid Supabase JWT generated from a test user's email/password authentication process into the `Authorization` tab (Type: Bearer Token).

## E. RBAC MODEL
The RBAC model validates the verified user's assigned role against the required role array for the endpoint:
- **`require_read_access()`:** Accessible to ALL roles (`ADMIN, CISO, SECURITY_ANALYST, RISK_MANAGER, EXECUTIVE, AUDITOR`).
- **`require_write_access()`:** Accessible ONLY to `ADMIN, CISO, SECURITY_ANALYST, RISK_MANAGER`. Generates `HTTP 403 Forbidden` for `AUDITOR` or `EXECUTIVE`.
- **`get_admin()`:** Accessible ONLY to `ADMIN`.

## F. TENANT/RLS MODEL
- **Organization ID Extraction:** The auth dependency automatically extracts the user's `organization_id` from the Supabase `organization_members` table.
- **IDOR Protection:** `POST /api/fair/run`, `POST /api/optimization/run`, `PATCH /api/compliance/controls/...` directly evaluate `payload.organization_id == user.organization_id`. Any mismatched invocation immediately rejects the request with `HTTP 403 Cross-tenant access forbidden`.
- **PostgreSQL RLS:** Row-level security natively handles implicit tenant isolation for read queries originating from Supabase service calls, assuming correct context injection (used by CI validation).

## G. ML ENDPOINTS
- **Implementation:** `POST /api/ml/predict` (Currently a mocked facade to test architecture, awaiting final model binding into the REST layer). 
- **Error Handling:** 403 if `organization_id` mismatches.

## H. FAIR ENDPOINTS
- **Implementation:** `POST /api/fair/run` executes baseline Monte Carlo permutations and returns analytical statistics (P10, P50, P90, EAL).
- **Model:** Accepts full `FAIRScenarioInput` (containing TEF/Susceptibility PERT distributions).

## I. WHAT-IF ENDPOINTS
- **Implementation:** Included natively within `POST /api/fair/run`. Clients perform What-If analysis by sending a modified `FAIRScenarioInput` payload (e.g. adjusting `susceptibility` variables) and comparing outputs.

## J. OPTIMIZATION ENDPOINTS
- **Implementation:** `POST /api/optimization/run`. 
- **Capability:** Invokes the Google OR-Tools SCIP solver under the hood, enforces exact portfolio evaluation constraints, and returns a fully mapped `OptimizationResponse` including `total_investment` and `residual EAL`.

## K. COMPLIANCE ENDPOINTS
- **Implementation:** Complete CRUD-style subset available (`/summary`, `/gaps`, `/findings`, `/mappings`, `/controls`, `/evidence`).
- **Capability:** Identifies regulatory gaps dynamically, permits gap mutation via PATCH, and links empirical evidence files to specific Control records.

## L. AI ENDPOINTS
- **Implementation:** `POST /api/ai/ask`. 
- **Capability:** Simulates an orchestration wrapper. The LLM translates verification contexts (`fair`, `optimization`) and strictly routes backend verification output rather than generating mathematical estimates internally.

## M. AUDIT/SECURITY ENDPOINTS
- **Implementation:** Implicit.
- **Capability:** No direct `GET /audit` route exists, but the function `log_audit_event()` is explicitly triggered upon completion of major operations (e.g., executing FAIR, modifying Compliance, optimizing portfolios, role adjustments) tracking `old_value` and `new_value` securely at the backend.

## N. MISSING/UNIMPLEMENTED PLANNED ENDPOINTS
- **Security Events & Incidents:** No explicit endpoints discovered for manipulating these entities (`/api/events` or `/api/incidents`); they are currently retrieved directly from DB queries inside ML routines.
- **Reporting Generator:** No explicit route for downloading physical PDF/CSV reports.
- **Real-time Metrics:** No WebSocket/PubSub subscriptions detected.

## O. POSTMAN TESTING PRIORITIES
To effectively construct the CYBERVEST Postman test collection, the priority will be creating tests that confirm the actual contract validations:
1. **RBAC Validations:** Attempting to `PATCH /api/compliance/controls/` as an `AUDITOR` to assert `403 Forbidden`.
2. **Tenant IDOR Protection:** Attempting `POST /api/optimization/run` with a foreign `organization_id` to assert `403 Forbidden`.
3. **FAIR Simulation Confidence:** Asserting `P10 <= P50 <= P90` constraints inside the Postman Response `Tests` tab.
4. **Validation Schemas:** Sending malformed `FAIRScenarioInput` and asserting `422 Unprocessable Entity` responses.
