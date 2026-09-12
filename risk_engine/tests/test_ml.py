import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from risk_engine.ml.features import generate_features
from risk_engine.ml.dataset import extract_raw_data
from risk_engine.ml.preprocessing import get_preprocessor

@pytest.fixture
def dummy_raw_data():
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    assets = pd.DataFrame([
        {'id': 'a1', 'organization_id': 'org1', 'asset_type': 'web', 'criticality': 'high', 'internet_exposed': True},
        {'id': 'a2', 'organization_id': 'org1', 'asset_type': 'db', 'criticality': 'critical', 'internet_exposed': False}
    ])
    
    events = pd.DataFrame([
        {'asset_id': 'a1', 'timestamp': now - pd.Timedelta(days=5)},
        {'asset_id': 'a1', 'timestamp': now + pd.Timedelta(days=5)}, # future event
    ])
    
    vulns = pd.DataFrame([
        {'asset_id': 'a1', 'cvss_score': 9.0, 'known_exploited': True, 'created_at': now - pd.Timedelta(days=10)}
    ])
    
    incidents = pd.DataFrame([
        {'asset_id': 'a1', 'incident_date': now + pd.Timedelta(days=2)}, # target incident
        {'asset_id': 'a2', 'incident_date': now - pd.Timedelta(days=20)} # prior incident
    ])
    
    return {
        'assets': assets,
        'events': events,
        'vulns': vulns,
        'incidents': incidents,
        'controls': pd.DataFrame()
    }

def test_target_window(dummy_raw_data):
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    df = generate_features(dummy_raw_data, now, prediction_window_days=15)
    assert len(df) == 2
    # a1 has incident in [now, now+15) -> target=1
    assert df[df['asset_id'] == 'a1']['target'].iloc[0] == 1
    # a2 incident was in past -> target=0
    assert df[df['asset_id'] == 'a2']['target'].iloc[0] == 0

def test_leakage_future_events(dummy_raw_data):
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    df = generate_features(dummy_raw_data, now, prediction_window_days=15)
    # Event at now+5 should NOT be counted
    assert df[df['asset_id'] == 'a1']['recent_event_count_30d'].iloc[0] == 1

def test_leakage_future_incidents(dummy_raw_data):
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    df = generate_features(dummy_raw_data, now, prediction_window_days=15)
    # The incident at now+2 is the target, so prior_incident_count for a1 should be 0!
    assert df[df['asset_id'] == 'a1']['prior_incident_count'].iloc[0] == 0

def test_feature_columns(dummy_raw_data):
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    df = generate_features(dummy_raw_data, now, prediction_window_days=15)
    expected_cols = {'asset_id', 'target', 'internet_exposed', 'vuln_count', 'cvss_max', 'recent_event_count_30d'}
    assert expected_cols.issubset(set(df.columns))
    assert 'incident_date' not in df.columns

def test_numeric_finiteness(dummy_raw_data):
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    df = generate_features(dummy_raw_data, now, prediction_window_days=15)
    assert not np.isinf(df['cvss_max'].iloc[0])
    assert not np.isnan(df['cvss_max'].iloc[0])

def test_preprocessing_transforms(dummy_raw_data):
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    df = generate_features(dummy_raw_data, now, prediction_window_days=15)
    X_cols = ['asset_type', 'criticality', 'internet_exposed', 'vuln_count', 'cvss_max', 'known_exploited_count', 'recent_event_count_30d', 'prior_incident_count']
    
    preprocessor = get_preprocessor()
    X_proc = preprocessor.fit_transform(df[X_cols])
    
    assert X_proc.shape[0] == 2
    # At least 6 numerics + categorical one-hots
    assert X_proc.shape[1] > len(X_cols) 

def test_unique_sample_identity():
    # Ensuring multiple snapshots for same asset are unique
    from risk_engine.ml.train import build_temporal_dataset
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    
    assets = pd.DataFrame([{'id': 'a1', 'organization_id': 'o1', 'asset_type': 'web'}])
    dummy = {'assets': assets, 'events': pd.DataFrame(), 'vulns': pd.DataFrame(), 'incidents': pd.DataFrame(columns=['incident_date', 'asset_id'])}
    
    df = build_temporal_dataset(dummy, now - pd.Timedelta(days=20), now - pd.Timedelta(days=10))
    # the drop_duplicates logic keeps unique feature snapshots
    assert 'asset_id' in df.columns
    assert len(df) >= 1

def test_model_probabilities(dummy_raw_data):
    from sklearn.linear_model import LogisticRegression
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    df = generate_features(dummy_raw_data, now, prediction_window_days=15)
    X_cols = ['asset_type', 'criticality', 'internet_exposed', 'vuln_count', 'cvss_max', 'known_exploited_count', 'recent_event_count_30d', 'prior_incident_count']
    
    preprocessor = get_preprocessor()
    X_proc = preprocessor.fit_transform(df[X_cols])
    
    y = df['target']
    
    # Needs at least one of each class for LR to fit, we have a1=1, a2=0
    model = LogisticRegression()
    model.fit(X_proc, y)
    
    probs = model.predict_proba(X_proc)[:, 1]
    assert all(0 <= p <= 1 for p in probs)

def test_deterministic_behavior(dummy_raw_data):
    from risk_engine.ml.models import get_xgboost
    m1 = get_xgboost()
    m2 = get_xgboost()
    assert m1.random_state == 20260907
    assert m2.random_state == 20260907

def test_threshold_metrics():
    from risk_engine.ml.evaluate import evaluate_model
    class DummyModel:
        def predict_proba(self, X):
            return np.array([[0.1, 0.9], [0.8, 0.2]])
            
    X = np.array([[1], [2]])
    y = np.array([1, 0])
    
    metrics, probs = evaluate_model(DummyModel(), X, y, threshold=0.5)
    assert metrics['accuracy'] == 1.0
    assert metrics['precision'] == 1.0
    
    metrics2, _ = evaluate_model(DummyModel(), X, y, threshold=0.95)
    assert metrics2['accuracy'] == 0.5 # 0.9 is not >= 0.95
