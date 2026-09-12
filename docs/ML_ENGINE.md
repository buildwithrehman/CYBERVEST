# ML Intelligence Engine

The CYBERVEST Machine Learning Intelligence Engine provides dynamic likelihood predictions (15-day incident forecasting) utilizing historical telemetry without violating or overriding the primary FAIR risk quantification framework.

## Architecture

1. **Feature Pipeline (`features.py`)**: Responsible for extracting time-series aggregates (Vulnerabilities, Events, previous Incidents, and Asset attributes) dynamically based on any arbitrary Point-In-Time (PIT) cutoff.
2. **Preprocessing (`preprocessing.py`)**: Employs Scikit-Learn `ColumnTransformer` and `Pipeline` architectures to impute missing numerics automatically and safely one-hot encode categorical boundaries without assigning arbitrary ordinal weights (e.g., Critical = 4, Low = 1 is rejected).
3. **Model Selection (`models.py` / `train.py`)**: Uses `HistGradientBoostingClassifier` optimized for imbalanced classes alongside `LogisticRegression` baselines. 
4. **Inference & Persistence (`predict.py`)**: Executes daily prediction batches and syncs the prediction probabilities, classification labels, and complete point-in-time feature snapshots directly into the Supabase `ml_predictions` table.

## Model Metadata & Artifacts
The training pipeline outputs versioned `.joblib` objects for both the model and the preprocessor (`model_v1.joblib`, `preprocessor_v1.joblib`), ensuring prediction pipelines execute with identical matrix mappings without re-fitting.

## Integration Contract
The ML model strictly emits a probabilistic likelihood metric (e.g. `0.73`). It does **not** map this to a dollar loss, nor does it override FAIR Monte Carlo generation automatically. It acts as an intelligence signal to guide analysts configuring Risk Engine Threat Event Frequencies.
