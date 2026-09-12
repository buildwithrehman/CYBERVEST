import pytest
from fastapi.testclient import TestClient
from risk_engine.main import app
from risk_engine.auth.dependencies import get_current_user
from risk_engine.auth.models import AuthenticatedUser, Role

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()

def test_missing_authorization_header():
    # Attempting to access protected route without header
    response = client.get("/api/assets/")
    assert response.status_code in [401, 403]
    # actually missing token gives 403 Forbidden generally with HTTPBearer, or 401.

def test_malformed_bearer_token():
    # Not base64, completely invalid structure
    response = client.get("/api/assets/", headers={"Authorization": "Bearer invalid.invalid.invalid"})
    assert response.status_code == 401

def test_structurally_invalid_jwt():
    response = client.get("/api/assets/", headers={"Authorization": "Bearer not_even_three_parts"})
    assert response.status_code == 401

def test_valid_authenticated_request():
    def override_admin():
        return AuthenticatedUser(user_id="user_admin", email="admin@demofin.test", organization_id="11111111-1111-1111-1111-111111111111", role=Role.ADMIN)
    
    app.dependency_overrides[get_current_user] = override_admin
    response = client.get("/api/assets/")
    assert response.status_code == 200

def test_authenticated_insufficient_role_request():
    def override_auditor():
        return AuthenticatedUser(user_id="user_auditor", email="auditor@demofin.test", organization_id="11111111-1111-1111-1111-111111111111", role=Role.AUDITOR)
    
    app.dependency_overrides[get_current_user] = override_auditor
    # An auditor should be forbidden from running an optimization which requires write access
    opt = {
        "organization_id": "11111111-1111-1111-1111-111111111111",
        "budget": 10000,
        "baseline_scenario": {
            "scenario_id": "test_fair",
            "organization_id": "11111111-1111-1111-1111-111111111111",
            "tef": {"min_val": 0.5, "likely_val": 1.0, "max_val": 2.0},
            "susceptibility": {"min_val": 0.1, "likely_val": 0.5, "max_val": 0.9},
            "primary_loss": {"min_val": 1000, "likely_val": 5000, "max_val": 10000},
            "secondary_loss": {"min_val": 0, "likely_val": 1000, "max_val": 5000},
            "productivity_loss": 0,
            "response_cost": 0,
            "reputation_loss": 0,
            "regulatory_loss": 0
        },
        "candidates": [],
        "constraints": {"max_mitigations": 5}
    }
    response = client.post("/api/optimization/run", json=opt)
    assert response.status_code == 403

