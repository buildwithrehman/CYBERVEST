import os
import requests
import json
import time

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def upload_batch(table_name, batch, max_retries=3):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    
    # Strip internal tracking keys
    for r in batch:
        r.pop("posture", None)
        
    for attempt in range(max_retries):
        try:
            resp = requests.post(url, headers=HEADERS, json=batch)
            if resp.status_code in [200, 201]:
                return True
            else:
                print(f"Error {resp.status_code} for {table_name}: {resp.text}")
                if attempt == max_retries - 1:
                    return False
        except Exception as e:
            print(f"Exception: {e}")
            if attempt == max_retries - 1:
                return False
        time.sleep(2)
    return False

def export_to_supabase(data):
    print("Clearing existing synthetic data...")
    # Cannot easily truncate via REST, but we can delete where is_synthetic = true (if we had it on all tables)
    # Since we are using an empty db, we will just insert.
    
    tables_to_upload = [
        ("organizations", data["organizations"], 1000),
        ("business_services", data["services"], 1000),
        ("assets", data["assets"], 1000),
        ("vulnerabilities", data["vulnerabilities"], 1000),
        ("controls", data["controls"], 1000),
        ("security_events", data["events"], 2000),
        ("incidents", data["incidents"], 1000)
    ]
    
    for table, records, batch_size in tables_to_upload:
        print(f"Uploading {len(records)} records to {table}...")
        
        # Serialize datetime
        for r in records:
            for k, v in r.items():
                if hasattr(v, 'isoformat'):
                    r[k] = v.isoformat()
                    
        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            success = upload_batch(table, batch)
            if not success:
                print(f"Failed to upload batch {i} to {i+batch_size} for {table}")
                return
            if i % (batch_size * 5) == 0 and i > 0:
                print(f"  ... {i} records uploaded.")
                
    print("Upload complete.")

def export_to_sql(filename, data):
    print("Generating SQL script fallback...")
    # Existing SQL generation here if needed...
