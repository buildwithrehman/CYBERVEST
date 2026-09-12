# Synthetic Data Generator Architecture

The Cybervest synthetic data generator enables predictable, configurable, and realistic mock scenarios for machine learning and FAIR quantitative modeling.

## Execution
The generator operates out of `scripts/data_generator/generate.py`.

```bash
cd scripts/data_generator
python3 generate.py --profile sih --seed 20260907
```

## Profiles Configuration (`config.py`)
Configurable size settings govern the magnitude of data produced, dynamically bound by ranges for entropy.
- **Demo**: 3 Organizations, targeted scale for UI mockups and light test environments.
- **SIH**: 10 Organizations, ~1,000 assets, ~60,000 events. Used for primary platform validations.
- **Stress**: 20+ Organizations, massive throughput generation.

## Correlation & Entropy (`generators/core.py`)
To prevent uniform distribution noise rendering ML unusable, synthetic data is seeded with intentional correlations containing realistic variance constraints. Examples include:
- **Exposure Risk**: Assets marked `internet_exposed = true` suffer incident occurrences at a ~21% statistically higher frequency than `internal` assets.
- **Financial Severity**: `total_loss` figures logarithmically correlate directly to the linked `business_service.criticality` thresholds (e.g., millions vs thousands).
- **Vulnerability Clusters**: Weak organizational security postures compound with internet exposure to spike the allocation and severity (CVSS) of detected vulnerabilities on an asset.

## Database Pushing (`exporter.py`)
Rather than outputting massive SQL text, the `exporter.py` automatically batches the created sets and writes them directly to the Supabase REST API `mohvhuwoishmmpeddepa` using the project's anonymous REST key configuration, respecting size thresholds and preserving existing seed data.
