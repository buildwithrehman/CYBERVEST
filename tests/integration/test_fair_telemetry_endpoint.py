import pytest
import asyncio
from datetime import datetime, timedelta
from risk_engine.auth.models import AuthenticatedUser
from risk_engine.api.routers.assets import get_fair_telemetry
from unittest.mock import AsyncMock, patch, MagicMock

# Mock user
test_user = AuthenticatedUser(user_id="u1", email="test@test.com", organization_id="org1", role="admin")

class MockSupabase:
    def __init__(self, asset_created_at, events):
        self.asset_created_at = asset_created_at
        self.events = events
        self.insert_calls = 0

    def table(self, table_name):
        return MockTable(table_name, self)

class MockTable:
    def __init__(self, name, db):
        self.name = name
        self.db = db
        self.query_state = {}

    def select(self, *args, **kwargs):
        return self
    
    def insert(self, *args, **kwargs):
        self.db.insert_calls += 1
        return self

    def eq(self, *args, **kwargs):
        return self

    def in_(self, *args, **kwargs):
        return self

    def order(self, *args, **kwargs):
        return self
        
    def gte(self, key, val):
        self.query_state['gte'] = val
        return self
        
    def lte(self, key, val):
        self.query_state['lte'] = val
        return self

    def execute(self):
        if self.name == "assets":
            return MagicMock(data=[{"id": "a1", "organization_id": "org1", "created_at": self.db.asset_created_at}])
        elif self.name == "security_events":
            # Apply DB filters mimicking supabase
            gte_val = self.query_state.get('gte')
            lte_val = self.query_state.get('lte')
            
            filtered = []
            for ev in self.db.events:
                t = ev["timestamp"]
                # mimic DB text comparison if isoformat strings
                if gte_val and t < gte_val: continue
                if lte_val and t > lte_val: continue
                filtered.append(ev)
                
            return MagicMock(data=filtered)
        return MagicMock(data=[])

@pytest.fixture
def mock_ml():
    with patch("risk_engine.api.routers.ml.run_ml_predict", new_callable=AsyncMock) as ml:
        ml.return_value = {
            "prediction": {"probability": 0.05},
            "model": {"version": "v1"}
        }
        yield ml

@pytest.mark.anyio
async def test_clustering_one_cluster(mock_ml):
    # 10:00, 10:50, 11:40
    base = datetime.utcnow() - timedelta(days=40)
    base_str = base.isoformat() + "Z"
    
    events = [
        {"id": "1", "event_type": "malware_detected", "timestamp": (base + timedelta(minutes=0)).isoformat() + "Z"},
        {"id": "2", "event_type": "malware_detected", "timestamp": (base + timedelta(minutes=50)).isoformat() + "Z"},
        {"id": "3", "event_type": "malware_detected", "timestamp": (base + timedelta(minutes=100)).isoformat() + "Z"},
    ]
    
    mock_db = MockSupabase((base - timedelta(days=1)).isoformat() + "Z", events)
    with patch("risk_engine.api.routers.assets._get_db", return_value=mock_db):
        res = await get_fair_telemetry("44444444-4444-4444-4444-444444444444", test_user)
        assert res["status"] == "READY"
        assert res["evidence"]["qualifying_event_count"] == 3
        assert res["evidence"]["clustered_event_count"] == 1
        assert mock_db.insert_calls == 0

@pytest.mark.anyio
async def test_clustering_two_clusters(mock_ml):
    # 10:00, 11:01
    base = datetime.utcnow() - timedelta(days=40)
    base_str = base.isoformat() + "Z"
    
    events = [
        {"id": "1", "event_type": "malware_detected", "timestamp": (base + timedelta(minutes=0)).isoformat() + "Z"},
        {"id": "2", "event_type": "malware_detected", "timestamp": (base + timedelta(minutes=61)).isoformat() + "Z"},
    ]
    
    mock_db = MockSupabase((base - timedelta(days=1)).isoformat() + "Z", events)
    with patch("risk_engine.api.routers.assets._get_db", return_value=mock_db):
        res = await get_fair_telemetry("44444444-4444-4444-4444-444444444444", test_user)
        assert res["status"] == "READY"
        assert res["evidence"]["qualifying_event_count"] == 2
        assert res["evidence"]["clustered_event_count"] == 2
        assert mock_db.insert_calls == 0

@pytest.mark.anyio
async def test_time_boundaries(mock_ml):
    now = datetime.utcnow()
    created_at = now - timedelta(days=40)
    
    events = [
        {"id": "1", "event_type": "malware_detected", "timestamp": (created_at - timedelta(days=1)).isoformat() + "Z"}, # BEFORE created_at
        {"id": "2", "event_type": "malware_detected", "timestamp": (created_at + timedelta(days=1)).isoformat() + "Z"}, # INSIDE
        {"id": "3", "event_type": "malware_detected", "timestamp": (now + timedelta(days=1)).isoformat() + "Z"}, # AFTER now
    ]
    
    mock_db = MockSupabase(created_at.isoformat() + "Z", events)
    with patch("risk_engine.api.routers.assets._get_db", return_value=mock_db):
        res = await get_fair_telemetry("44444444-4444-4444-4444-444444444444", test_user)
        assert res["status"] == "READY"
        assert res["evidence"]["qualifying_event_count"] == 1 # Only the INSIDE event
        assert res["evidence"]["clustered_event_count"] == 1
        assert mock_db.insert_calls == 0
