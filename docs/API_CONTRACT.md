# CYBERVEST API Contract

## 1. Base Configuration
- **Local base URL:** `http://127.0.0.1:8000`
- **Authentication format:** `Authorization: Bearer <JWT>` (Supabase issued)
- **Content-Type:** `application/json`
- **Common Headers:** `Accept: application/json`

## 2. Authentication & Authorization
The API strictly uses Supabase JWTs.
- Missing credentials → `401 Unauthorized`
- Malformed/invalid credentials → `401 Unauthorized` (Graceful exception handling implemented)
- Expired credentials → `401 Unauthorized`
- Authenticated but unauthorized role → `403 Forbidden`
- Cross-tenant access → `403 Forbidden` / `404 Not Found` (Tenant Isolation via Application-Layer Authorization).

## 3. Health

### 1. `GET /health`
- **Purpose:** Application health check.
- **Authentication:** None
- **RBAC Role:** None
- **Path/Query Parameters:** None
- **Request Body:** None
- **Successful Response:** `200 OK`
- **Example Response:**
  ```json
  {
    "status": "ok",
    "message": "CYBERVEST API is running."
  }
  ```

## 4. Assets

### 2. `/api/assets/`
- **Methods:** `GET`, `POST`
- **Purpose:** List organization assets (`GET`) or create a new asset (`POST`).
- **Authentication:** Bearer JWT required.
- **RBAC Role:** `GET` requires READ access, `POST` requires WRITE access.
- **Request Body (`POST`):** Arbitrary JSON dict for prototyping.
- **Successful Response:** `200 OK`
- **Example Response (`GET`):**
  ```json
  {
    "status": "ok",
    "message": "Returning assets for org: 11111111-1111-1111-1111-111111111111"
  }
  ```

### 3. `GET /api/assets/{asset_id}`
- **Purpose:** Retrieve specific asset.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.
- **Path Parameters:** `asset_id` (string)
- **Successful Response:** `200 OK`

## 5. FAIR / What-If

### 4. `POST /api/fair/run`
- **Purpose:** Execute Monte Carlo Risk Calculation (also powers What-If).
- **Authentication:** Bearer JWT required.
- **RBAC Role:** WRITE access.
- **Request Body (`FAIRScenarioInput`):**
  - `scenario_id` (string)
  - `scenario_name` (string)
  - `organization_id` (string, optional)
  - `tef` (PERTDistribution)
  - `susceptibility` (SusceptibilityDistribution)
  - `productivity_loss` (PERTDistribution)
  - `response_cost` (PERTDistribution)
  - `regulatory_loss` (PERTDistribution)
  - `reputation_loss` (PERTDistribution)
  - `simulation_count` (integer, default 10000)
- **Validation Constraints:**
  - `PERTDistribution`: Requires strictly `min_val`, `likely_val`, `max_val` instead of min/mode/max.
  - Constraint: `min_val <= likely_val <= max_val`.
  - `SusceptibilityDistribution` constraint: values must be between `0` and `1`.
- **Successful Response (`FAIRResultOutput`):**
  - Yields: `tef_mean`, `susceptibility_mean`, `lef_mean`, `p10`, `p50`, `p90`, `eal`, `primary_loss_mean`, `secondary_loss_mean`, `total_loss_mean`.
- **Example Response:**
  ```json
  {
    "scenario_id": "test_fair",
    "scenario_name": "Test Scenario",
    "p50": 1500000.0,
    "eal": 1750000.0
  }
  ```
- **Frontend Notes:** Do not omit any loss component. Missing loss components will return `422 Unprocessable Entity`.

## 6. Investment Optimization

### 5. `POST /api/optimization/run`
- **Purpose:** Execute OR-Tools Portfolio Optimization.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** WRITE access.
- **Request Body (`OptimizationRequest`):**
  - `organization_id` (string)
  - `budget` (number)
  - `mitigations` (array)
  - `baseline_scenario` (FAIRScenarioInput)
- **Successful Response:** `200 OK` returning `OptimizationResponse`.

## 7. ML

### 6. `POST /api/ml/predict`
- **Purpose:** Predict 15-day Incident Likelihood probability based on synthetic telemetry.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** WRITE access.
- **Request Body:**
  ```json
  {
    "organization_id": "uuid"
  }
  ```
- **Successful Response:**
  ```json
  {
    "status": "success",
    "prediction": 0.45
  }
  ```
- **Frontend Notes:** The prediction is strictly the probability `P(incident within 15-day horizon) ∈ [0,1]`. It is an external risk driver and is **not** defined directly as FAIR TEF.

## 8. Compliance

### 7. `GET /api/compliance/frameworks`
- **Purpose:** List supported frameworks (RBI, SEBI).
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.

### 8. `GET /api/compliance/frameworks/{framework_id}`
- **Purpose:** Get specific framework details.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.

### 9. `GET /api/compliance/frameworks/{framework_id}/controls`
- **Purpose:** List controls for a framework.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.

### 10. `GET /api/compliance/overview`
- **Purpose:** Organization compliance posture summary.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.

### 11. `GET /api/compliance/gaps`
- **Purpose:** List unimplemented/partially implemented controls.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.

### 12. `GET /api/compliance/findings`
- **Purpose:** List active compliance findings.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.

### 13. `PATCH /api/compliance/controls/{organization_control_id}`
- **Purpose:** Update organization control status.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** WRITE access.
- **Path Parameters:** `organization_control_id`
- **Request Body (`ControlUpdatePayload`):**
  - `status` (string)
  - `notes` (string, optional)
  - `owner` (string, optional)
- **Tenant Isolation:** Enforces IDOR protection by checking cross-tenant control IDs.

### 14. `POST /api/compliance/evidence`
- **Purpose:** Submit and link evidence to control.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** WRITE access.
- **Request Body (`EvidencePayload`):**
  - `organization_control_id` (string)
  - `title` (string)
  - `description` (string)
  - `storage_path` (string)
  - `evidence_type` (string)
  - `source` (string)
- **Tenant Isolation:** Explicitly verified against IDOR attacks; cross-tenant uploads yield 403.

### 15. `GET /api/compliance/mappings`
- **Purpose:** Get control-to-asset/threat mappings.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.

## 9. AI

### 16. `POST /api/ai/ask`
- **Purpose:** LLM Orchestrator to explain verified backend data.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.
- **Request Body (`AIQuery`):**
  - `query` (string)
  - `context_type` (string)
  - `context_id` (string)
- **Frontend Notes:** AI explanations must be grounded in verified backend data and are not the source of financial/risk calculations. The backend strictly prevents AI hallucination regarding numeric risk output.

## 10. Admin

### 17. `POST /api/admin/roles`
- **Purpose:** Assign RBAC role to user.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** ADMIN access.
- **Request Body:**
  - `target_user_id` (string)
  - `role` (string)

## 11. Error Contract
- `401 Unauthorized`: Invalid, expired, or malformed JWT (patched).
- `403 Forbidden`: Authenticated user lacks required RBAC role or attempts cross-tenant access.
- `404 Not Found`: Resource does not exist or tenant boundary enforced.
- `422 Unprocessable Entity`: Schema mismatch (e.g., missing `min_val`, `likely_val` in FAIR requests).
- `500 Internal Server Error`: Critical backend exceptions.

## 12. RBAC Matrix
The actual implemented roles map to the following access levels:
- `ADMIN`: Full READ/WRITE/ADMIN access.
- `CISO`: READ/WRITE access.
- `RISK_MANAGER`: READ/WRITE access.
- `SECURITY_ANALYST`: READ access.
- `EXECUTIVE`: READ access.
- `AUDITOR`: READ access.

## 13. Tenant Isolation
Tenant isolation is enforced strictly at the API Application Layer. 
- The `get_current_user` dependency binds the token to an `organization_id`.
- Routes extract this `organization_id` and aggressively check it against the requested payload or path parameter.
- IDOR attacks (e.g., passing a different tenant's `organization_control_id`) have been natively patched and emit `403 Forbidden`.

## 14. Frontend Integration Rules
1. **JSON Formatting:** Always send `Content-Type: application/json`.
2. **Schema Rigidity:** Ensure Pydantic expectations are met natively. For FAIR, `min_val`, `likely_val`, `max_val` must be used strictly instead of `min/max/mode`.
3. **Data Completeness:** All 4 loss categories (`productivity_loss`, `response_cost`, `regulatory_loss`, `reputation_loss`) MUST be submitted for FAIR calculations.
4. **Token Handling:** The Postman Certification suite `CYBERVEST API Certification 2` verifies that standard `Bearer <token>` handling operates securely.

## 15. Frozen API Route Inventory
The complete 17-route inventory represents the frozen API topology:
1. `GET /health`
2. `/api/assets/` (GET, POST)
3. `GET /api/assets/{asset_id}`
4. `POST /api/fair/run`
5. `POST /api/optimization/run`
6. `POST /api/ml/predict`
7. `GET /api/compliance/frameworks`
8. `GET /api/compliance/frameworks/{framework_id}`
9. `GET /api/compliance/frameworks/{framework_id}/controls`
10. `GET /api/compliance/overview`
11. `GET /api/compliance/gaps`
12. `GET /api/compliance/findings`
13. `PATCH /api/compliance/controls/{organization_control_id}`
14. `POST /api/compliance/evidence`
15. `GET /api/compliance/mappings`
16. `POST /api/ai/ask`
17. `POST /api/admin/roles`

## Known Deferred Items
The following routes/endpoints are known and genuinely planned, but **currently unimplemented**. They are deferred for future milestones:
- Reporting/PDF/CSV export API endpoints.
- Standalone vulnerability CRUD API.
- Standalone security-event CRUD API.
- Standalone incident CRUD API.
- Future Service Role → authenticated JWT/RLS hardening (Supabase row-level isolation logic).

## API Freeze Declaration
- 17 runtime routes documented.
- API behavior is based on the current certified implementation.
- Postman certification completed.
- Authentication negative tests passed (malformed JWTs emit 401).
- Cross-tenant IDOR regression passed.
- Backend regression suite passed.
- **The frontend should consume this document as the API source of truth.**

## 16. Reports

### 18. `POST /api/reports/generate`
- **Purpose:** Generate structured JSON report data.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.
- **Request Body (`ReportRequest`):**
  - `report_type` (string)
- **Supported Types:** `FRAMEWORK_EVIDENCE`
- **Unsupported Types:** `EXECUTIVE_RISK`, `CISO_RISK`, `INVESTMENT`, `SCENARIO` (Returns 422).

### 19. `POST /api/reports/pdf`
- **Purpose:** Generate binary PDF document.
- **Authentication:** Bearer JWT required.
- **RBAC Role:** READ access.
- **Request Body (`ReportRequest`):**
  - `report_type` (string)
- **Supported Types:** `FRAMEWORK_EVIDENCE`
- **Unsupported Types:** `EXECUTIVE_RISK`, `CISO_RISK`, `INVESTMENT`, `SCENARIO` (Returns 422).
- **Successful Response:** `application/pdf` binary stream.
