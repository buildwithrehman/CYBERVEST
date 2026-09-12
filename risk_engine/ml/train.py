import pandas as pd
import numpy as np
from .dataset import extract_raw_data
from .features import generate_features
from .preprocessing import get_preprocessor, save_preprocessor
from .models import get_baseline_dummy, get_logistic_regression, get_xgboost
from .evaluate import evaluate_model
import joblib
from datetime import datetime, timedelta

def build_temporal_dataset(raw_data, start_date, end_date, n_snapshots_per_asset=1):
    '''
    Builds a point-in-time dataset by sampling cutoff dates uniformly between start_date and end_date.
    Each asset gets n_snapshots_per_asset cutoff dates in the window.
    '''
    np.random.seed(20260907)
    assets_df = raw_data['assets']
    
    all_features = []
    
    # Calculate days in window
    days_range = (end_date - start_date).days
    
    # To optimize, we group by cutoff date (e.g. week starts)
    # We will pick 4 random snapshot dates in the window and run generate_features for all assets
    num_cutoffs = 4
    cutoffs = [start_date + timedelta(days=int(np.random.uniform(0, days_range))) for _ in range(num_cutoffs)]
    
    df_list = []
    for cutoff in cutoffs:
        df = generate_features(raw_data, cutoff, prediction_window_days=15)
        df_list.append(df)
        
    final_df = pd.concat(df_list, ignore_index=True)
    return final_df.drop_duplicates(subset=['asset_id', 'target', 'recent_event_count_30d', 'vuln_count'])

def run_training_pipeline():
    raw_data = extract_raw_data()
    
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    
    # Train: 90 days ago to 45 days ago
    train_start = now - pd.Timedelta(days=90)
    train_end = now - pd.Timedelta(days=45)
    
    # Val: 45 days ago to 30 days ago
    val_start = now - pd.Timedelta(days=45)
    val_end = now - pd.Timedelta(days=30)
    
    # Test: 30 days ago to 15 days ago
    test_start = now - pd.Timedelta(days=30)
    test_end = now - pd.Timedelta(days=15)
    
    print(f"Generating Temporal Train set ({train_start.date()} to {train_end.date()})")
    df_train = build_temporal_dataset(raw_data, train_start, train_end)
    
    print(f"Generating Temporal Validation set ({val_start.date()} to {val_end.date()})")
    df_val = build_temporal_dataset(raw_data, val_start, val_end)
    
    print(f"Generating Temporal Test set ({test_start.date()} to {test_end.date()})")
    df_test = build_temporal_dataset(raw_data, test_start, test_end)
    
    # Class distribution
    print(f"Train size: {len(df_train)}, Positives: {df_train['target'].sum()} ({df_train['target'].mean():.2%})")
    print(f"Val size: {len(df_val)}, Positives: {df_val['target'].sum()} ({df_val['target'].mean():.2%})")
    print(f"Test size: {len(df_test)}, Positives: {df_test['target'].sum()} ({df_test['target'].mean():.2%})")
    
    X_cols = ['asset_type', 'criticality', 'internet_exposed', 'vuln_count', 'cvss_max', 'known_exploited_count', 'recent_event_count_30d', 'prior_incident_count']
    
    X_train, y_train = df_train[X_cols], df_train['target']
    X_val, y_val = df_val[X_cols], df_val['target']
    X_test, y_test = df_test[X_cols], df_test['target']
    
    preprocessor = get_preprocessor()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_val_proc = preprocessor.transform(X_val)
    X_test_proc = preprocessor.transform(X_test)
    
    scale_pos = (len(y_train) - sum(y_train)) / max(1, sum(y_train))
    
    # Model Naming Correction: XGBoost -> HistGradientBoosting
    models = {
        'Dummy': get_baseline_dummy(),
        'LogisticRegression': get_logistic_regression(),
        'HistGradientBoosting': get_xgboost(scale_pos_weight=scale_pos)
    }
    
    results = {}
    
    # Determine best threshold on Validation Set using HistGradientBoosting
    print("\\n--- Threshold Selection (Validation Set) ---")
    val_model = models['HistGradientBoosting']
    val_model.fit(X_train_proc, y_train)
    val_probs = val_model.predict_proba(X_val_proc)[:, 1]
    
    # Simple threshold sweep for highest F1
    best_thresh = 0.5
    best_f1 = 0
    for t in np.arange(0.1, 0.9, 0.05):
        from sklearn.metrics import f1_score
        y_val_pred = (val_probs >= t).astype(int)
        f1 = f1_score(y_val, y_val_pred, zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = t
            
    print(f"Selected Threshold: {best_thresh:.2f} (Val F1: {best_f1:.3f})")
    
    for name, model in models.items():
        if name != 'HistGradientBoosting':
            model.fit(X_train_proc, y_train)
        metrics, _ = evaluate_model(model, X_test, y_test, preprocessor, threshold=best_thresh)
        results[name] = metrics
        
    print("\\n--- Model Comparison (Test Set) ---")
    metrics_df = pd.DataFrame(results).T
    print(metrics_df[['roc_auc', 'pr_auc', 'f1', 'precision', 'recall', 'brier_score']])
    
    main_model = models['HistGradientBoosting']
    final_model = main_model
    
    print("\\n--- Feature Importance (Permutation) ---")
    from sklearn.inspection import permutation_importance
    r = permutation_importance(final_model, X_test_proc, y_test, n_repeats=5, random_state=42)
    feature_names = preprocessor.get_feature_names_out()
    importances = pd.DataFrame({'feature': feature_names, 'importance': r.importances_mean}).sort_values('importance', ascending=False)
    print(importances.head(10))
    
    # Save artifacts with corrected names
    joblib.dump(final_model, 'models/incident_likelihood/incident_likelihood_hgb_v1.joblib')
    joblib.dump(preprocessor, 'models/incident_likelihood/preprocessor_hgb_v1.joblib')
    print("Model saved.")
    
    return final_model, preprocessor, df_test

if __name__ == '__main__':
    run_training_pipeline()
