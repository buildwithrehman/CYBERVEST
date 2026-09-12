# Milestone 5.2 Security Architecture

## 1. Authentication Architecture
The system employs **Supabase Auth** as the identity provider. The frontend (Next.js) will handle the user interface for email/password authentication, capturing the JWT Access Token. The backend (FastAPI) receives this token via the `Authorization: Bearer <token>` header and verifies its cryptographic signature using the Supabase Admin/Client SDK.

## 2. Authorization Architecture & Multi-Tenant Isolation
CYBERVEST is a multi-tenant platform. Tenant isolation is achieved structurally via the `organization_members` junction table.
When a request arrives:
1. FastAPI validates the JWT.
2. The user's UUID is extracted.
3. The backend resolves the user's explicit Membership and `app_role` from the database.
4. The resolved `organization_id` is injected into the request context.
5. Every business logic operation enforces that payload `organization_id` matches the token-derived identity.

## 3. PostgreSQL Row Level Security (RLS)
The deepest layer of defense is the database itself. Permissive policies were dropped and replaced with strict tenant isolation.
A `get_user_organizations()` SECURITY DEFINER function retrieves the active tenant contexts for the authenticated user.
Every tenant-owned table (`assets`, `fair_scenarios`, `ml_predictions`, etc.) implements:
- `FOR SELECT USING (organization_id IN (SELECT get_user_organizations()))`
- Indirect relationships (like `vulnerabilities` which map to `asset_id`) implement nested lookup policies to enforce ownership securely.

## 4. FastAPI Security Dependencies
The `risk_engine.auth.dependencies` module provides composable security constraints:
- `get_current_user`: Base authentication verifier.
- `require_role(roles)`: Role checker factory.
- `require_write_access()`: Granular gate for POST/PUT/DELETE.

## 5. Audit Logging
Sensitive actions (e.g., Running a FAIR simulation, executing Optimization) trigger `log_audit_event()`. This utilizes a secure, backend-only service-role client to insert immutable records into the `audit_logs` table, ensuring non-repudiation of user actions.

## 6. Known Limitations & Production Hardening
- **Local Prototype Scope**: The current test environment overrides dependencies to bypass actual external HTTP token validation during CI execution. True JWT testing requires an active Supabase Auth instance.
- **Service Role Usage**: The `run_demo.py` and `run_optimization.py` scripts still bypass RLS for demonstration convenience. In production, these scripts must be deprecated in favor of authorized API calls.
- **Frontend Sync**: The frontend requires configuration to map user profile metadata securely without trusting local browser state.
