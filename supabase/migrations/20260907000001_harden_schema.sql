-- Migration: Harden Schema for Risk Engines (Milestone 2)

-- 1. FAIR Schema enhancements
ALTER TABLE fair_scenarios
ADD COLUMN model_version TEXT,
ADD COLUMN probability_distribution TEXT DEFAULT 'PERT',
ADD COLUMN calculation_timestamp TIMESTAMPTZ;

-- 2. ML Schema enhancements
ALTER TABLE ml_predictions
ADD COLUMN prediction_probability NUMERIC CHECK (prediction_probability >= 0 AND prediction_probability <= 1),
ADD COLUMN prediction_label TEXT,
ADD COLUMN prediction_timestamp TIMESTAMPTZ DEFAULT NOW();

-- 3. Incident Schema enhancements
ALTER TABLE incidents
ADD COLUMN business_service_id UUID REFERENCES business_services(id) ON DELETE SET NULL,
ADD COLUMN incident_date TIMESTAMPTZ,
ADD COLUMN vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE SET NULL,
ADD COLUMN attack_vector TEXT,
ADD COLUMN data_compromised BOOLEAN DEFAULT FALSE,
ADD COLUMN direct_loss NUMERIC,
ADD COLUMN indirect_loss NUMERIC,
ADD COLUMN regulatory_loss NUMERIC,
ADD COLUMN reputational_loss NUMERIC,
ADD COLUMN total_loss NUMERIC,
ADD COLUMN confidence TEXT,
ADD COLUMN is_synthetic BOOLEAN DEFAULT TRUE;

-- Update existing records to map financial_loss to total_loss for consistency
UPDATE incidents SET total_loss = financial_loss WHERE financial_loss IS NOT NULL;

-- 4. Scenario Schema enhancements
ALTER TABLE scenarios
ADD COLUMN mitigation_control_id UUID REFERENCES controls(id) ON DELETE SET NULL,
ADD COLUMN status TEXT DEFAULT 'draft',
ADD COLUMN assumptions JSONB DEFAULT '{}';

-- 5. Optimization Schema enhancements
ALTER TABLE optimization_results
ADD COLUMN baseline_risk NUMERIC,
ADD COLUMN optimized_risk NUMERIC,
ADD COLUMN roi NUMERIC,
ADD COLUMN rosi NUMERIC,
ADD COLUMN optimization_objective TEXT,
ADD COLUMN model_version TEXT;

-- 6. Add is_synthetic flag to other generated transactional data
ALTER TABLE security_events
ADD COLUMN is_synthetic BOOLEAN DEFAULT TRUE;

ALTER TABLE threat_intelligence
ADD COLUMN is_synthetic BOOLEAN DEFAULT TRUE;

ALTER TABLE vulnerabilities
ADD COLUMN is_synthetic BOOLEAN DEFAULT TRUE;

-- 7. Add Data Quality Provenance fields to Assets and Controls
ALTER TABLE assets
ADD COLUMN source_type TEXT DEFAULT 'synthetic',
ADD COLUMN data_quality_status TEXT;

ALTER TABLE controls
ADD COLUMN is_synthetic BOOLEAN DEFAULT TRUE;

-- Additional Indexes for the new foreign keys and search fields
CREATE INDEX idx_incidents_business_service_id ON incidents(business_service_id);
CREATE INDEX idx_incidents_vulnerability_id ON incidents(vulnerability_id);
CREATE INDEX idx_scenarios_mitigation_control_id ON scenarios(mitigation_control_id);
