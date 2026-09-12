-- Synthetic Seed Data for DemoFin Bank

-- 1. Organization
INSERT INTO organizations (id, name, industry, country, organization_type)
VALUES ('00000000-0000-0000-0000-000000000001', 'DemoFin Bank', 'Financial Services', 'India', 'Bank');

-- 2. Business Services
INSERT INTO business_services (id, organization_id, name, description, criticality, annual_revenue_dependency)
VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Digital Payments', 'Digital payment processing including UPI and IMPS', 'critical', 500000000),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Internet Banking', 'Retail internet banking portal', 'high', 200000000),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Trading Platform', 'Stock and mutual fund trading platform', 'high', 150000000),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Customer Identity', 'Customer authentication and IAM', 'critical', 0),
    ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Core Banking', 'Core banking backend ledger', 'critical', 1000000000);

-- 3. Assets
INSERT INTO assets (id, organization_id, business_service_id, name, asset_type, environment, criticality, internet_exposed, data_sensitivity, owner, location, description)
VALUES
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Payment API', 'api', 'production', 'critical', true, 'high', 'Payments Team', 'AWS ap-south-1', 'API gateway for digital payments'),
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Payment Database', 'database', 'production', 'critical', false, 'high', 'Database Team', 'AWS ap-south-1', 'PostgreSQL storing payment transactions'),
    ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Internet Banking API', 'api', 'production', 'high', true, 'high', 'Retail Banking Team', 'AWS ap-south-1', 'Backend API for internet banking app'),
    ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Trading API', 'api', 'production', 'high', true, 'high', 'Trading Team', 'AWS ap-south-1', 'API for trading execution'),
    ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Customer Database', 'database', 'production', 'critical', false, 'high', 'IAM Team', 'On-Premises', 'Central customer profiles DB'),
    ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Identity Server', 'identity_system', 'production', 'critical', true, 'high', 'IAM Team', 'AWS ap-south-1', 'OAuth/OIDC provider'),
    ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Core Banking Server', 'server', 'production', 'critical', false, 'high', 'Core Systems Team', 'On-Premises', 'Mainframe running Finacle'),
    ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', NULL, 'Employee Laptop', 'workstation', 'corporate', 'low', true, 'low', 'IT Support', 'Various', 'Standard issue employee laptop');

-- 4. Vulnerabilities
INSERT INTO vulnerabilities (id, cve_id, asset_id, cvss_score, severity, attack_vector, exploit_available, known_exploited, epss_score, source)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'CVE-2023-12345', '20000000-0000-0000-0000-000000000001', 9.8, 'critical', 'network', true, true, 0.85, 'synthetic'),
    ('30000000-0000-0000-0000-000000000002', 'CVE-2023-67890', '20000000-0000-0000-0000-000000000002', 7.5, 'high', 'adjacent', false, false, 0.15, 'synthetic'),
    ('30000000-0000-0000-0000-000000000003', 'CVE-2021-44228', '20000000-0000-0000-0000-000000000006', 10.0, 'critical', 'network', true, true, 0.95, 'synthetic');

-- 5. Security Events
INSERT INTO security_events (asset_id, event_type, severity, source, timestamp, description)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'suspicious_network_activity', 'high', 'synthetic', NOW() - INTERVAL '2 days', 'Multiple failed requests from suspicious IP block'),
    ('20000000-0000-0000-0000-000000000006', 'failed_login', 'medium', 'synthetic', NOW() - INTERVAL '1 day', 'Brute force login attempt detected on identity server'),
    ('20000000-0000-0000-0000-000000000008', 'malware_detected', 'high', 'synthetic', NOW() - INTERVAL '5 hours', 'Ransomware precursor detected on employee laptop');

-- 6. Controls
INSERT INTO controls (id, organization_id, name, control_type, implementation_cost, implementation_time_days, effectiveness, implementation_status, source_type)
VALUES
    ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'MFA', 'preventive', 50000, 30, 0.9, 'implemented', 'synthetic'),
    ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Endpoint Detection and Response', 'detective', 120000, 45, 0.85, 'implemented', 'synthetic'),
    ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Network Segmentation', 'preventive', 200000, 90, 0.8, 'planned', 'synthetic'),
    ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Vulnerability Patching', 'preventive', 30000, 15, 0.7, 'implemented', 'synthetic'),
    ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Immutable Backup', 'recovery', 150000, 60, 0.95, 'implemented', 'synthetic'),
    ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Privileged Access Management', 'preventive', 100000, 60, 0.85, 'planned', 'synthetic');

-- 7. Threat Intelligence
INSERT INTO threat_intelligence (cve_id, threat_type, source, known_exploited, severity, confidence, description)
VALUES
    ('CVE-2023-12345', 'malware', 'synthetic', true, 'critical', 'high', 'Actively exploited in the wild targeting financial institutions'),
    ('CVE-2021-44228', 'rce', 'synthetic', true, 'critical', 'high', 'Log4Shell widely exploited vulnerability');
