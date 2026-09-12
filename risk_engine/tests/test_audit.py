import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from risk_engine.main import app
from risk_engine.auth.dependencies import require_read_access, get_current_user
from risk_engine.auth.models import AuthenticatedUser

client = TestClient(app)

def override_require_read_access_demofin():
    return AuthenticatedUser(
        user_id="user_demofin",
        organization_id="org_demofin",
        email="user@demofin.com",
        role="ADMIN"
    )

def override_require_read_access_otherbank():
    return AuthenticatedUser(
        user_id="user_otherbank",
        organization_id="org_otherbank",
        email="user@otherbank.com",
        role="ADMIN"
    )

def mock_get_admin_supabase_audit(org_id):
    mock_client = MagicMock()
    chain = MagicMock()
    
    # We will record the exact arguments passed to eq
    chain._eq_calls = []
    
    def eq_side_effect(field, value):
        chain._eq_calls.append((field, value))
        return chain
        
    chain.eq.side_effect = eq_side_effect
    chain.range.return_value = chain
    chain.order.return_value = chain
    
    def side_effect():
        # Only return data if organization_id matches org_id exactly as isolated
        # We verify that the chain was explicitly filtered by organization_id
        org_filter_found = any(f == "organization_id" and v == org_id for f, v in chain._eq_calls)
        
        data = []
        if org_filter_found:
            if org_id == "org_demofin":
                data = [
                    {
                        "id": "1",
                        "timestamp": "2026-09-12T00:00:00Z",
                        "user_id": "user_demofin",
                        "action": "ROLE_UPDATED",
                        "resource_type": "USER_ROLE",
                        "resource_id": "target_user",
                        "new_value": {"new_role": "CISO"},
                        "old_value": {"role": "SECURITY_ANALYST"},
                        "profiles": {"email": "user@demofin.com", "full_name": "Demo User"}
                    }
                ]
            elif org_id == "org_otherbank":
                data = [
                    {
                        "id": "2",
                        "timestamp": "2026-09-12T00:00:00Z",
                        "user_id": "user_otherbank",
                        "action": "LOGIN",
                        "resource_type": "SYSTEM",
                        "resource_id": "system",
                        "new_value": None,
                        "old_value": None,
                        "profiles": {"email": "user@otherbank.com", "full_name": "Other User"}
                    }
                ]
        
        ret = MagicMock()
        ret.data = data
        ret.count = len(data)
        
        # Attach the chain for assertions in tests
        ret._chain = chain
        return ret
        
    chain.execute.side_effect = side_effect
    mock_client.table.return_value.select.return_value = chain
    # Also attach the mock chain to the client for easy assertion
    mock_client._chain = chain
    return mock_client

def test_audit_unauthenticated():
    app.dependency_overrides.pop(get_current_user, None)
    response = client.get("/api/audit")
    assert response.status_code == 401

def test_audit_read_demofin(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.audit.get_admin_supabase", lambda: mock_get_admin_supabase_audit("org_demofin"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.get("/api/audit?page=1&page_size=25")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["action"] == "ROLE_UPDATED"
    # Ensure sensitive old_value/new_value are sanitized into safe details
    assert "old_value" not in data["data"][0]
    assert data["data"][0]["details"] == "Role changed to CISO"
    
def test_audit_cross_tenant_isolation(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.audit.get_admin_supabase", lambda: mock_get_admin_supabase_audit("org_otherbank"))
    app.dependency_overrides[get_current_user] = override_require_read_access_otherbank
    
    response = client.get("/api/audit")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    # OtherBank must NOT see DemoFin's audit log
    assert data["data"][0]["action"] == "LOGIN"
    assert data["data"][0]["actor_email"] == "user@otherbank.com"

def test_audit_pagination(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.audit.get_admin_supabase", lambda: mock_get_admin_supabase_audit("org_demofin"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.get("/api/audit?page=2&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["pagination"]["page"] == 2
    assert data["pagination"]["page_size"] == 10

def test_audit_invalid_pagination():
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    # Validation constraint ge=1 for page
    response = client.get("/api/audit?page=0")
    assert response.status_code == 422
    
    # Validation constraint le=100 for page_size
    response = client.get("/api/audit?page_size=101")
    assert response.status_code == 422

def test_audit_cross_tenant_bypass_attempt(monkeypatch):
    mock_client = mock_get_admin_supabase_audit("org_otherbank")
    monkeypatch.setattr("risk_engine.api.routers.audit.get_admin_supabase", lambda: mock_client)
    app.dependency_overrides[get_current_user] = override_require_read_access_otherbank
    
    # Try to access DemoFin's org
    response = client.get("/api/audit?organization_id=org_demofin")
    assert response.status_code == 200
    
    # The chain should NOT contain "org_demofin", it should strictly contain "org_otherbank" from the JWT
    eq_calls = mock_client._chain._eq_calls
    org_filters = [v for f, v in eq_calls if f == "organization_id"]
    
    assert "org_demofin" not in org_filters
    assert "org_otherbank" in org_filters
    
    # Assert we only got our own data (or none)
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["actor_email"] == "user@otherbank.com"

def test_audit_sensitive_metadata_sanitized(monkeypatch):
    mock_client = mock_get_admin_supabase_audit("org_demofin")
    monkeypatch.setattr("risk_engine.api.routers.audit.get_admin_supabase", lambda: mock_client)
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.get("/api/audit")
    assert response.status_code == 200
    data = response.json()
    record = data["data"][0]
    
    # Assert raw values are scrubbed
    assert "old_value" not in record
    assert "new_value" not in record
    
    # Ensure a sanitized details string was constructed instead
    assert record.get("details") == "Role changed to CISO"
    
    # Ensure passwords, tokens are not leaked
    response_str = response.text
    assert "old_value" not in response_str
    assert "new_value" not in response_str
