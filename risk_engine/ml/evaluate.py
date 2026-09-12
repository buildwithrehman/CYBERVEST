import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, brier_score_loss, confusion_matrix
)
from sklearn.calibration import CalibratedClassifierCV

def evaluate_model(model, X_test, y_test, preprocessor=None, threshold=0.5):
    if preprocessor:
        X_test_proc = preprocessor.transform(X_test)
    else:
        X_test_proc = X_test
        
    y_prob = model.predict_proba(X_test_proc)[:, 1]
    y_pred = (y_prob >= threshold).astype(int)
    
    # Handle edge case where classes might be severely imbalanced or pure
    if len(np.unique(y_test)) > 1:
        roc_auc = roc_auc_score(y_test, y_prob)
        pr_auc = average_precision_score(y_test, y_prob)
    else:
        roc_auc = float('nan')
        pr_auc = float('nan')
        
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred, zero_division=0),
        'recall': recall_score(y_test, y_pred, zero_division=0),
        'f1': f1_score(y_test, y_pred, zero_division=0),
        'roc_auc': roc_auc,
        'pr_auc': pr_auc,
        'brier_score': brier_score_loss(y_test, y_prob)
    }
    return metrics, y_prob

def calibrate_model(model, X_val, y_val, preprocessor):
    X_val_proc = preprocessor.transform(X_val)
    calibrated = CalibratedClassifierCV(estimator=model, method='sigmoid', cv='prefit')
    calibrated.fit(X_val_proc, y_val)
    return calibrated
