import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from supabase import create_client

def get_supabase_client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    return create_client(url, key)

def generate_plausible_incidents():
    client = get_supabase_client()
    
    print("Fetching existing data...")
    assets_resp = client.table('assets').select('*').execute()
    assets = pd.DataFrame(assets_resp.data)
    
    vulns_resp = client.table('vulnerabilities').select('*').execute()
    vulns = pd.DataFrame(vulns_resp.data)
    if not vulns.empty:
        vulns['created_at'] = pd.to_datetime(vulns['created_at'], utc=True)
        
    events_resp = client.table('security_events').select('asset_id,timestamp,severity').execute()
    events = pd.DataFrame(events_resp.data)
    if not events.empty:
        events['timestamp'] = pd.to_datetime(events['timestamp'], utc=True)
    
    print("Deleting old incidents...")
    # Delete all incidents
    client.table('incidents').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    
    # We will simulate incidents over the last 90 days
    now = pd.to_datetime(datetime.utcnow(), utc=True)
    start_date = now - timedelta(days=90)
    
    np.random.seed(20260907)
    
    new_incidents = []
    
    print("Simulating probabilistic incidents over 90 days...")
    # We step through time weekly
    current_date = start_date
    while current_date < now:
        window_end = current_date + timedelta(days=7)
        
        # Calculate latent risk for each asset at current_date
        for _, asset in assets.iterrows():
            asset_id = asset['id']
            org_id = asset['organization_id']
            
            latent_risk = -3.0 # Base log-odds (low probability)
            
            # Asset factors
            if asset.get('internet_exposed', False):
                latent_risk += 1.5
            if asset.get('criticality') == 'critical':
                latent_risk += 1.0
                
            # Vuln factors
            if not vulns.empty:
                asset_vulns = vulns[(vulns['asset_id'] == asset_id) & (vulns['created_at'] <= current_date)]
                if len(asset_vulns) > 0:
                    latent_risk += 0.2 * len(asset_vulns)
                    cvss_max = asset_vulns['cvss_score'].max()
                    if cvss_max > 8.0:
                        latent_risk += 1.5
                    if asset_vulns['known_exploited'].sum() > 0:
                        latent_risk += 2.0
                        
            # Event factors
            if not events.empty:
                asset_events = events[(events['asset_id'] == asset_id) & (events['timestamp'] >= (current_date - timedelta(days=14))) & (events['timestamp'] < current_date)]
                if len(asset_events) > 10:
                    latent_risk += 0.5
                if len(asset_events[asset_events['severity'] == 'critical']) > 0:
                    latent_risk += 1.0
                    
            # Add stochastic noise
            noise = np.random.normal(0, 0.5)
            latent_risk += noise
            
            # Sigmoid probability
            prob = 1 / (1 + np.exp(-latent_risk))
            
            if np.random.random() < prob:
                incident_date = current_date + timedelta(days=np.random.randint(0, 7))
                new_incidents.append({
                    'organization_id': org_id,
                    'asset_id': asset_id,
                    'incident_date': incident_date.isoformat(),
                    'detected_at': incident_date.isoformat(),
                    'resolved_at': (incident_date + timedelta(days=2)).isoformat(),
                    'incident_type': 'malware' if np.random.random() > 0.5 else 'data_breach',
                    'severity': 'high' if prob > 0.8 else 'medium',
                    'total_loss': round(np.random.uniform(50000, 500000), 2),
                    'is_synthetic': True
                })
                
        current_date = window_end

    print(f"Generated {len(new_incidents)} plausible incidents.")
    
    # Save to local CSV as fallback
    pd.DataFrame(new_incidents).to_csv('synthetic_incidents.csv', index=False)
    print("Saved fallback to synthetic_incidents.csv")
    
    # Insert in batches
    batch_size = 50
    inserted = 0
    for i in range(0, len(new_incidents), batch_size):
        batch = new_incidents[i:i+batch_size]
        try:
            client.table('incidents').insert(batch).execute()
            inserted += len(batch)
        except Exception as e:
            print(f"Batch insert error: {e}")
            
    print(f"Successfully inserted {inserted} incidents.")

if __name__ == '__main__':
    generate_plausible_incidents()
