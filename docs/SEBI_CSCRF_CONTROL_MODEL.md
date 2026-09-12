# SEBI CSCRF Control Model

The SEBI Cybersecurity and Cyber Resilience Framework (CSCRF) issued in August 2024 is the consolidated security benchmark for Market Infrastructure Institutions (MIIs) and SEBI Regulated Entities.

## Implementation Details
- **Short Name**: `SEBI CSCRF 2024`
- **Jurisdiction**: India
- **Structure**: Modeled using the Anticipate, Withstand, Contain, Recover, and Evolve paradigm (aligned to NIST Identify, Protect, Detect, Respond, Recover).
- **Controls Included**:
  - `SEBI-GOV-1`: Board-level Cybersecurity Committee (Governance)
  - `SEBI-ID-1`: Comprehensive Asset Inventory (Identify)
  - `SEBI-PR-1`: API Security & Data Localization (Protect)
  - `SEBI-RES-1`: 6-Hour Incident Reporting (Respond)

## Mapping to Other Frameworks
SEBI requirements are analytically mapped to their corresponding RBI and NIST controls within the `control_mappings` table. For example, `SEBI-RES-1` maps to `RBI-INC-1` and `NIST RS.MA-04` ensuring deduplication of evidentiary efforts during cross-audits.
