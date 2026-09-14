from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import uuid

from ...auth.dependencies import require_read_access, require_write_access
from ...auth.models import AuthenticatedUser
from ...services.audit import log_audit_event

router = APIRouter()

class AssetBase(BaseModel):
    name: str
    asset_type: Optional[str] = None
    environment: Optional[str] = None
    criticality: Optional[str] = None
    internet_exposed: bool = False
    data_sensitivity: Optional[str] = None
    owner: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    business_service_id: Optional[str] = None

class AssetResponse(AssetBase):
    id: str
    organization_id: str
    created_at: str
    updated_at: str

def _get_db():
    import os
    from supabase import create_client
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

@router.get("/", response_model=List[AssetResponse])
async def list_assets(user: AuthenticatedUser = Depends(require_read_access())):
    client = _get_db()
    # Ensure isolation by organization_id
    res = client.table("assets").select("*").eq("organization_id", user.organization_id).execute()
    return res.data

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, user: AuthenticatedUser = Depends(require_read_access())):
    try:
        uuid.UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")

    client = _get_db()
    # Ensure isolation by organization_id
    res = client.table("assets").select("*").eq("id", asset_id).eq("organization_id", user.organization_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return res.data[0]


@router.get("/{asset_id}/telemetry")
async def get_asset_telemetry(asset_id: str, user: AuthenticatedUser = Depends(require_read_access())):
    try:
        import uuid
        uuid.UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")

    client = _get_db()
    # Verify isolation
    res = client.table("assets").select("id").eq("id", asset_id).eq("organization_id", user.organization_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Asset not found")

    vulns = client.table("vulnerabilities").select("*").eq("asset_id", asset_id).order("cvss_score", desc=True).execute()
    events = client.table("security_events").select("*").eq("asset_id", asset_id).order("timestamp", desc=True).execute()
    incidents = client.table("incidents").select("*").eq("asset_id", asset_id).order("detected_at", desc=True).execute()

    return {
        "vulnerabilities": vulns.data,
        "security_events": events.data,
        "incidents": incidents.data
    }

@router.post("/")

async def create_asset(payload: dict, user: AuthenticatedUser = Depends(require_write_access())):
    return {"status": "created"}


@router.get("/{asset_id}/fair-telemetry")
async def get_fair_telemetry(asset_id: str, user: AuthenticatedUser = Depends(require_read_access())):
    from .ml import run_ml_predict, MLPredictRequest
    from datetime import datetime, timedelta
    import uuid
    import math

    try:
        uuid.UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")

    client = _get_db()
    # 1. Fetch Asset to check existence, tenant isolation, and creation date
    asset_res = client.table("assets").select("*").eq("id", asset_id).eq("organization_id", user.organization_id).execute()
    if not asset_res.data:
        raise HTTPException(status_code=404, detail="Asset not found or access denied.")
    asset = asset_res.data[0]

    # Calculate observation window
    created_at = asset.get("created_at")
    if not created_at:
        return {"status": "INSUFFICIENT_EVIDENCE", "warnings": ["Asset creation date unknown."]}
    
    # Parse created_at safely
    try:
        if created_at.endswith('Z'):
            created_at = created_at[:-1] + '+00:00'
        created_dt = datetime.fromisoformat(created_at).replace(tzinfo=None)
    except Exception:
        return {"status": "INSUFFICIENT_EVIDENCE", "warnings": ["Invalid asset creation date."]}

    now = datetime.utcnow()
    days_observed = (now - created_dt).days
    
    if days_observed < 30:
        return {
            "status": "INSUFFICIENT_EVIDENCE",
            "warnings": ["Insufficient evidence — asset observation window too short."]
        }

    # 2. Query qualifying security events
    qualifying_types = ["malware_detected", "data_exfiltration_attempt", "unauthorized_access_attempt", "failed_login", "authentication_failure"]
    events_res = client.table("security_events").select("id, event_type, timestamp").eq("asset_id", asset_id).in_("event_type", qualifying_types).order("timestamp").execute()
    events = events_res.data
    
    qualifying_event_count = len(events)
    if qualifying_event_count == 0:
        return {
            "status": "INSUFFICIENT_EVIDENCE",
            "warnings": ["Insufficient evidence — 0 observed threat events."]
        }

    # 3. Cluster events (1-hour window)
    clustered_count = 0
    # Group by event_type
    events_by_type = {}
    for ev in events:
        etype = ev.get("event_type")
        if etype not in events_by_type:
            events_by_type[etype] = []
        events_by_type[etype].append(ev)
    
    for etype, ev_list in events_by_type.items():
        if not ev_list:
            continue
        # sort by time just in case
        ev_list_sorted = []
        for e in ev_list:
            t_str = e.get("timestamp")
            if t_str:
                if t_str.endswith('Z'): t_str = t_str[:-1] + '+00:00'
                ev_list_sorted.append(datetime.fromisoformat(t_str).replace(tzinfo=None))
        ev_list_sorted.sort()
        
        if not ev_list_sorted:
            continue
            
        current_cluster_start = ev_list_sorted[0]
        clusters = 1
        for i in range(1, len(ev_list_sorted)):
            if (ev_list_sorted[i] - current_cluster_start).total_seconds() > 3600:
                clusters += 1
                current_cluster_start = ev_list_sorted[i]
        clustered_count += clusters

    if clustered_count == 0:
        return {
            "status": "INSUFFICIENT_EVIDENCE",
            "warnings": ["Insufficient evidence — 0 observed threat events."]
        }

    # 4. Calculate TEF
    L = clustered_count * (365.0 / days_observed)
    tef_likely = L
    tef_min = 0.5 * L
    tef_max = 1.5 * L

    # 5. ML P15 Prediction
    try:
        req = MLPredictRequest(asset_id=asset_id)
        ml_res = await run_ml_predict(req, user)
        p15 = ml_res["prediction"]["probability"]
        model_version = ml_res["model"]["version"]
    except Exception as e:
        return {
            "status": "INSUFFICIENT_EVIDENCE",
            "warnings": ["Insufficient evidence — model unavailable."]
        }
        
    # Numerical Protection
    if p15 >= 1.0:
        p15 = 0.9999
        numerical_protection = True
    else:
        numerical_protection = False
        
    # 6. Calculate LEF
    # LEF_annual = -ln(1 - P15) * (365 / 15)
    lef_annual = -math.log(1.0 - p15) * (365.0 / 15.0)
    
    # 7. Calculate Susceptibility
    if tef_likely == 0:
        return {
            "status": "INSUFFICIENT_EVIDENCE",
            "warnings": ["Insufficient evidence — observed threat event frequency is mathematically incompatible with model LEF."]
        }
        
    susceptibility = lef_annual / tef_likely
    if susceptibility > 1.0:
        return {
            "status": "INSUFFICIENT_EVIDENCE",
            "warnings": ["Insufficient evidence — observed threat event frequency is mathematically incompatible with model LEF."]
        }

    calc_timestamp = datetime.utcnow().isoformat()
    
    tef_assumptions = ["ASSUMPTION_BASED_PERT: min=0.5x, max=1.5x", "ASSUMPTION: 1-hour event clustering window"]
    
    susceptibility_assumptions = ["homogeneous Poisson process", "stationarity", "independence"]
    if numerical_protection:
        susceptibility_assumptions.append("NUMERICAL_PROTECTION_APPLIED")

    return {
        "asset_id": asset_id,
        "status": "READY",
        "tef": {
            "min_val": round(tef_min, 2),
            "likely_val": round(tef_likely, 2),
            "max_val": round(tef_max, 2),
            "source_type": "DERIVED_METRIC",
            "provenance": {
                "parameter": "tef",
                "value": {"min_val": round(tef_min, 2), "likely_val": round(tef_likely, 2), "max_val": round(tef_max, 2)},
                "source_type": "DERIVED_METRIC",
                "source_records": "security_events",
                "observation_window": days_observed,
                "transformation": "annualized_1hr_clustered_rate",
                "assumptions": tef_assumptions,
                "confidence": "Medium",
                "model_version": None,
                "calculation_timestamp": calc_timestamp
            }
        },
        "susceptibility": {
            "min_val": round(susceptibility, 4),
            "likely_val": round(susceptibility, 4),
            "max_val": round(susceptibility, 4),
            "source_type": "MODEL_ESTIMATE",
            "provenance": {
                "parameter": "susceptibility",
                "value": {"min_val": round(susceptibility, 4), "likely_val": round(susceptibility, 4), "max_val": round(susceptibility, 4)},
                "source_type": "MODEL_ESTIMATE",
                "source_records": "ML P15 Prediction",
                "observation_window": 15,
                "transformation": "LEF_annual = -ln(1 - P15) * (365 / 15); Susceptibility = LEF_annual / TEF_likely",
                "assumptions": susceptibility_assumptions,
                "confidence": "Medium",
                "model_version": model_version,
                "calculation_timestamp": calc_timestamp
            }
        },
        "evidence": {
            "qualifying_event_count": qualifying_event_count,
            "clustered_event_count": clustered_count,
            "observation_days": days_observed,
            "ml_probability_15d": p15,
            "model_version": model_version,
            "model_estimated_lef": round(lef_annual, 2)
        },
        "financial_loss": {
            "source_type": "EXPERT_ASSUMPTION",
            "requires_user_input": True
        },
        "warnings": []
    }
