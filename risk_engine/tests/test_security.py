import pytest
from fastapi.testclient import TestClient
from risk_engine.main import app
from risk_engine.auth.dependencies import get_current_user
from risk_engine.auth.models import AuthenticatedUser, Role

client = TestClient(app)

def override_get_current_user_admin():
    return AuthenticatedUser(
        user_id="user_admin",
        email="admin@demofin.com",
        organization_id="org_1",
        role=Role.ADMIN
    )

def override_get_current_user_analyst():
    return AuthenticatedUser(
        user_id="user_analyst",
        email="analyst@demofin.com",
        organization_id="org_1",
        role=Role.SECURITY_ANALYST
    )

def override_get_current_user_auditor():
    return AuthenticatedUser(
        user_id="user_auditor",
        email="auditor@demofin.com",
        organization_id="org_1",
        role=Role.AUDITOR
    )

def override_get_current_user_other_org():
    return AuthenticatedUser(
        user_id="user_other",
        email="hacker@other.com",
        organization_id="org_2",
        role=Role.ADMIN
    )

# 1. Unauthenticated Request -> 401 (Depends on actual implementation checking bearer. Our mock needs to be removed for this test)
def test_unauthenticated_request():
    # Clear overrides
    app.dependency_overrides = {}
    response = client.get("/api/assets/")
    assert response.status_code == 401 # FastAPI HTTPBearer without token returns 401

def test_analyst_reading_allowed_resource():
    app.dependency_overrides[get_current_user] = override_get_current_user_analyst
    response = client.get("/api/assets/")
    assert response.status_code == 200
    assert "org_1" in response.json()["message"]

def test_analyst_attempting_admin_action():
    app.dependency_overrides[get_current_user] = override_get_current_user_analyst
    response = client.post("/api/admin/roles", json={"target_user_id": "123", "role": "ADMIN"})
    assert response.status_code == 403

def test_auditor_attempting_modification():
    app.dependency_overrides[get_current_user] = override_get_current_user_auditor
    response = client.post("/api/assets/", json={"name": "New Asset"})
    assert response.status_code == 403

def test_auditor_reading_allowed_data():
    app.dependency_overrides[get_current_user] = override_get_current_user_auditor
    response = client.get("/api/assets/123")
    assert response.status_code == 200

def test_cross_tenant_fair_scenario():
    # User is in org_2, tries to run a FAIR scenario for org_1
    app.dependency_overrides[get_current_user] = override_get_current_user_other_org
    payload = {
        "scenario_id": "123",
        "scenario_name": "Test",
        "organization_id": "org_1",
        "tef": {"min_val": 2.0, "likely_val": 10.0, "max_val": 25.0},
        "susceptibility": {"min_val": 0.4, "likely_val": 0.6, "max_val": 0.9},
        "productivity_loss": {"min_val": 100000, "likely_val": 500000, "max_val": 2000000},
        "response_cost": {"min_val": 50000, "likely_val": 100000, "max_val": 300000},
        "regulatory_loss": {"min_val": 0, "likely_val": 0, "max_val": 1000000},
        "reputation_loss": {"min_val": 0, "likely_val": 200000, "max_val": 1500000},
        "simulation_count": 10,
        "seed": 123
    }
    response = client.post("/api/fair/run", json=payload)
    assert response.status_code == 403
    assert "Cross-tenant access forbidden" in response.json()["detail"]

def test_cross_tenant_ml_predict():
    app.dependency_overrides[get_current_user] = override_get_current_user_other_org
    payload = {
        "organization_id": "org_1",
        "features": {
            "asset_type": "Server",
            "criticality": "Medium",
            "internet_exposed": True,
            "vuln_count": 0,
            "cvss_max": 0.0,
            "known_exploited_count": 0,
            "recent_event_count_30d": 0,
            "prior_incident_count": 0
        }
    }
    response = client.post("/api/ml/predict", json=payload)
    assert response.status_code == 403
    assert "Cross-tenant access forbidden" in response.json()["detail"]

def test_cross_tenant_optimization():
    app.dependency_overrides[get_current_user] = override_get_current_user_other_org
    payload = {
        "organization_id": "org_1",
        "budget": 10000,
        "mitigations": [],
        "baseline_scenario": {
            "scenario_id": "123",
            "scenario_name": "Test",
            "organization_id": "org_1",
            "tef": {"min_val": 2.0, "likely_val": 10.0, "max_val": 25.0},
            "susceptibility": {"min_val": 0.4, "likely_val": 0.6, "max_val": 0.9},
            "productivity_loss": {"min_val": 100000, "likely_val": 500000, "max_val": 2000000},
            "response_cost": {"min_val": 50000, "likely_val": 100000, "max_val": 300000},
            "regulatory_loss": {"min_val": 0, "likely_val": 0, "max_val": 1000000},
            "reputation_loss": {"min_val": 0, "likely_val": 200000, "max_val": 1500000},
            "simulation_count": 10,
            "seed": 123
        }
    }
    response = client.post("/api/optimization/run", json=payload)
    assert response.status_code == 403
    assert "Cross-tenant access forbidden" in response.json()["detail"]

import inspect

def test_get_current_user_is_sync():
    # Ensure it's not an async def function to enable threadpool execution
    from risk_engine.auth.dependencies import get_current_user
    assert not inspect.iscoroutinefunction(get_current_user), "get_current_user must be sync (def) for threadpool execution"

def test_get_current_user_parses_auth(monkeypatch):
    from risk_engine.auth.dependencies import get_current_user
    from fastapi.security import HTTPAuthorizationCredentials
    from risk_engine.auth.models import Role

    class MockUser:
        id = "user_123"
        email = "test@example.com"

    class MockUserResponse:
        user = MockUser()

    class MockTableResponse:
        data = [{"organization_id": "org_123", "role": Role.ADMIN}]

    class MockTable:
        def select(self, *args, **kwargs): return self
        def eq(self, *args, **kwargs): return self
        def execute(self): return MockTableResponse()

    class MockAuth:
        def get_user(self): return MockUserResponse()

    class MockClient:
        auth = MockAuth()
        def table(self, name): return MockTable()

    import risk_engine.auth.dependencies as deps
    monkeypatch.setattr(deps, "get_supabase_client", lambda t: MockClient())

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid_token")
    user = get_current_user(creds)

    assert user.user_id == "user_123"
    assert user.email == "test@example.com"
    assert user.organization_id == "org_123"
    assert user.role == Role.ADMIN
