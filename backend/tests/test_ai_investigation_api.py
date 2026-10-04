import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from datetime import datetime
from app.models.user import User
from app.main import app

client = TestClient(app)


def test_ai_investigation_unauthorized(db):
    # Missing auth
    res = client.get("/api/v1/projects/999/investigations/analyze/ai?category=issues&item_id=1&title=Test&description=Test")
    assert res.status_code == 401

def test_ai_investigation_project_not_found(db):
    owner = User(name="AI Owner", email="ai.owner@example.com", created_at=datetime.now())
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/v1/projects/999/investigations/analyze/ai?category=issues&item_id=1&title=Test&description=Test", headers=headers)
    assert res.status_code == 404

@patch("app.services.ai_investigation_service.groq_service.generate", new_callable=AsyncMock)
def test_ai_investigation_success(mock_generate, db):
    owner = User(name="AI Owner 2", email="ai.owner2@example.com", created_at=datetime.now())
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    # Create project
    res = client.post("/api/v1/projects", headers=headers, json={"name": "AI Project", "description": "Desc"})
    project_id = res.json()["id"]

    mock_generate.return_value = '''
    {
      "summary": "AI Summary",
      "facts": ["Fact 1"],
      "inferences": [{"statement": "Inf 1", "confidence": "HIGH", "supporting_evidence": ["Ev 1"]}],
      "recommendations": [{"title": "Rec 1", "reason": "Reason 1", "priority": "HIGH"}],
      "uncertainty": ["Uncertainty 1"]
    }
    '''

    res = client.get(
        f"/api/v1/projects/{project_id}/investigations/analyze/ai?category=general&item_id=1&title=Prob&description=Desc",
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["ai_analysis"] is not None
    assert data["ai_analysis"]["summary"] == "AI Summary"
    assert "Fact 1" in data["ai_analysis"]["facts"]

@patch("app.services.ai_investigation_service.groq_service.generate", new_callable=AsyncMock)
def test_ai_investigation_fallback_on_bad_json(mock_generate, db):
    owner = User(name="AI Owner 3", email="ai.owner3@example.com", created_at=datetime.now())
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/projects", headers=headers, json={"name": "AI Project 2", "description": "Desc"})
    project_id = res.json()["id"]

    mock_generate.return_value = "This is not json"

    res = client.get(
        f"/api/v1/projects/{project_id}/investigations/analyze/ai?category=general&item_id=1&title=Prob&description=Desc",
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data.get("ai_analysis") is None
    assert data["problem"]["title"] == "Prob"
