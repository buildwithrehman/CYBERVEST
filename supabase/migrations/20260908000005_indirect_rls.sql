-- Migration: Corrected RLS Policies for indirect scopes

-- vulnerabilities (via asset_id -> organization_id)
DROP POLICY IF EXISTS "Tenant Isolation Policy SELECT" ON vulnerabilities;
CREATE POLICY "Tenant Isolation Policy SELECT" ON vulnerabilities FOR SELECT 
USING (asset_id IN (SELECT id FROM assets WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy INSERT" ON vulnerabilities;
CREATE POLICY "Tenant Isolation Policy INSERT" ON vulnerabilities FOR INSERT 
WITH CHECK (asset_id IN (SELECT id FROM assets WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy UPDATE" ON vulnerabilities;
CREATE POLICY "Tenant Isolation Policy UPDATE" ON vulnerabilities FOR UPDATE 
USING (asset_id IN (SELECT id FROM assets WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy DELETE" ON vulnerabilities;
CREATE POLICY "Tenant Isolation Policy DELETE" ON vulnerabilities FOR DELETE 
USING (asset_id IN (SELECT id FROM assets WHERE organization_id IN (SELECT get_user_organizations())));

-- security_events (via asset_id -> organization_id)
DROP POLICY IF EXISTS "Tenant Isolation Policy SELECT" ON security_events;
CREATE POLICY "Tenant Isolation Policy SELECT" ON security_events FOR SELECT 
USING (asset_id IN (SELECT id FROM assets WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy INSERT" ON security_events;
CREATE POLICY "Tenant Isolation Policy INSERT" ON security_events FOR INSERT 
WITH CHECK (asset_id IN (SELECT id FROM assets WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy UPDATE" ON security_events;
CREATE POLICY "Tenant Isolation Policy UPDATE" ON security_events FOR UPDATE 
USING (asset_id IN (SELECT id FROM assets WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy DELETE" ON security_events;
CREATE POLICY "Tenant Isolation Policy DELETE" ON security_events FOR DELETE 
USING (asset_id IN (SELECT id FROM assets WHERE organization_id IN (SELECT get_user_organizations())));

-- fair_results (via scenario_id -> organization_id)
DROP POLICY IF EXISTS "Tenant Isolation Policy SELECT" ON fair_results;
CREATE POLICY "Tenant Isolation Policy SELECT" ON fair_results FOR SELECT 
USING (scenario_id IN (SELECT id FROM fair_scenarios WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy INSERT" ON fair_results;
CREATE POLICY "Tenant Isolation Policy INSERT" ON fair_results FOR INSERT 
WITH CHECK (scenario_id IN (SELECT id FROM fair_scenarios WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy UPDATE" ON fair_results;
CREATE POLICY "Tenant Isolation Policy UPDATE" ON fair_results FOR UPDATE 
USING (scenario_id IN (SELECT id FROM fair_scenarios WHERE organization_id IN (SELECT get_user_organizations())));

DROP POLICY IF EXISTS "Tenant Isolation Policy DELETE" ON fair_results;
CREATE POLICY "Tenant Isolation Policy DELETE" ON fair_results FOR DELETE 
USING (scenario_id IN (SELECT id FROM fair_scenarios WHERE organization_id IN (SELECT get_user_organizations())));

-- Make threat_intelligence globally readable
ALTER TABLE threat_intelligence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation Policy SELECT" ON threat_intelligence;
CREATE POLICY "Global Read Threat Intel" ON threat_intelligence FOR SELECT USING (true);
