import os
from supabase import create_client, Client
from ..fair.models import FAIRScenarioInput
from ..fair.calculator import calculate_fair

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_KEY"]
supabase: Client = create_client(url, key) if key else None

def process_and_save_scenario(scenario_input: FAIRScenarioInput):
    # 1. Calculate FAIR result
    result = calculate_fair(scenario_input)
    
    # 2. Persist to Supabase if configured
    if supabase:
        data = {
            "scenario_id": result.scenario_id,
            "tef": result.tef_mean,
            "susceptibility": result.susceptibility_mean,
            "lef": result.lef_mean,
            "primary_loss": result.primary_loss_mean,
            "secondary_loss": result.secondary_loss_mean,
            "total_loss": result.total_loss_mean,
            "p10": result.p10,
            "p50": result.p50,
            "p90": result.p90,
            "eal": result.eal,
            "simulation_count": result.simulation_count,
            "calculation_version": result.model_version,
            "assumptions": result.assumptions,
            "confidence": result.confidence,
            "risk_drivers": [d.model_dump() for d in result.risk_drivers]
        }
        res = supabase.table("fair_results").insert(data).execute()
        return res.data, result
    return None, result
