# Compliance Gap Engine

The CYBERVEST Gap Engine is designed to identify compliance deficiencies objectively rather than relying on abstract percentages.

## Mechanics
When `GET /api/compliance/gaps` is called, the backend queries `organization_controls`.
A gap is flagged if a mandatory control's `status` is evaluated as:
- `NOT_IMPLEMENTED`
- `PARTIALLY_IMPLEMENTED`
- `NOT_ASSESSED`

## Evidence Constraints
Evidence tracking via `control_evidence` enforces strict compliance states.
- If `evidence_present` is false or evidence is `EXPIRED`, the control cannot mathematically satisfy a strictly `IMPLEMENTED` state from an auditor's perspective.
- A Control marked `IMPLEMENTED` without associated `ACCEPTED` evidence will highlight an evidence-gap finding.

## Reporting
Gaps are natively aggregated into the `/api/compliance/overview` endpoint allowing executives to see exact missing control counts categorized by Framework (e.g., SEBI CSCRF: 4 Gaps).
