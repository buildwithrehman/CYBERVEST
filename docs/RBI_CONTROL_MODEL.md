# RBI Control Model

The RBI Master Direction on Information Technology Governance, Risk, Controls and Assurance Practices (2023) is implemented natively as a primary compliance framework in CYBERVEST.

## Implementation Details
- **Short Name**: `RBI IT Governance 2023`
- **Jurisdiction**: India
- **Structure**: The framework is broken down into thematic categories (IT Governance, Risk Management, Information Security).
- **Controls Included**:
  - `RBI-ITG-1`: IT Strategy Committee (ITSC)
  - `RBI-RM-1`: Annual IT Risk Assessment
  - `RBI-INC-1`: 6-Hour Cyber Incident Reporting

## Applicability
Regulated Entities (REs) such as Banks and NBFCs apply this framework. In CYBERVEST, an organization is explicitly mapped to this framework using `organization_frameworks(applicability_status = 'APPLICABLE')`.

## Evidence & Verification
CYBERVEST tracks explicitly if evidence (e.g., ITSC meeting minutes, Risk Assessment reports) is linked to RBI controls. Gaps in evidence directly flag the control as `PARTIALLY_IMPLEMENTED` or `NOT_IMPLEMENTED`.
