import joblib
import pandas as pd
from risk_engine.ml.preprocessing import get_preprocessor

def test_inference():
    model = joblib.load('models/incident_likelihood/incident_likelihood_v1.joblib')
    preprocessor = joblib.load('models/incident_likelihood/preprocessor_v1.joblib')
    
    # 10. INFERENCE TEST
    # Test low, medium, high risk assets + missing/invalid input
    
    X_cols = ['asset_type', 'criticality', 'internet_exposed', 'vuln_count', 'cvss_max', 'known_exploited_count', 'recent_event_count_30d', 'prior_incident_count']
    
    test_data = pd.DataFrame([
        # Low risk: Internal DB, no vulns
        {"asset_type": "database", "criticality": "medium", "internet_exposed": 0, "vuln_count": 0, "cvss_max": 0.0, "known_exploited_count": 0, "recent_event_count_30d": 0, "prior_incident_count": 0},
        
        # High risk: Critical Internet-exposed API
        {"asset_type": "api", "criticality": "critical", "internet_exposed": 1, "vuln_count": 5, "cvss_max": 9.8, "known_exploited_count": 2, "recent_event_count_30d": 150, "prior_incident_count": 1},
        
        # Medium risk: Windows Server with some vulns
        {"asset_type": "Windows server", "criticality": "high", "internet_exposed": 0, "vuln_count": 2, "cvss_max": 7.5, "known_exploited_count": 0, "recent_event_count_30d": 50, "prior_incident_count": 0},
        
        # Missing/invalid input (unseen asset type, missing values)
        {"asset_type": "quantum_computer", "criticality": "unknown", "internet_exposed": 0, "vuln_count": None, "cvss_max": None, "known_exploited_count": None, "recent_event_count_30d": None, "prior_incident_count": None}
    ], columns=X_cols)
    
    X_processed = preprocessor.transform(test_data)
    probs = model.predict_proba(X_processed)[:, 1]
    
    print("Inference Test Results:")
    for i, p in enumerate(probs):
        print(f"Sample {i+1} Probability: {p:.4f} (Valid: {0 <= p <= 1})")

if __name__ == "__main__":
    test_inference()
