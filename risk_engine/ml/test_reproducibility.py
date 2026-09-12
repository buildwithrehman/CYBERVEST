import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from risk_engine.ml.dataset import extract_raw_data
from risk_engine.ml.preprocessing import get_preprocessor
from risk_engine.ml.certify_model import build_temporal_dataset
from datetime import datetime

def test_reproducibility():
    raw_data = extract_raw_data()
    t_train_start = datetime(2026, 6, 11)
    t_train_end = datetime(2026, 7, 26)
    t_val_end = datetime(2026, 8, 10)
    
    X_cols = ['asset_type', 'criticality', 'internet_exposed', 'vuln_count', 'cvss_max', 'known_exploited_count', 'recent_event_count_30d', 'prior_incident_count']
    
    # RUN 1
    df_train_1 = build_temporal_dataset(raw_data, t_train_start, t_train_end)
    df_val_1 = build_temporal_dataset(raw_data, t_train_end, t_val_end)
    
    prep_1 = get_preprocessor()
    X_train_1 = prep_1.fit_transform(df_train_1[X_cols])
    X_val_1 = prep_1.transform(df_val_1[X_cols])
    
    model_1 = LogisticRegression(random_state=42, max_iter=1000)
    model_1.fit(X_train_1, df_train_1['target'].values)
    auc_1 = roc_auc_score(df_val_1['target'].values, model_1.predict_proba(X_val_1)[:, 1])
    
    # RUN 2
    df_train_2 = build_temporal_dataset(raw_data, t_train_start, t_train_end)
    df_val_2 = build_temporal_dataset(raw_data, t_train_end, t_val_end)
    
    prep_2 = get_preprocessor()
    X_train_2 = prep_2.fit_transform(df_train_2[X_cols])
    X_val_2 = prep_2.transform(df_val_2[X_cols])
    
    model_2 = LogisticRegression(random_state=42, max_iter=1000)
    model_2.fit(X_train_2, df_train_2['target'].values)
    auc_2 = roc_auc_score(df_val_2['target'].values, model_2.predict_proba(X_val_2)[:, 1])
    
    print(f"RUN 1 AUC: {auc_1:.6f}")
    print(f"RUN 2 AUC: {auc_2:.6f}")
    
    if np.isclose(auc_1, auc_2):
        print("Reproducibility Verified: PASS")
    else:
        print("Reproducibility Failed: FAIL")

if __name__ == "__main__":
    test_reproducibility()
