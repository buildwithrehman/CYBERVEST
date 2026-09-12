import pandas as pd
import joblib
import json
from datetime import datetime
from supabase import create_client, Client
import os

def generate_predictions_and_save(model_path, preprocessor_path, raw_data, cutoff_date):
    model = joblib.load(model_path)
    preprocessor = joblib.load(preprocessor_path)
    
    from .features import generate_features
    # We generate features for the CURRENT date to predict the NEXT 15 days
    df = generate_features(raw_data, cutoff_date, prediction_window_days=15)
    
    X_cols = ['asset_type', 'criticality', 'internet_exposed', 'vuln_count', 'cvss_max', 'known_exploited_count', 'recent_event_count_30d', 'prior_incident_count']
    X = df[X_cols]
    
    X_proc = preprocessor.transform(X)
    probs = model.predict_proba(X_proc)[:, 1]
    
    predictions = []
    timestamp = datetime.utcnow().isoformat()
    
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    client = create_client(url, key)
    
    for idx, row in df.iterrows():
        prob = float(probs[idx])
        pred_label = 'high_risk' if prob > 0.5 else 'low_risk'
        
        feature_snapshot = {c: row[c] for c in X_cols}
        
        predictions.append({
            'organization_id': row['organization_id'],
            'asset_id': row['asset_id'],
            'prediction_type': 'incident_likelihood_15d',
            'prediction_probability': prob,
            'prediction_label': pred_label,
            'model_name': 'incident_likelihood_hgb',
            'model_version': 'ML-v1.0',
            'features': feature_snapshot,
            'prediction_timestamp': timestamp
        })
        
    # Batch insert
    print(f"Inserting {len(predictions)} predictions into ml_predictions...")
    batch_size = 500
    for i in range(0, len(predictions), batch_size):
        client.table('ml_predictions').insert(predictions[i:i+batch_size]).execute()
        
    print("Done persisting predictions.")
    return predictions
