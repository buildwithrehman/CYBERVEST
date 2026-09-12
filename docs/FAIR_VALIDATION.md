# FAIR Validation & Testing Results

The FAIR Cyber Risk Quantification engine was subjected to rigorous validation via unit and dynamic sensitivity testing. 

## Automated Test Results (`pytest`)
A suite of **12 strict deterministic test suites** passed verifying bounds, equations, percentiles, EAL accuracy, and failure assertions.
- **PASS**: Valid PERT parameters produce values strictly within bounds.
- **PASS**: Invalid PERT parameters and susceptibility metrics gracefully fail via `ValidationError`.
- **PASS**: Percentile logic behaves sequentially (`P10 <= P50 <= P90`).
- **PASS**: Expected Annual Loss (EAL) correctly asserts to statistical matrix Mean (not P50).
- **PASS**: Compound Poisson correctly yields Zero-Loss years given significantly low LEF thresholds.

## Baseline Scenario Analysis (DemoFin Bank - Payment API)
A worked scenario representing an internet-facing Payment API utilizing the following inputs parameters:
- **TEF**: [2.0, 10.0, 25.0]
- **Susceptibility**: [0.4, 0.6, 0.9]
- **Primary Loss**: Productivity [100k, 500k, 2m] + Response [50k, 100k, 300k]
- **Secondary Loss**: Regulatory [0, 0, 1m] + Reputation [0, 200k, 1.5m]

**Calculated Outputs (10,000 Simulations)**:
- **Mean LEF**: 6.92 events/year
- **P10 Annual Loss**: ₹3,059,872.16
- **P50 Annual Loss**: ₹8,652,961.88
- **P90 Annual Loss**: ₹16,797,605.59
- **Expected Annual Loss (EAL)**: **₹9,419,593.55**

## Dynamic Sensitivity Testing
Using the baseline, intentional dimensional shocks were executed mathematically asserting theoretical boundaries:

| Condition | Baseline | Perturbation | Output (EAL) | Result |
| :--- | :--- | :--- | :--- | :--- |
| **A (Baseline)** | Normal | N/A | ₹9,419,593 | N/A |
| **B (TEF Shock)** | Normal | High TEF | ₹19,602,637 | **PASS** (Increased) |
| **C (Susceptibility Shock)** | Normal | High Susc | ₹13,700,321 | **PASS** (Increased) |
| **D (Severity Shock)** | Normal | High Loss | ₹52,059,749 | **PASS** (Increased) |
| **E (Mitigation)** | Normal | Susc < 0.1 | ₹782,893 | **PASS** (Decreased) |

## Reproducibility
The baseline scenario generates explicitly identical results via fixed simulation seeding (`seed=20260907`), preserving transparency and deterministic review standards.

## Execution Footprint
Fully vectorized `numpy` architecture permits a 10,000 count simulation of the entire scenario to resolve in **20.58 ms** on native hardware (no artificial looping).

## Limitations & Assertions
- The current engine is structured for demonstration simulation. Results are quantitative "modeled estimates under stated assumptions" applying to synthetic telemetry, rather than explicitly real-world financial liability figures. 
- Machine learning risk prediction is strictly omitted during this quantitative milestone.
