import pytest
from fastapi.testclient import TestClient
from risk_engine.main import app
from risk_engine.auth.dependencies import get_current_user
from risk_engine.auth.models import AuthenticatedUser, Role

client = TestClient(app)

def override_get_current_user_admin():
    return AuthenticatedUser(
        user_id="a3333333-3333-3333-3333-333333333333",
        email="admin@demofin.com",
        organization_id="11111111-1111-1111-1111-111111111111",
        role=Role.ADMIN
    )

def override_get_current_user_auditor():
    return AuthenticatedUser(
        user_id="a5555555-5555-5555-5555-555555555555",
        email="auditor@demofin.com",
        organization_id="11111111-1111-1111-1111-111111111111",
        role=Role.AUDITOR
    )

def override_get_current_user_other_org():
    return AuthenticatedUser(
        user_id="a7777777-7777-7777-7777-777777777777",
        email="hacker@other.com",
        organization_id="22222222-2222-2222-2222-222222222222",
        role=Role.ADMIN
    )

from unittest.mock import MagicMock

def mock_supabase_client():
    mock_client = MagicMock()
    # Mock /frameworks
    mock_client.table().select().execute.return_value = MagicMock(data=[
        {"short_name": "RBI IT Governance 2023"},
        {"short_name": "SEBI CSCRF 2024"},
        {"short_name": "NIST CSF 2.0"},
        {"short_name": "ISO 27001:2022"},
        {"short_name": "CIS v8"}
    ])
    return mock_client

@pytest.fixture(autouse=True)
def patch_supabase(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.compliance.get_supabase_client", mock_supabase_client)
    monkeypatch.setattr("risk_engine.api.routers.compliance.log_audit_event", MagicMock())

# 1. Framework retrieval works
def test_framework_retrieval():
    app.dependency_overrides[get_current_user] = override_get_current_user_admin
    res = client.get("/api/compliance/frameworks")
    assert res.status_code == 200
    frameworks = res.json()
    assert len(frameworks) > 0
    names = [f["short_name"] for f in frameworks]
    assert "RBI IT Governance 2023" in names
    assert "SEBI CSCRF 2024" in names
    assert "NIST CSF 2.0" in names
    assert "ISO 27001:2022" in names
    assert "CIS v8" in names

# 2. Control retrieval & Mappings
def test_control_retrieval_and_mappings():
    app.dependency_overrides[get_current_user] = override_get_current_user_admin
    res = client.get("/api/compliance/mappings")
    assert res.status_code == 200
    mappings = res.json()
    assert isinstance(mappings, list)

# 3. Auditor Read Access
def test_auditor_read_access():
    app.dependency_overrides[get_current_user] = override_get_current_user_auditor
    res = client.get("/api/compliance/overview")
    assert res.status_code == 200

# 4. Auditor Modification Denied
def test_auditor_modification_denied():
    app.dependency_overrides[get_current_user] = override_get_current_user_auditor
    res = client.patch("/api/compliance/controls/123", json={"status": "IMPLEMENTED"})
    assert res.status_code == 403

# 5. Cross-tenant modification denied (IDOR)
def test_cross_tenant_update_blocked():
    # If the user tries to patch an organization control that doesn't belong to them:
    # Since our mock uses `org_2` and the database test expects `org_1` or it won't exist.
    # The API will return 403.
    app.dependency_overrides[get_current_user] = override_get_current_user_other_org
    # This ID might not exist in the DB, but our application logic fetches it and checks ownership first
    res = client.patch("/api/compliance/controls/00000000-0000-0000-0000-000000000000", json={"status": "IMPLEMENTED"})
    assert res.status_code == 403
