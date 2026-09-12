import pytest
from fastapi.testclient import TestClient
from risk_engine.main import app
from risk_engine.auth.dependencies import get_current_user
from risk_engine.auth.models import AuthenticatedUser, Role

client = TestClient(app)

# We will mock the current user to be "OtherBank Test" (User B, Org B)
def override_get_current_user_org_b():
    return AuthenticatedUser(
        user_id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        email="hacker@otherbank.com",
        organization_id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        role=Role.SECURITY_ANALYST
    )

@pytest.fixture
def override_auth():
    app.dependency_overrides[get_current_user] = override_get_current_user_org_b
    yield
    app.dependency_overrides = {}

def test_idor_cross_tenant_evidence_submission(override_auth, monkeypatch):
    """
    User from Org B attempts to submit evidence targeting a control owned by Org A.
    """
    # We must mock get_supabase_client to simulate the database state
    class MockData:
        def __init__(self, data):
            self.data = data
            
    class MockSelect:
        def __init__(self, data):
            self.data = data
        def eq(self, *args, **kwargs):
            return self
        def execute(self):
            return MockData(self.data)
            
    class MockTable:
        def select(self, *args, **kwargs):
            # Simulate that the target control exists and belongs to Org A ("11111111-1111-1111-1111-111111111111")
            return MockSelect([{"organization_id": "11111111-1111-1111-1111-111111111111"}])
            
    class MockClient:
        def table(self, name):
            return MockTable()
            
    import risk_engine.api.routers.compliance as compliance_router
    monkeypatch.setattr(compliance_router, "get_supabase_client", lambda: MockClient())

    payload = {
        "organization_control_id": "org-a-control-123",
        "title": "Malicious Evidence",
        "description": "I shouldn't be able to attach this.",
        "storage_path": "s3://hacker-bucket/evidence.pdf",
        "evidence_type": "DOCUMENT",
        "source": "MANUAL"
    }

    # Execute the request
    response = client.post("/api/compliance/evidence", json=payload)
    
    # Assert that the IDOR protection correctly triggers a 403 Cross-tenant forbidden
    assert response.status_code == 403
    assert "Cross-tenant access forbidden" in response.json()["detail"]

def test_idor_target_not_found(override_auth, monkeypatch):
    class MockData:
        def __init__(self, data):
            self.data = data
    class MockSelect:
        def eq(self, *args, **kwargs): return self
        def execute(self): return MockData([]) # Missing target
    class MockTable:
        def select(self, *args, **kwargs): return MockSelect()
    class MockClient:
        def table(self, name): return MockTable()
        
    import risk_engine.api.routers.compliance as compliance_router
    monkeypatch.setattr(compliance_router, "get_supabase_client", lambda: MockClient())

    payload = {
        "organization_control_id": "non-existent-control",
        "title": "Bad Evidence",
        "description": "...",
        "storage_path": "...",
        "evidence_type": "DOCUMENT",
        "source": "MANUAL"
    }

    response = client.post("/api/compliance/evidence", json=payload)
    assert response.status_code == 404
