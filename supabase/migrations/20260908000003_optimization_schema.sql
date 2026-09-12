-- Migration: Create Optimization tables

CREATE TABLE optimization_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    budget NUMERIC NOT NULL,
    baseline_eal NUMERIC NOT NULL,
    optimized_eal NUMERIC NOT NULL,
    risk_reduction NUMERIC NOT NULL,
    investment NUMERIC NOT NULL,
    rosi NUMERIC NOT NULL,
    solver_status TEXT NOT NULL,
    model_version TEXT NOT NULL,
    calculation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assumptions JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE optimization_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
    mitigation_id TEXT NOT NULL,
    mitigation_name TEXT NOT NULL,
    cost NUMERIC NOT NULL,
    modeled_eal_reduction NUMERIC NOT NULL,
    reason TEXT
);
