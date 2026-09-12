-- Migration: FAIR Schema Final Hardening (Milestone 2.1)

-- 1. Add business_service_id to fair_scenarios
ALTER TABLE fair_scenarios
ADD COLUMN business_service_id UUID REFERENCES business_services(id) ON DELETE SET NULL;

-- 2. Add calculation_timestamp to fair_results
ALTER TABLE fair_results
ADD COLUMN calculation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Add confidence to fair_results
ALTER TABLE fair_results
ADD COLUMN confidence TEXT;

-- 4. Add risk_drivers to fair_results
ALTER TABLE fair_results
ADD COLUMN risk_drivers JSONB DEFAULT '{}';

-- Create an index for the new foreign key
CREATE INDEX idx_fair_scenarios_business_service_id ON fair_scenarios(business_service_id);
