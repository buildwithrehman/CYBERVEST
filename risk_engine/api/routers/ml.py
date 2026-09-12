from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import joblib
import pandas as pd
from pathlib import Path
import json

from ...auth.dependencies import require_read_access, require_write_access
from ...auth.models import AuthenticatedUser
from ...services.audit import log_audit_event

router = APIRouter()

class MLFeaturePayload(BaseModel):
    asset_type: str
    criticality: str
    internet_exposed: bool
    vuln_count: int
    cvss_max: float
    known_exploited_count: int
    recent_event_count_30d: int
    prior_incident_count: int

class MLPredictRequest(BaseModel):
    organization_id: str
    features: MLFeaturePayload

MODEL_DIR = Path("models/incident_likelihood")
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
    org_id = payload.organization_id
    if org_id and str(org_id) != user.organization_id and str(org_id) != "00000000-0000-0000-0000-000000000000":
        raise HTTPException(status_code=403, detail="Cross-tenant access forbidden.")
        
    try:
        load_ml_artifacts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load certified model artifact: {str(e)}")
        
    df = pd.DataFrame([payload.features.model_dump()])
    
    try:
        X_proc = _preprocessor.transform(df)
        probs = _model.predict_proba(X_proc)
        prob = float(probs[0, 1])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference failed during feature transformation: {str(e)}")
        
    threshold = float(_metadata.get("threshold", 0.5))
    classification = "Elevated Signal" if prob >= threshold else "Baseline Signal"
        
    log_audit_event(
        organization_id=user.organization_id,
        user_id=user.user_id,
        action="RUN_ML_PREDICTION",
        resource_type="ML_ENGINE",
        resource_id=user.organization_id
    )
    
    return {
        "status": "success", 
        "prediction": prob,
        "classification": classification,
        "model_version": _metadata.get("model_version"),
        "model_name": "incident_likelihood_v1",
        "prediction_timestamp": datetime.utcnow().isoformat()
    }
