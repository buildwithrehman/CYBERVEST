from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import joblib
import pandas as pd
from pathlib import Path
import json

from ...auth.dependencies import require_read_access, require_write_access
from ...auth.models import AuthenticatedUser
from ...services.audit import log_audit_event
from ...api.routers.assets import _get_db

router = APIRouter()

class MLPredictRequest(BaseModel):
    asset_id: str

MODEL_DIR = Path("risk_engine/ml/models/incident_likelihood")
if not MODEL_DIR.exists():
    MODEL_DIR = Path("models/incident_likelihood") # Fallback

MODEL_PATH = MODEL_DIR / "incident_likelihood_v1.joblib"
PREPROC_PATH = MODEL_DIR / "preprocessor_v1.joblib"
METADATA_PATH = MODEL_DIR / "incident_likelihood_v1.json"

_model = None
_preprocessor = None
_metadata = None

def load_ml_artifacts():
    global _model, _preprocessor, _metadata
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    if _preprocessor is None:
        _preprocessor = joblib.load(PREPROC_PATH)
    if _metadata is None:
        with open(METADATA_PATH, 'r') as f:
            _metadata = json.load(f)

@router.post("/predict")
async def run_ml_predict(
    payload: MLPredictRequest,
    user: AuthenticatedUser = Depends(require_write_access())
):
    try:
        load_ml_artifacts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load certified model artifact: {str(e)}")

    client = _get_db()
    
    # 1. Fetch Asset
    asset_res = client.table("assets").select("*").eq("id", payload.asset_id).eq("organization_id", user.organization_id).execute()
    if not asset_res.data:
        raise HTTPException(status_code=404, detail="Asset not found or access denied.")
    asset = asset_res.data[0]

    # 2. Fetch Vulnerabilities
    vulns_res = client.table("vulnerabilities").select("cvss_score, known_exploited").eq("asset_id", payload.asset_id).execute()
    vulns = vulns_res.data
    
    vuln_count = len(vulns)
    cvss_max = max([float(v.get("cvss_score") or 0.0) for v in vulns], default=0.0)
    known_exploited_count = sum([1 for v in vulns if v.get("known_exploited")])

    # 3. Fetch Events (30d)
    thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
    events_res = client.table("security_events").select("id").eq("asset_id", payload.asset_id).gte("timestamp", thirty_days_ago).execute()
    recent_event_count_30d = len(events_res.data)

    # 4. Fetch Incidents
    incidents_res = client.table("incidents").select("id").eq("asset_id", payload.asset_id).execute()
    prior_incident_count = len(incidents_res.data)

    # 5. Construct Features
    features_dict = {
        "asset_type": asset.get("asset_type") or "unknown",
        "criticality": asset.get("criticality") or "unknown",
        "internet_exposed": bool(asset.get("internet_exposed")),
        "vuln_count": vuln_count,
        "cvss_max": cvss_max,
        "known_exploited_count": known_exploited_count,
        "recent_event_count_30d": recent_event_count_30d,
        "prior_incident_count": prior_incident_count
    }

    df = pd.DataFrame([features_dict])
    
    try:
        X_proc = _preprocessor.transform(df)
        probs = _model.predict_proba(X_proc)
        prob = float(probs[0, 1])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference failed during feature transformation: {str(e)}")
        
    threshold = float(_metadata.get("threshold", 0.5))
    classification = "Elevated Signal" if prob >= threshold else "Baseline Signal"
        
    # ML to FAIR Handoff details (transparent representation, not calculation of final INR)
    p15 = prob
    
    log_audit_event(
        organization_id=user.organization_id,
        user_id=user.user_id,
        action="RUN_ML_PREDICTION",
        resource_type="ML_ENGINE",
        resource_id=payload.asset_id
    )
    
    return {
        "status": "success", 
        "asset_id": payload.asset_id,
        "prediction": {
            "probability": prob,
            "label": classification
        },
        "features": features_dict,
        "model": {
            "name": _metadata.get("model_version", "incident_likelihood_v1"),
            "version": _metadata.get("model_version"),
            "training_metrics": _metadata.get("test_metrics")
        },
        "prediction_timestamp": datetime.utcnow().isoformat()
    }
