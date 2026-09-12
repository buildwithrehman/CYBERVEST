# CYBERVEST SECURITY ARCHITECTURE VERIFICATION
**Status:** COMPLETED (Read-Only Code Audit)
**Focus:** PostgreSQL RLS, Tenant Isolation, and Authentication contexts.

## A. DATABASE ACCESS ARCHITECTURE
The CYBERVEST FastAPI backend utilizes multiple database authentication contexts concurrently:
1. **Supabase Anon Key + Auth JWT:** Used by `auth/dependencies.py` to cryptographically verify the user and extract RBAC contexts.
2. **Supabase Service Role Key:** Used by `compliance.py` and `audit.py` to bypass Row Level Security (RLS) entirely, performing actions with superuser permissions.
3. **In-Memory Computations:** FAIR, Optimization, ML, and AI routes currently accept JSON payloads directly into mathematical modules, avoiding real-time DB fetches on those specific routes.

## B. ROUTE → DATABASE ACCESS MAPPING
| Route Family | DB Context Utilized |
|--------------|----------------------|
| `auth/dependencies.py` | Authenticated Client (JWT) |
| `/api/compliance/*` | Service Role Client (Bypass RLS) |
| `/api/audit/*` | Service Role Client (Bypass RLS) |
| `/api/fair/*` | In-Memory (Payload driven) |
| `/api/optimization/*`| In-Memory (Payload driven) |
| `/api/ml/*` | In-Memory (Mocked payload driven) |
| `/api/assets/*` | In-Memory (Mocked payload driven) |

## C. RLS ENFORCED/BYPASSED PER ROUTE
- **ENFORCED:** Initial JWT authentication & RBAC lookup (`get_current_user`).
- **BYPASSED:** ALL endpoints within `/api/compliance/*`. Because these routes initialize `create_client(url, SUPABASE_SERVICE_ROLE_KEY)`, PostgreSQL RLS is natively bypassed.
- **BYPASSED:** All background audit logging (`services/audit.py`).

## D. APPLICATION-LAYER TENANT CHECKS
Because RLS is functionally bypassed in the compliance engine, CYBERVEST relies entirely on **Application-Layer Tenant Checks**:
- `GET` routes explicitly filter `.eq("organization_id", user.organization_id)`.
- `PATCH /api/compliance/controls/{id}` performs an explicit pre-fetch to verify ownership (`if existing.organization_id != user.organization_id: raise 403`).
- FAIR and Optimization endpoints perform strict payload string comparisons (`if request.organization_id != user.organization_id: raise 403`).

## E. CROSS-TENANT ATTACK PATHS (IDOR)
I identified a structural flaw caused by the RLS bypass interacting with missing application-layer checks:
- **VULNERABLE ROUTE:** `POST /api/compliance/evidence`
- **ATTACK PATH:** The endpoint correctly forces `evidence.organization_id = user.organization_id`. However, it immediately inserts a linking row into `control_evidence` using the attacker-supplied `payload.organization_control_id`. It **never verifies** whether that target control actually belongs to the user's organization. 
- **IMPACT:** Because the query runs as the Service Role, an attacker can supply the UUID of a control belonging to a competitor's tenant, successfully attaching their evidence to the competitor's regulatory control framework.

## F. CURRENT SECURITY STATUS
**CLASSIFICATION:** **PASS WITH LIMITATION**
- The basic IDOR protections on the heavy engines (FAIR, Optimization, Compliance PATCH) are solid.
- The use of the Service Role Key within the Compliance engine is highly dangerous and breaks the intended defense-in-depth provided by PostgreSQL RLS.

## G. EXACT REMEDIATION REQUIRED
1. **Compliance Evidence Endpoint:** Update `POST /api/compliance/evidence` to pre-fetch the target `organization_control_id` and assert ownership before inserting into `control_evidence`.
2. **Global Architecture:** Refactor `risk_engine/api/routers/compliance.py` to instantiate the Supabase client using the authenticated user's JWT (`client.auth.set_session(token)`) instead of hardcoding `SUPABASE_SERVICE_ROLE_KEY`. This will shift tenant isolation responsibility back to the robust PostgreSQL RLS layer, eliminating the possibility of application-level IDORs.
