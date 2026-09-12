# CYBERVEST ML Intelligence Engine

The ML component of CYBERVEST is responsible for predicting the likelihood of an asset experiencing a cybersecurity incident within a **15-day forward window**.

## Architecture & Responsibilities
This component generates purely probabilistic signals (`$P(Incident \mid 15d)$`) based strictly on Point-in-Time (PIT) historical data.
It **does not** automatically override or calculate the financial loss. It outputs an intelligence signal meant to justify FAIR Threat Event Frequency (TEF) adjustments by a human analyst or business rules engine.

## Validated Core Principles
1. **Target Leakage Prevention**: Future events, future incidents, and future patches are strictly masked during feature calculation.
2. **Point-In-Time Dataset**: Assets are snapshotted across uniform random dates spanning 90 days of history, resulting in a robust, multi-temporal observation matrix.
3. **Reproducibility**: `test_ml.py` enforces constraints using fixed seeds (`20260907`), verifying deterministic boundaries.

## Usage
* **Feature Pipeline**: `python risk_engine/ml/features.py`
* **Training Pipeline**: `python risk_engine/ml/train.py`
* **Inference Pipeline**: `python risk_engine/ml/predict.py`
* **FAIR Engine API**: `risk_engine/fair/calculator.py`
* **Optimization Engine API**: `risk_engine/optimization/api.py`

*See `docs/ML_VALIDATION.md` for in-depth evaluations of the ML Engine.*
*See `docs/optimization.md` for in-depth details of the OR-Tools Mathematical Optimization Engine.*
