# Milestone 2 Data Validation & Distribution Report

## Dataset Profile
- Organizations: 10
- Business Services: 48
- Assets: 995
- Vulnerabilities: 5029
- Security Events: 59071
- Incidents: 669
- Controls: 224

## Asset Criticality Distribution
- high: 32.2% (320)
- low: 7.3% (73)
- medium: 23.6% (235)
- critical: 36.9% (367)

## Vulnerability Severity Distribution
- high: 40.9% (2055)
- critical: 21.7% (1092)
- medium: 37.4% (1882)

## Internet Exposure
- Exposed: 50.7% (504)

## Metrics
- Average CVSS: 7.39

## Correlation Validation
- Incident rate for exposed assets: 0.74 per asset
- Incident rate for internal assets: 0.61 per asset
- Logical validation: PASS (Exposed rate should be >= internal rate)