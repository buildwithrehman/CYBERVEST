-- Migration: Security, Auth, RBAC, Profiles, and Organization Members

-- 1. Create Application Roles Enum
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM (
        'ADMIN',
        'CISO',
        'SECURITY_ANALYST',
        'RISK_MANAGER',
        'EXECUTIVE',
        'AUDITOR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Organization Members Table
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Helper function to get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_organizations() 
RETURNS SETOF UUID 
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid();
$$;

-- 4. Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fair_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE fair_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Drop any existing permissive policies (Optional cleanup)
-- (We assume we are explicitly defining them below)

-- 6. Define RLS Policies

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT USING (auth.uid() = id);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations: Users can view organizations they are members of
CREATE POLICY "Users can view their organizations" 
ON organizations FOR SELECT 
USING (id IN (SELECT get_user_organizations()));

-- Organization Members: Users can view members of their organizations
CREATE POLICY "Users can view members of their organizations" 
ON organization_members FOR SELECT 
USING (organization_id IN (SELECT get_user_organizations()));

-- Tenant-Owned Tables RLS
-- Using the helper function for performant tenant isolation.
-- Users can only SELECT/INSERT/UPDATE/DELETE rows belonging to their organizations.
-- Realistically, INSERT/UPDATE/DELETE should be further protected by roles via the backend,
-- but the DB MUST restrict it strictly to the tenant context.

DO $$ 
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'business_services', 'assets', 'vulnerabilities', 'security_events', 
        'threat_intelligence', 'controls', 'incidents', 'fair_scenarios', 
        'fair_results', 'ml_predictions', 'optimization_runs', 
        'audit_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "Tenant Isolation Policy SELECT" ON %I;
            CREATE POLICY "Tenant Isolation Policy SELECT" ON %I FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));
            
            DROP POLICY IF EXISTS "Tenant Isolation Policy INSERT" ON %I;
            CREATE POLICY "Tenant Isolation Policy INSERT" ON %I FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organizations()));
            
            DROP POLICY IF EXISTS "Tenant Isolation Policy UPDATE" ON %I;
            CREATE POLICY "Tenant Isolation Policy UPDATE" ON %I FOR UPDATE USING (organization_id IN (SELECT get_user_organizations()));
            
            DROP POLICY IF EXISTS "Tenant Isolation Policy DELETE" ON %I;
            CREATE POLICY "Tenant Isolation Policy DELETE" ON %I FOR DELETE USING (organization_id IN (SELECT get_user_organizations()));
        ', tbl, tbl, tbl, tbl, tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- Special case for optimization_selections which links to optimization_runs, not directly to org id.
DROP POLICY IF EXISTS "Tenant Isolation Policy SELECT" ON optimization_selections;
CREATE POLICY "Tenant Isolation Policy SELECT" ON optimization_selections FOR SELECT 
USING (run_id IN (SELECT id FROM optimization_runs WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy INSERT" ON optimization_selections;
CREATE POLICY "Tenant Isolation Policy INSERT" ON optimization_selections FOR INSERT 
WITH CHECK (run_id IN (SELECT id FROM optimization_runs WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy UPDATE" ON optimization_selections;
CREATE POLICY "Tenant Isolation Policy UPDATE" ON optimization_selections FOR UPDATE 
USING (run_id IN (SELECT id FROM optimization_runs WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy DELETE" ON optimization_selections;
CREATE POLICY "Tenant Isolation Policy DELETE" ON optimization_selections FOR DELETE 
USING (run_id IN (SELECT id FROM optimization_runs WHERE organization_id IN (SELECT get_user_organizations())));
