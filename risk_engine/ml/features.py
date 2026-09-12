import pandas as pd
import numpy as np
from datetime import datetime

def generate_features(raw_data, cutoff_date, prediction_window_days=15):
    '''
    Explicit Leakage Prevention:
    - Filters all events, vulnerabilities (published), and prior incidents to ONLY include those BEFORE the cutoff_date.
    - Determines the Target by looking for incidents strictly BETWEEN cutoff_date and (cutoff_date + prediction_window_days).
    '''
    cutoff = pd.to_datetime(cutoff_date, utc=True)
    window_end = cutoff + pd.Timedelta(days=prediction_window_days)
    
    assets_df = raw_data['assets'].copy()
    events_df = raw_data['events'].copy()
    vulns_df = raw_data['vulns'].copy()
    incidents_df = raw_data['incidents'].copy()
    
    if not events_df.empty:
        events_df['timestamp'] = pd.to_datetime(events_df['timestamp'], utc=True)
    if not vulns_df.empty:
        vulns_df['created_at'] = pd.to_datetime(vulns_df['created_at'], utc=True)
    if not incidents_df.empty:
        incidents_df['incident_date'] = pd.to_datetime(incidents_df['incident_date'], utc=True)
    
    # Target definition: Asset had an incident in [cutoff, window_end]
    target_incidents = incidents_df[(incidents_df['incident_date'] >= cutoff) & (incidents_df['incident_date'] < window_end)]
    target_asset_ids = set(target_incidents['asset_id'].dropna().unique())
    
    # Feature construction (Strictly < cutoff)
    hist_events = events_df[events_df['timestamp'] < cutoff] if not events_df.empty else pd.DataFrame()
    hist_vulns = vulns_df[vulns_df['created_at'] < cutoff] if not vulns_df.empty else pd.DataFrame()
    hist_incidents = incidents_df[incidents_df['incident_date'] < cutoff] if not incidents_df.empty else pd.DataFrame()
    
    features = []
    
    for _, asset in assets_df.iterrows():
        asset_id = asset['id']
        
        # Target
        target = 1 if asset_id in target_asset_ids else 0
        
        # Asset Features
        asset_type = asset.get('asset_type', 'unknown')
        criticality = asset.get('criticality', 'unknown')
        internet_exposed = int(asset.get('internet_exposed', False))
        
        # Vuln Features
        asset_vulns = hist_vulns[hist_vulns['asset_id'] == asset_id] if not hist_vulns.empty else pd.DataFrame()
        vuln_count = len(asset_vulns)
        cvss_max = float(asset_vulns['cvss_score'].max()) if vuln_count > 0 and not pd.isna(asset_vulns['cvss_score'].max()) else 0.0
        known_exploited = int(asset_vulns['known_exploited'].sum()) if vuln_count > 0 else 0
        
        # Event Features
        asset_events = hist_events[hist_events['asset_id'] == asset_id] if not hist_events.empty else pd.DataFrame()
        recent_events = len(asset_events[asset_events['timestamp'] >= (cutoff - pd.Timedelta(days=30))]) if not asset_events.empty else 0
        
        # Historical Incidents
        prior_incidents = len(hist_incidents[hist_incidents['asset_id'] == asset_id]) if not hist_incidents.empty else 0
        
        features.append({
            'asset_id': asset_id,
            'organization_id': asset['organization_id'],
            'asset_type': asset_type,
            'criticality': criticality,
            'internet_exposed': internet_exposed,
            'vuln_count': vuln_count,
            'cvss_max': cvss_max,
            'known_exploited_count': known_exploited,
            'recent_event_count_30d': recent_events,
            'prior_incident_count': prior_incidents,
            'target': target
        })
        
    return pd.DataFrame(features)
