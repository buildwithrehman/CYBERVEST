# ML Error Analysis

Because the dataset evaluates highly-randomized synthetic distributions, the models output near-random classification predictions. This allows us to observe mechanical biases in the algorithms rather than true structural patterns in cyber threats.

## Observations
- **False Negatives**: The HistGradientBoosting classifier exhibited a highly suppressed recall (`0.032`). Because incident frequency in the synthetic dataset was incredibly rare (approx 3% baseline), the tree algorithm heavily weighted towards the negative class to minimize overall LogLoss, resulting in substantial false negatives.
- **False Positives**: LogisticRegression with `class_weight='balanced'` generated a significantly higher recall (`0.354`) but collapsed precision in the process, resulting in high false positives (predicting many assets would be compromised when they were not). 
- **Brier Score**: The boosting classifier achieved an excellent Brier Score (0.033) compared to Logistic Regression (0.241), meaning its raw continuous probability curve remained highly calibrated to the low baseline event rate, despite poor binary classification thresholds at `0.5`.

## Corrective Adjustments
To deploy this operationally:
1. The classification threshold should be dynamically lowered from `0.5` utilizing the Precision-Recall curve based on organizational appetite for false alarms.
2. Causal synthetic rules (linking high event velocity directly to incident outcomes) must be generated if the model is expected to learn synthetic patterns.
