import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from risk_engine.main import app
from risk_engine.auth.dependencies import require_read_access, get_current_user
from risk_engine.auth.models import AuthenticatedUser

client = TestClient(app)

def override_require_read_access_demofin():
    return AuthenticatedUser(
        user_id="a9999999-9999-9999-9999-999999999999",
        organization_id="55555555-5555-5555-5555-555555555555",
        email="user@demofin.com",
        role="ADMIN"
    )

def mock_get_admin_supabase_reports(org_id):
    mock_client = MagicMock()
    chain = MagicMock()
    chain._eq_calls = []
    
    def eq_side_effect(field, value):
        chain._eq_calls.append((field, value))
        return chain
        
    chain.eq.side_effect = eq_side_effect
    
    def side_effect():
        # Check if tenant isolation applied properly
        org_filter_found = any(f == "organization_id" and v == org_id for f, v in chain._eq_calls)
        
        data = []
        if org_filter_found:
            if org_id == "55555555-5555-5555-5555-555555555555":
                data = [{"id": "control_1", "status": "IMPLEMENTED", "organization_id": "55555555-5555-5555-5555-555555555555"}]
            else:
                data = []
        
        ret = MagicMock()
        ret.data = data
        ret._chain = chain
        return ret
        
    chain.execute.side_effect = side_effect
    mock_client.table.return_value.select.return_value = chain
    mock_client._chain = chain
    return mock_client

def test_reports_unauthenticated():
    app.dependency_overrides.pop(get_current_user, None)
    response = client.post("/api/reports/generate", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 401

@pytest.fixture(autouse=True)
def bypass_idempotency(monkeypatch):
    monkeypatch.setattr("risk_engine.utils.idempotency.check_duplicate_request", lambda *args, **kwargs: None)

def test_reports_generate_framework_evidence(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda token=None: mock_get_admin_supabase_reports("55555555-5555-5555-5555-555555555555"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/generate", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["report_type"] == "Framework / Evidence Report"
    assert data["metadata"]["organization_id"] == "55555555-5555-5555-5555-555555555555"
    assert len(data["content"]["controls"]) == 1
    assert data["content"]["controls"][0]["status"] == "IMPLEMENTED"
    
def test_reports_tenant_isolation(monkeypatch):
    # Authenticated as DemoFin
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda token=None: mock_get_admin_supabase_reports("55555555-5555-5555-5555-555555555555"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    # Send a malicious payload hoping to bypass
    response = client.post("/api/reports/generate", json={
        "report_type": "FRAMEWORK_EVIDENCE",
        "parameters": {"organization_id": "66666666-6666-6666-6666-666666666666"}
    })
    
    assert response.status_code == 200
    data = response.json()
    # Should STILL return DemoFin, effectively ignoring the parameter
    assert data["metadata"]["organization_id"] == "55555555-5555-5555-5555-555555555555"

def test_reports_unsupported_type_rejected(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda token=None: mock_get_admin_supabase_reports("55555555-5555-5555-5555-555555555555"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/generate", json={"report_type": "EXECUTIVE_RISK"})
    assert response.status_code == 422
    assert "not available" in response.json()["detail"]
    
    response2 = client.post("/api/reports/generate", json={"report_type": "FAKE_REPORT"})
    assert response2.status_code == 400


def override_require_read_access_otherbank():
    return AuthenticatedUser(
        user_id="b0000000-0000-0000-0000-000000000000",
        organization_id="66666666-6666-6666-6666-666666666666",
        email="user@otherbank.com",
        role="ADMIN"
    )

def test_reports_unsupported_type_rejected(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda token=None: mock_get_admin_supabase_reports("55555555-5555-5555-5555-555555555555"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/generate", json={"report_type": "INVALID_TYPE"})
    assert response.status_code == 400

def test_reports_generate_framework_evidence_otherbank(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda token=None: mock_get_admin_supabase_reports("66666666-6666-6666-6666-666666666666"))
    app.dependency_overrides[get_current_user] = override_require_read_access_otherbank
    
    response = client.post("/api/reports/generate", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["report_type"] == "Framework / Evidence Report"
    assert data["metadata"]["organization_id"] == "66666666-6666-6666-6666-666666666666"
    assert len(data["content"]["controls"]) == 0

def test_reports_pdf_requires_authentication():
    app.dependency_overrides = {}
    response = client.post("/api/reports/pdf", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 401

def test_reports_pdf_framework_evidence(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda token=None: mock_get_admin_supabase_reports("55555555-5555-5555-5555-555555555555"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/pdf", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")
    
def test_reports_pdf_unsupported_report(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda token=None: mock_get_admin_supabase_reports("55555555-5555-5555-5555-555555555555"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/pdf", json={"report_type": "INVALID_TYPE"})
    assert response.status_code == 400
    
def test_reports_pdf_tenant_isolation(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda token=None: mock_get_admin_supabase_reports("55555555-5555-5555-5555-555555555555"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/pdf", json={
        "report_type": "FRAMEWORK_EVIDENCE",
        "parameters": {"organization_id": "66666666-6666-6666-6666-666666666666"}
    })
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")
    
def test_reports_pdf_otherbank_isolation(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda token=None: mock_get_admin_supabase_reports("66666666-6666-6666-6666-666666666666"))
    app.dependency_overrides[get_current_user] = override_require_read_access_otherbank
    
    response = client.post("/api/reports/pdf", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")

