-- Migration: Performance indexes for production query patterns
-- Adds targeted indexes for tables/columns with no existing index
-- that are frequently queried on hot production paths.

-- optimization_runs: tenant filter + latest-first sort
-- /api/optimization/latest: .eq("organization_id", ...).order("calculation_timestamp", desc).limit(1)
CREATE INDEX IF NOT EXISTS idx_optimization_runs_org_id
    ON optimization_runs (organization_id);

CREATE INDEX IF NOT EXISTS idx_optimization_runs_calculation_timestamp
    ON optimization_runs (calculation_timestamp DESC);

-- optimization_selections: run lookup
-- /api/optimization/latest: .eq("run_id", run_id)
CREATE INDEX IF NOT EXISTS idx_optimization_selections_run_id
    ON optimization_selections (run_id);

-- fair_results: order by created_at for /api/fair/latest
-- (scenario_id FK index already exists; this covers the ORDER BY created_at DESC inner join path)
CREATE INDEX IF NOT EXISTS idx_fair_results_created_at
    ON fair_results (created_at DESC);

-- organization_controls: tenant filter + status filter
-- /api/compliance/overview, /api/compliance/gaps, /api/reports/generate
--   .eq("organization_id", ...) and .in_("status", [...])
CREATE INDEX IF NOT EXISTS idx_organization_controls_org_id
    ON organization_controls (organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_controls_status
    ON organization_controls (status);

-- compliance_findings: tenant filter + status filter
-- /api/compliance/overview (eq status='OPEN'), /api/compliance/findings, /api/reports/*
CREATE INDEX IF NOT EXISTS idx_compliance_findings_org_id
    ON compliance_findings (organization_id);

CREATE INDEX IF NOT EXISTS idx_compliance_findings_status
    ON compliance_findings (status);

-- audit_logs: order by timestamp (org_id index already exists)
-- /api/audit: .order("timestamp", desc=True)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
    ON audit_logs (timestamp DESC);
