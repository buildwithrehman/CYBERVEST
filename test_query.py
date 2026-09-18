import os
from supabase import create_client

client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
res = client.table("fair_results").select("*, fair_scenarios!inner(id, name, organization_id)").eq("fair_scenarios.organization_id", "00000000-0000-0000-0000-000000000000").order("created_at", desc=True).limit(1).execute()
print(res.data)
