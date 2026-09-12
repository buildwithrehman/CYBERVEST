import os
import pandas as pd
from datetime import datetime, timedelta
from supabase import create_client, Client

def get_supabase_client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    return create_client(url, key)

def extract_raw_data():
    client = get_supabase_client()
    
    # We fetch a subset of data to avoid blowing up memory with 60k events via REST 
    # For prototype, we'll pull all or bounded.
    assets = client.table('assets').select('*').execute().data
    events = client.table('security_events').select('*').limit(20000).execute().data
    vulns = client.table('vulnerabilities').select('*').execute().data
    if os.path.exists('synthetic_incidents.csv'):
        incidents = pd.read_csv('synthetic_incidents.csv').to_dict('records')
    else:
        incidents = client.table('incidents').select('*').execute().data
        
    controls = client.table('controls').select('*').execute().data
    
    return {
        'assets': pd.DataFrame(assets),
        'events': pd.DataFrame(events),
        'vulns': pd.DataFrame(vulns),
        'incidents': pd.DataFrame(incidents),
        'controls': pd.DataFrame(controls)
    }
