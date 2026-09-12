# CYBERVEST Threat Model

## 1. Cross-Tenant Data Access (IDOR)
- **Attack Vector**: User manipulates `organization_id` in API payload or queries another tenant's asset via ID.
- **Impact**: Critical data breach of highly sensitive financial risk and vulnerability telemetry.
- **Mitigation**: Strict FastAPI dependency scoping + PostgreSQL Row Level Security (RLS) guaranteeing that `SELECT/INSERT/UPDATE/DELETE` evaluates `organization_id = get_user_organizations()`.
- **Test**: `test_cross_tenant_fair_scenario`, `test_cross_tenant_ml_predict` enforce 403 blocks.

## 2. JWT Tampering & Role Escalation
- **Attack Vector**: Attacker modifies the JWT payload to elevate `role` to `ADMIN` or switch `organization_id`.
- **Impact**: Privilege escalation leading to organizational takeover.
- **Mitigation**: Supabase Auth uses HMAC-SHA256 signature verification. The backend retrieves roles directly from the secure backend `organization_members` table rather than trusting a frontend-provided role.
- **Test**: Simulated in dependency overrides where injected fake roles are strictly constrained by the backend route decorators.

## 3. Service-Role Key Leakage
- **Attack Vector**: The `SUPABASE_SERVICE_ROLE_KEY` is accidentally exposed to the frontend or API responses.
- **Impact**: Total bypass of RLS policies globally across all tenants.
- **Mitigation**: The service-role key is strictly isolated to backend environment variables and used exclusively by the `AuditService`. The frontend only receives the `anon` public key.

## 4. API Abuse / Unauthenticated Access
- **Attack Vector**: Direct curl requests to backend risk quantification engines without a JWT.
- **Impact**: Denial of Service (compute exhaustion via Monte Carlo) and potential data leakage.
- **Mitigation**: FastAPI `HTTPBearer` intercepts all routes (except `/health`), ensuring valid Supabase identity before executing business logic.
- **Test**: `test_unauthenticated_request` expects 401 Unauthorized.

## 5. Insecure Audit Logs
- **Attack Vector**: Malicious insider deletes their own audit traces.
- **Impact**: Loss of forensic non-repudiation.
- **Mitigation**: The `audit_logs` table has RLS policies that prevent UPDATE/DELETE. Audit writing is handled exclusively via the Service Role wrapper in `risk_engine.services.audit`.
