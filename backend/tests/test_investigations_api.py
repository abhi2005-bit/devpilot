from fastapi.testclient import TestClient
from app.main import app
from app.models import Project, User
from app.core.security import create_access_token
from datetime import datetime

client = TestClient(app)

def test_analyze_investigation(db):
    user = User(name="Test", email="test@test.com", created_at=datetime.utcnow())
    db.add(user)
    db.commit()
    
    project = Project(name="Test", owner_id=user.id)
    db.add(project)
    db.commit()
    
    token = create_access_token(user.id)
    
    response = client.get(
        f"/api/v1/projects/{project.id}/investigations/analyze",
        headers={"Authorization": f"Bearer {token}"},
        params={
            "category": "cicd",
            "item_id": "item123",
            "title": "CI failures detected",
            "description": "Some failures"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "item123"
    assert data["category"] == "cicd"
    assert "evidence" in data
    assert "timeline" in data
    assert "problem" in data
    assert "contributing_factors" in data
    assert "recommendations" in data
