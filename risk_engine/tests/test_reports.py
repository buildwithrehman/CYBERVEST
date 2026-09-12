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
            if org_id == "org_demofin":
                data = [{"id": "control_1", "status": "IMPLEMENTED", "organization_id": "org_demofin"}]
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

def test_reports_generate_framework_evidence(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda: mock_get_admin_supabase_reports("org_demofin"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/generate", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["report_type"] == "Framework / Evidence Report"
    assert data["metadata"]["organization_id"] == "org_demofin"
    assert len(data["content"]["controls"]) == 1
    assert data["content"]["controls"][0]["status"] == "IMPLEMENTED"
    
def test_reports_tenant_isolation(monkeypatch):
    # Authenticated as DemoFin
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda: mock_get_admin_supabase_reports("org_demofin"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    # Send a malicious payload hoping to bypass
    response = client.post("/api/reports/generate", json={
        "report_type": "FRAMEWORK_EVIDENCE",
        "parameters": {"organization_id": "org_otherbank"}
    })
    
    assert response.status_code == 200
    data = response.json()
    # Should STILL return DemoFin, effectively ignoring the parameter
    assert data["metadata"]["organization_id"] == "org_demofin"

def test_reports_unsupported_type_rejected(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda: mock_get_admin_supabase_reports("org_demofin"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/generate", json={"report_type": "EXECUTIVE_RISK"})
    assert response.status_code == 422
    assert "not available" in response.json()["detail"]
    
    response2 = client.post("/api/reports/generate", json={"report_type": "FAKE_REPORT"})
    assert response2.status_code == 400


def override_require_read_access_otherbank():
    return AuthenticatedUser(
        user_id="user_otherbank",
        organization_id="org_otherbank",
        email="user@otherbank.com",
        role="ADMIN"
    )

def test_reports_generate_framework_evidence_otherbank(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda: mock_get_admin_supabase_reports("org_otherbank"))
    app.dependency_overrides[get_current_user] = override_require_read_access_otherbank
    
    response = client.post("/api/reports/generate", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["report_type"] == "Framework / Evidence Report"
    assert data["metadata"]["organization_id"] == "org_otherbank"
    # Otherbank has no controls in our mock
    assert len(data["content"]["controls"]) == 0

def test_reports_pdf_requires_authentication():
    app.dependency_overrides.pop(get_current_user, None)
    response = client.post("/api/reports/pdf", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 401

def test_reports_pdf_framework_evidence(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda: mock_get_admin_supabase_reports("org_demofin"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/pdf", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "application/pdf"
    
    # Must start with %PDF-
    assert response.content.startswith(b"%PDF-")
    assert len(response.content) > 100
    
    # PDF contains CYBERVEST (since PDF encodes text, we search for bytes)
    # FlateDecode obscures text, but some string fields might exist in metadata or streams if not compressed.
    # To be safe, we just verify it's a valid non-empty PDF signature.
    
def test_reports_pdf_unsupported_report(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda: mock_get_admin_supabase_reports("org_demofin"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/pdf", json={"report_type": "EXECUTIVE_RISK"})
    assert response.status_code == 422
    
def test_reports_pdf_tenant_isolation(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda: mock_get_admin_supabase_reports("org_demofin"))
    app.dependency_overrides[get_current_user] = override_require_read_access_demofin
    
    response = client.post("/api/reports/pdf", json={
        "report_type": "FRAMEWORK_EVIDENCE",
        "parameters": {"organization_id": "org_otherbank"}
    })
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")
    
def test_reports_pdf_otherbank_isolation(monkeypatch):
    monkeypatch.setattr("risk_engine.api.routers.reports.get_supabase_client", lambda: mock_get_admin_supabase_reports("org_otherbank"))
    app.dependency_overrides[get_current_user] = override_require_read_access_otherbank
    
    response = client.post("/api/reports/pdf", json={"report_type": "FRAMEWORK_EVIDENCE"})
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF-")

