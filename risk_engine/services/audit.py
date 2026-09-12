import os
import json
from datetime import datetime
from supabase import create_client

def get_supabase_client():
    url = os.environ["SUPABASE_URL"]
    # For audit logging, we use the service role key to bypass RLS, ensuring we can write the log securely.
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)

def log_audit_event(organization_id: str, user_id: str, action: str, resource_type: str, resource_id: str, new_value: dict = None, old_value: dict = None):
    try:
        client = get_supabase_client()
        client.table("audit_logs").insert({
            "organization_id": organization_id,
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "new_value": new_value,
            "old_value": old_value
        }).execute()
    except Exception as e:
        # Failing to write audit log shouldn't necessarily crash the app depending on compliance strictness.
        # But we log it to stdout.
        print(f"FAILED TO WRITE AUDIT LOG: {e}")
