-- Migration: Milestone 5.3 Compliance Engine

-- ====================================================================================
-- GLOBAL / REFERENCE TABLES (Read-only for users, managed by Admins)
-- ====================================================================================

CREATE TABLE IF NOT EXISTS frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    short_name TEXT NOT NULL UNIQUE,
    version TEXT,
    description TEXT,
    source_url TEXT,
    effective_date DATE,
    jurisdiction TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS framework_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
    control_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    parent_control_id UUID REFERENCES framework_controls(id) ON DELETE SET NULL,
    mandatory BOOLEAN DEFAULT FALSE,
    effective_date DATE,
    source_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (framework_id, control_code)
);

CREATE TABLE IF NOT EXISTS control_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
    source_control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,
    target_framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
    target_control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,
    mapping_type TEXT CHECK (mapping_type IN ('equivalent', 'partially_aligned', 'related', 'supports')),
    mapping_confidence TEXT CHECK (mapping_confidence IN ('high', 'medium', 'low')),
    mapping_basis TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (source_control_id, target_control_id)
);

-- RLS for Reference Tables (Global Read)
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Global Read Frameworks" ON frameworks;
CREATE POLICY "Global Read Frameworks" ON frameworks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Global Read Framework Controls" ON framework_controls;
CREATE POLICY "Global Read Framework Controls" ON framework_controls FOR SELECT USING (true);

DROP POLICY IF EXISTS "Global Read Control Mappings" ON control_mappings;
CREATE POLICY "Global Read Control Mappings" ON control_mappings FOR SELECT USING (true);


-- ====================================================================================
-- TENANT-OWNED TABLES (Strict RLS Isolation)
-- ====================================================================================

CREATE TABLE IF NOT EXISTS organization_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
    applicability_status TEXT CHECK (applicability_status IN ('APPLICABLE', 'NOT_APPLICABLE', 'EVALUATING')),
    organization_type TEXT,
    assessment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, framework_id)
);

CREATE TABLE IF NOT EXISTS organization_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    framework_control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('NOT_ASSESSED', 'NOT_IMPLEMENTED', 'PARTIALLY_IMPLEMENTED', 'IMPLEMENTED', 'NOT_APPLICABLE', 'EXCEPTION')) DEFAULT 'NOT_ASSESSED',
    owner TEXT,
    last_reviewed_at TIMESTAMPTZ,
    review_due_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, framework_control_id)
);

CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    storage_path TEXT,
    evidence_type TEXT,
    source TEXT,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS control_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_control_id UUID NOT NULL REFERENCES organization_controls(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    evidence_present BOOLEAN DEFAULT TRUE,
    evidence_reviewed BOOLEAN DEFAULT FALSE,
    evidence_valid_until DATE,
    reviewer UUID REFERENCES profiles(id) ON DELETE SET NULL,
    review_status TEXT CHECK (review_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_control_id, evidence_id)
);

CREATE TABLE IF NOT EXISTS compliance_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    organization_control_id UUID NOT NULL REFERENCES organization_controls(id) ON DELETE CASCADE,
    severity TEXT CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    status TEXT CHECK (status IN ('OPEN', 'IN_PROGRESS', 'REMEDIATED', 'ACCEPTED_RISK')) DEFAULT 'OPEN',
    finding TEXT NOT NULL,
    business_impact TEXT,
    recommended_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link Compliance -> Asset / Scenario / Mitigation
CREATE TABLE IF NOT EXISTS compliance_risk_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    finding_id UUID NOT NULL REFERENCES compliance_findings(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES fair_scenarios(id) ON DELETE CASCADE,
    mitigation_control_id UUID REFERENCES controls(id) ON DELETE CASCADE, -- Link to quantitative remediation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================================
-- RLS POLICIES FOR TENANT TABLES
-- ====================================================================================

DO $$ 
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'organization_frameworks', 'organization_controls', 'evidence', 
        'compliance_findings', 'compliance_risk_links'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('
            ALTER TABLE %I ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Tenant Isolation Policy SELECT" ON %I;
            CREATE POLICY "Tenant Isolation Policy SELECT" ON %I FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
            
            DROP POLICY IF EXISTS "Tenant Isolation Policy INSERT" ON %I;
            CREATE POLICY "Tenant Isolation Policy INSERT" ON %I FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organizations()));
            
            DROP POLICY IF EXISTS "Tenant Isolation Policy UPDATE" ON %I;
            CREATE POLICY "Tenant Isolation Policy UPDATE" ON %I FOR UPDATE USING (organization_id IN (SELECT get_user_organizations()));
            
            DROP POLICY IF EXISTS "Tenant Isolation Policy DELETE" ON %I;
            CREATE POLICY "Tenant Isolation Policy DELETE" ON %I FOR DELETE USING (organization_id IN (SELECT get_user_organizations()));
        ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- Indirect scope for control_evidence via organization_control_id -> organization_id
ALTER TABLE control_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation Policy SELECT" ON control_evidence;
CREATE POLICY "Tenant Isolation Policy SELECT" ON control_evidence FOR SELECT 
USING (organization_control_id IN (SELECT id FROM organization_controls WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy INSERT" ON control_evidence;
CREATE POLICY "Tenant Isolation Policy INSERT" ON control_evidence FOR INSERT 
WITH CHECK (organization_control_id IN (SELECT id FROM organization_controls WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy UPDATE" ON control_evidence;
CREATE POLICY "Tenant Isolation Policy UPDATE" ON control_evidence FOR UPDATE 
USING (organization_control_id IN (SELECT id FROM organization_controls WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy DELETE" ON control_evidence;
CREATE POLICY "Tenant Isolation Policy DELETE" ON control_evidence FOR DELETE 
USING (organization_control_id IN (SELECT id FROM organization_controls WHERE organization_id IN (SELECT get_user_organizations())));
