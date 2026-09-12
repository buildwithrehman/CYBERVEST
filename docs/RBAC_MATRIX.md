# RBAC Matrix

## Application Roles

1. **ADMIN**: Full administrative control over organization resources.
2. **CISO**: Strategic risk and security oversight.
3. **SECURITY_ANALYST**: Tactical security event and vulnerability management.
4. **RISK_MANAGER**: Quantitative risk quantification and FAIR reporting.
5. **EXECUTIVE**: Dashboard and strategic reporting viewer.
6. **AUDITOR**: Read-only compliance and evidence verification.

## Permission Matrix

| Resource / Action | ADMIN | CISO | SECURITY_ANALYST | RISK_MANAGER | EXECUTIVE | AUDITOR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Organization Config** | Manage | View | View | View | View | View |
| **User Roles** | Manage | View | None | None | None | None |
| **Assets & Vulns** | Manage | Manage | Manage | View | None | View |
| **Incidents & Events** | Manage | Manage | Manage | View | View | View |
| **FAIR Scenarios** | Manage | Manage | Manage | Manage | View | View |
| **ML Inference** | Execute | Execute | Execute | Execute | View | View |
| **Investment Opt.** | Execute | Execute | None | Execute | View | View |
| **Reporting & Dash**| View | View | View | View | View | View |

## FastAPI Implementation
Roles are strictly evaluated via `risk_engine.auth.dependencies` using the Supabase JWT.
- `require_write_access` allows ADMIN, CISO, SECURITY_ANALYST, RISK_MANAGER
- `require_read_access` allows ALL roles
- Route-specific explicit checks via `Depends(get_admin)` or `Depends(get_ciso)`.
