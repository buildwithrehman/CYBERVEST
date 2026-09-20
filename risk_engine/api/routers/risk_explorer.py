from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from ...auth.dependencies import require_read_access, get_supabase_client
from ...auth.models import AuthenticatedUser

router = APIRouter()

class RiskAsset(BaseModel):
    id: str
    name: str
    asset_type: Optional[str]
    criticality: Optional[str]
    internet_exposed: bool
    business_service_id: Optional[str]
    environment: Optional[str]
    vuln_critical_count: int = 0
    vuln_high_count: int = 0
    epss_max: Optional[float] = None
    event_count_30d: int = 0
    incident_count: int = 0

@router.get("/", response_model=List[RiskAsset])
async def get_risk_explorer_data(user: AuthenticatedUser = Depends(require_read_access())):
    client = get_supabase_client(user.token)
    
    # 1. Fetch assets
    assets_res = client.table("assets").select("id, name, asset_type, criticality, internet_exposed, business_service_id, environment").eq("organization_id", user.organization_id).execute()
    assets = assets_res.data
    
    if not assets:
        return []
        
    asset_ids = [a["id"] for a in assets]
    
    vulns = []
    events = []
    
    # 2 & 3. Fetch vulnerabilities and security events using bounded chunking
    # URL limit is typically 8KB, 100 UUIDs = ~3.7KB
    chunk_size = 100
    for i in range(0, len(asset_ids), chunk_size):
        chunk = asset_ids[i:i + chunk_size]
        
        v_res = client.table("vulnerabilities").select("asset_id, severity, epss_score").in_("asset_id", chunk).execute()
        vulns.extend(v_res.data)
        
        e_res = client.table("security_events").select("asset_id").in_("asset_id", chunk).execute()
        events.extend(e_res.data)
    
    # 4. Fetch incidents using organization-scoped query (Option A)
    # Since incidents has organization_id, we do NOT need .in_("asset_id")
    incidents_res = client.table("incidents").select("asset_id").eq("organization_id", user.organization_id).execute()
    incidents = incidents_res.data
    
    # Aggregate
    vuln_map = {a: {"crit": 0, "high": 0, "epss": 0.0} for a in asset_ids}
    for v in vulns:
        aid = v["asset_id"]
        sev = v.get("severity")
        epss = v.get("epss_score") or 0.0
        if sev and sev.lower() == "critical":
            vuln_map[aid]["crit"] += 1
        elif sev and sev.lower() == "high":
            vuln_map[aid]["high"] += 1
        vuln_map[aid]["epss"] = max(vuln_map[aid]["epss"], epss)
        
    event_map = {a: 0 for a in asset_ids}
    for e in events:
        event_map[e["asset_id"]] += 1
        
    incident_map = {a: 0 for a in asset_ids}
    for i in incidents:
        if i.get("asset_id"):
            incident_map[i["asset_id"]] += 1
            
    results = []
    for a in assets:
        aid = a["id"]
        results.append(RiskAsset(
            id=aid,
            name=a.get("name"),
            asset_type=a.get("asset_type"),
            criticality=a.get("criticality"),
            internet_exposed=a.get("internet_exposed", False),
            business_service_id=a.get("business_service_id"),
            environment=a.get("environment"),
            vuln_critical_count=vuln_map[aid]["crit"],
            vuln_high_count=vuln_map[aid]["high"],
            epss_max=vuln_map[aid]["epss"],
            event_count_30d=event_map[aid],
            incident_count=incident_map[aid]
        ))
        
    return results

