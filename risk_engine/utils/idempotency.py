import time
import hashlib
from fastapi import HTTPException

_recent_requests = {}

def check_duplicate_request(payload_json: str, ttl_seconds: int = 10):
    """
    Prevents accidental double-submission (e.g. double clicks) 
    by rejecting identical payloads within a short time window.
    Works well in Vercel Serverless since rapid retries typically 
    hit the same warm isolate.
    """
    now = time.monotonic()
    req_hash = hashlib.sha256(payload_json.encode()).hexdigest()
    
    # Cleanup expired entries to prevent memory leak
    keys_to_delete = [k for k, v in _recent_requests.items() if now - v > ttl_seconds]
    for k in keys_to_delete:
        del _recent_requests[k]
        
    if req_hash in _recent_requests:
        raise HTTPException(status_code=409, detail="Duplicate request detected. Please wait before retrying.")
        
    _recent_requests[req_hash] = now
