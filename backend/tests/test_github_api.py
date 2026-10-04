import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from datetime import datetime
from app.models.user import User
from app.models.project import Project
from app.main import app

client = TestClient(app)


def test_github_authorize(db):
    # Missing auth
    res = client.get("/api/v1/github/authorize")
    assert res.status_code == 401

    # With auth
    owner = User(name="GH Owner", email="gh.owner@example.com", created_at=datetime.now())
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}
    
    res = client.get("/api/v1/github/authorize", headers=headers)
    assert res.status_code == 200
    assert "url" in res.json()

def test_github_callback(db):
    owner = User(name="GH Owner2", email="gh.owner2@example.com", created_at=datetime.now())
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/github/callback", headers=headers, json={"code": "dev-mock-code"})
    assert res.status_code == 200
    
    db.refresh(owner)
    assert owner.github_token == "mock_github_token"

def test_github_repositories(db):
    owner = User(name="GH Owner3", email="gh.owner3@example.com", created_at=datetime.now(), github_token="mock_github_token")
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/github/repositories", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) > 0
    assert res.json()[0]["owner"] == "openai"

def test_github_connect(db):
    owner = User(name="GH Owner4", email="gh.owner4@example.com", created_at=datetime.now(), github_token="mock_github_token")
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/projects", headers=headers, json={"name": "GH Project", "description": "Desc"})
    project_id = res.json()["id"]

    res = client.post(f"/api/v1/github/projects/{project_id}/connect", headers=headers, json={"owner": "openai", "repo": "openai-python"})
    assert res.status_code == 200
    assert res.json()["github_owner"] == "openai"

def test_github_disconnect(db):
    owner = User(name="GH Owner5", email="gh.owner5@example.com", created_at=datetime.now(), github_token="mock_github_token")
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/projects", headers=headers, json={"name": "GH Project2", "description": "Desc"})
    project_id = res.json()["id"]
    
    # First connect
    client.post(f"/api/v1/github/projects/{project_id}/connect", headers=headers, json={"owner": "openai", "repo": "openai-python"})
    
    # Disconnect
    res = client.post(f"/api/v1/github/projects/{project_id}/disconnect", headers=headers)
    assert res.status_code == 200
    
    # Verify in DB
    p = db.get(Project, project_id)
    assert p.github_owner is None
