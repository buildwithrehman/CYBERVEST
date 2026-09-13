import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from .models import AuthenticatedUser, Role

security = HTTPBearer()

def get_supabase_url() -> str:
    return os.environ["SUPABASE_URL"]

def get_supabase_anon_key() -> str:
    return os.environ["SUPABASE_KEY"]

def get_service_role_key() -> str:
    return os.environ["SUPABASE_SERVICE_ROLE_KEY"]

def get_supabase_client(token: str) -> Client:
    # We initialize the client with anon key, but we set the auth token.
    client = create_client(get_supabase_url(), get_supabase_anon_key())
    client.auth.set_session(access_token=token, refresh_token="")
    return client

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> AuthenticatedUser:
    token = credentials.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
        
    try:
        client = get_supabase_client(token)
        # Get user from Supabase auth (verifies JWT implicitly)
        user_response = client.auth.get_user()
        if not user_response or not user_response.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or token expired")
    except HTTPException:
        raise
    except Exception as e:
        # Catch IndexError, pydantic ValidationError, auth errors, etc.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
        
    try:
        user_id = user_response.user.id
        email = user_response.user.email
        
        # Determine organization and role. We assume single-org for the prototype route scope,
        # or we pick the first available. 
        # RLS ensures we only see memberships for this user.
        memberships = client.table("organization_members").select("*").eq("user_id", user_id).execute()
        
        if not memberships.data:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not belong to any organization")
            
        org_id = memberships.data[0]["organization_id"]
        role = memberships.data[0]["role"]
        
        return AuthenticatedUser(
            user_id=str(user_id),
            email=email,
            organization_id=str(org_id),
            role=role
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed")

def require_role(allowed_roles: list[str]):
    async def role_checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Role '{user.role}' not permitted. Requires one of {allowed_roles}")
        return user
    return role_checker

# Reusable role-based dependencies
get_admin = require_role([Role.ADMIN])
get_ciso = require_role([Role.ADMIN, Role.CISO])
get_analyst = require_role([Role.ADMIN, Role.CISO, Role.SECURITY_ANALYST])
get_risk_manager = require_role([Role.ADMIN, Role.CISO, Role.RISK_MANAGER])
get_executive = require_role([Role.ADMIN, Role.CISO, Role.EXECUTIVE])
get_auditor = require_role([Role.ADMIN, Role.AUDITOR])

def require_read_access():
    return require_role(Role.get_all())

def require_write_access():
    return require_role([Role.ADMIN, Role.CISO, Role.SECURITY_ANALYST, Role.RISK_MANAGER])
