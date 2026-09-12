# Compliance to Risk Linkage

CYBERVEST creates a differentiated compliance workflow by connecting regulatory requirements to quantitative FAIR financial risk.

## The Data Chain

1. **Regulatory Requirement**: `framework_controls` (e.g., SEBI CSCRF API Security).
2. **Control Gap**: `organization_controls` (Status: NOT IMPLEMENTED).
3. **Finding Generation**: A `compliance_findings` record is generated.
4. **Risk Linkage**: The finding is mapped via `compliance_risk_links` to:
   - **Asset**: Which server/API lacks the control.
   - **FAIR Scenario**: The scenario evaluating the financial exposure of that asset.
   - **Mitigation Control**: The `controls` catalog entry required to fix it.

## FAIR Influence
A compliance gap indirectly influences FAIR outputs by altering the `susceptibility` distribution. For instance, a missing API security control increases the likelihood that a threat event succeeds, which mathematically increases the Loss Event Frequency (LEF) and subsequently the Expected Annual Loss (EAL).

## Optimization Engine
When OR-Tools evaluates investment portfolios, it can now prioritize `controls` that serve a dual purpose:
1. Maximize EAL Reduction (Primary Objective)
2. Remediate SEBI/RBI compliance gaps (Secondary Constraint/Weight)

*CYBERVEST does NOT calculate financial risk directly in the compliance service; it relies strictly on the mathematical outputs of the validated FAIR and OR-Tools engines.*
