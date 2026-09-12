# Milestone 5.2 Security Audit

## Current Architecture
The current project consists of a Python-based quantitative risk engine (`risk_engine/`) containing FAIR Monte Carlo simulations, ML inference scripts, and an OR-Tools Optimization solver. Supabase is used as the PostgreSQL backend. The actual API layer currently consists of mock endpoint handlers (e.g., `run_optimization_endpoint` in `risk_engine/optimization/api.py`), while scripts use direct service-role/anon keys to interact with the database. A fully structured FastAPI entry point has not yet been built out, despite being considered the backend core.

## Current Authentication State
**None.** The Python scripts use the Supabase anon or service-role key to query data directly. There is no JWT parsing, no session handling, and no API authentication middleware.

## Current Authorization State
**None.** The backend scripts rely on providing valid `organization_id`s manually in the test scripts or optimization requests. There is no RBAC and no membership validation.

## Current RLS State
**Insecure / Bypassed.** Previous milestones disabled Row Level Security (RLS) entirely on tables like `optimization_runs` and `optimization_selections` to allow anonymous script execution. Other tables created in the initial schema may not have RLS enabled, or may have permissive policies (`USING (true)`).

## Security Gaps
1. No Identity Provider integration (Supabase Auth).
2. No FastAPI web application to host protected routes.
3. No Organization Membership table to enforce tenant isolation.
4. No Role-Based Access Control (RBAC).
5. RLS is either disabled or permissive on tenant-owned tables.
6. The `organization_id` can be spoofed in any function call.
7. Service-role keys or anonymous inserts are used instead of authenticated contexts.

## Tables Requiring Organization Isolation
Based on the existing database schema, the following tables require explicit organization-scoped RLS policies:
- `organizations`
- `business_services`
- `assets`
- `vulnerabilities`
- `security_events`
- `threat_intelligence`
- `controls`
- `incidents`
- `fair_scenarios`
- `fair_results`
- `ml_predictions`
- `optimization_runs`
- `optimization_selections`
- `audit_logs`

## Endpoints Requiring Protection
The future FastAPI routes wrapping existing core logic must be protected:
- `/api/fair/run`
- `/api/optimization/run`
- `/api/ml/predict`

## Proposed Architecture
1. **Supabase Auth Integration**: FastAPI will validate Supabase JWTs sent as Bearer tokens.
2. **Schema Enhancements**: 
   - `profiles` table linked to `auth.users`.
   - `organization_members` table linking `profiles.id` to `organizations.id` with a `role` enum.
3. **RBAC & FastAPI Dependencies**: Reusable FastAPI dependencies (`get_current_user`, `require_role`) to parse JWTs, query `organization_members` via the backend service role, and enforce permission levels.
4. **Tenant Isolation**: Backend API routes will automatically inject the verified `organization_id` from the membership context into all business logic calls.
5. **Strict RLS**: All tenant-owned tables will have RLS enabled with policies matching `organization_id = (select auth.uid() ...)` or similar mechanism to ensure true database-level isolation.
6. **Audit Logging**: A centralized `AuditService` will record privileged actions in the `audit_logs` table using the verified context.

## Migration Plan
1. Create SQL migrations for `profiles`, `organization_members`, and RLS policies on all existing tables.
2. Build the FastAPI `main.py` and structured API routers.
3. Implement `risk_engine/auth/dependencies.py` for JWT validation and RBAC.
4. Wrap existing FAIR, ML, and Optimization services into protected FastAPI routes.
5. Implement tests for authentication, authorization, and multi-tenant isolation.
