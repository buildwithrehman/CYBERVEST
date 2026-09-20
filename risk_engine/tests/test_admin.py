import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from risk_engine.main import app
from risk_engine.auth.dependencies import get_current_user, get_admin
from risk_engine.auth.models import AuthenticatedUser, Role

client = TestClient(app)

def override_get_current_user_admin():
    return AuthenticatedUser(
        user_id="a3333333-3333-3333-3333-333333333333",
        organization_id="11111111-1111-1111-1111-111111111111",
        email="admin@demofin.com",
        role=Role.ADMIN
    )

def override_get_current_user_exec():
    return AuthenticatedUser(
        user_id="a4444444-4444-4444-4444-444444444444",
        organization_id="11111111-1111-1111-1111-111111111111",
        email="exec@demofin.com",
        role=Role.EXECUTIVE
    )
    
def override_get_current_user_auditor():
    return AuthenticatedUser(
        user_id="a5555555-5555-5555-5555-555555555555",
        organization_id="11111111-1111-1111-1111-111111111111",
        email="auditor@demofin.com",
        role=Role.AUDITOR
    )

def mock_get_admin_supabase_list():
    mock_client = MagicMock()
    mock_client.table().select().eq().execute.return_value = MagicMock(data=[
        {
            "user_id": "a3333333-3333-3333-3333-333333333333",
            "role": "ADMIN",
            "created_at": "2026-09-01T00:00:00Z",
            "profiles": {"email": "admin@demofin.com", "full_name": "Admin User"}
        },
        {
            "user_id": "a4444444-4444-4444-4444-444444444444",
            "role": "EXECUTIVE",
            "created_at": "2026-09-02T00:00:00Z",
            "profiles": {"email": "exec@demofin.com", "full_name": "Executive"}
        }
    ])
    return mock_client

def test_list_roles_success(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.admin.get_admin_supabase", mock_get_admin_supabase_list)
    app.dependency_overrides[get_current_user] = override_get_current_user_admin
    
    response = client.get("/api/admin/roles")
    assert response.status_code == 200
    data = response.json()
    assert "members" in data
    assert len(data["members"]) == 2
    assert data["members"][0]["email"] == "admin@demofin.com"

def test_list_roles_unauthenticated():
    app.dependency_overrides.pop(get_current_user, None)
    response = client.get("/api/admin/roles")
    assert response.status_code == 401

def mock_get_admin_supabase_update_success():
    mock_client = MagicMock()
    # Mocking chains: table().select().eq().eq().execute()
    # table().update().eq().eq().execute()
    chain = MagicMock()
    chain.eq.return_value = chain
    chain.execute.return_value = MagicMock(data=[{"role": "EXECUTIVE", "user_id": "a4444444-4444-4444-4444-444444444444"}])
    mock_client.table.return_value.select.return_value = chain
    mock_client.table.return_value.update.return_value = chain
    return mock_client

def test_update_role_admin_success(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.admin.get_admin_supabase", mock_get_admin_supabase_update_success)
    app.dependency_overrides.pop(get_admin, None)
    app.dependency_overrides[get_current_user] = override_get_current_user_admin
    
    response = client.post("/api/admin/roles", json={"target_user_id": "a4444444-4444-4444-4444-444444444444", "role": "RISK_MANAGER"})
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_update_role_unauthorized(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.admin.get_admin_supabase", mock_get_admin_supabase_update_success)
    app.dependency_overrides.pop(get_admin, None)
    app.dependency_overrides[get_current_user] = override_get_current_user_exec
    
    response = client.post("/api/admin/roles", json={"target_user_id": "a3333333-3333-3333-3333-333333333333", "role": "RISK_MANAGER"})
    assert response.status_code == 403

def test_update_role_auditor_unauthorized(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.admin.get_admin_supabase", mock_get_admin_supabase_update_success)
    app.dependency_overrides.pop(get_admin, None)
    app.dependency_overrides[get_current_user] = override_get_current_user_auditor
    
    response = client.post("/api/admin/roles", json={"target_user_id": "a3333333-3333-3333-3333-333333333333", "role": "RISK_MANAGER"})
    assert response.status_code == 403

def mock_get_admin_supabase_final_admin():
    mock_client = MagicMock()
    chain_target = MagicMock()
    chain_target.eq.return_value = chain_target
    # Simulated response logic depending on select
    def execute_side_effect():
        # First call is target check (returns ADMIN)
        # Second call is admins check (returns 1 admin)
        return MagicMock(data=[{"role": "ADMIN", "user_id": "a3333333-3333-3333-3333-333333333333"}])
        
    chain_target.execute.side_effect = [
        MagicMock(data=[{"role": "ADMIN"}]),
        MagicMock(data=[{"user_id": "a3333333-3333-3333-3333-333333333333"}])
    ]
    mock_client.table.return_value.select.return_value = chain_target
    return mock_client

def test_update_role_final_admin_fails(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.admin.get_admin_supabase", mock_get_admin_supabase_final_admin)
    app.dependency_overrides.pop(get_admin, None)
    app.dependency_overrides[get_current_user] = override_get_current_user_admin
    
    response = client.post("/api/admin/roles", json={"target_user_id": "a3333333-3333-3333-3333-333333333333", "role": "EXECUTIVE"})
    assert response.status_code == 400
    assert "Cannot remove the final administrator" in response.json()["detail"]

