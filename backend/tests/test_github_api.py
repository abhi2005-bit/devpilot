import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from datetime import datetime
from app.models.user import User
from app.models.project import Project
from app.main import app
import httpx

client = TestClient(app)

class MockResponse:
    def __init__(self, json_data, status_code):
        self.json_data = json_data
        self.status_code = status_code

    def json(self):
        return self.json_data

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("Error", request=MagicMock(), response=self)

class MockAsyncClient:
    def __init__(self, **kwargs):
        pass
    async def __aenter__(self):
        return self
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass
    async def get(self, url, headers=None, **kwargs):
        if "/user/repos" in url:
            if headers and headers.get("Authorization") == "Bearer real_test_token":
                return MockResponse([{"owner": {"login": "openai"}, "name": "openai-python", "full_name": "openai/openai-python", "html_url": "https://github.com/openai/openai-python", "default_branch": "main", "stargazers_count": 0, "forks_count": 0, "open_issues_count": 0}], 200)
            return MockResponse({}, 401)
        if "/actions/runs" in url:
            return MockResponse({"workflow_runs": []}, 200)
        if "/pulls" in url or "/commits" in url or "/issues" in url:
            return MockResponse([], 200)
        if "/repos/" in url:
            if headers and headers.get("Authorization") == "Bearer real_test_token":
                return MockResponse({"html_url": "https://github.com/openai/openai-python", "owner": {"login": "openai"}, "name": "openai-python", "full_name": "openai/openai-python", "default_branch": "main", "stargazers_count": 0, "forks_count": 0, "open_issues_count": 0}, 200)
            return MockResponse({}, 401)
        return MockResponse({}, 404)
    async def post(self, url, headers=None, data=None, **kwargs):
        if "access_token" in url:
            return MockResponse({"access_token": "real_test_token"}, 200)
        return MockResponse({}, 404)


@patch("app.api.routes.github.settings.github_client_id", "test_client_id")
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

@patch("httpx.AsyncClient", new=MockAsyncClient)
@patch("app.api.routes.github.settings.github_client_id", "test_client_id")
@patch("app.api.routes.github.settings.github_client_secret", "test_secret")
def test_github_callback(db):
    owner = User(name="GH Owner2", email="gh.owner2@example.com", created_at=datetime.now())
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/github/callback", headers=headers, json={"code": "test_code"})
    assert res.status_code == 200
    
    db.refresh(owner)
    assert owner.github_token == "real_test_token"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_github_repositories(db):
    owner = User(name="GH Owner3", email="gh.owner3@example.com", created_at=datetime.now(), github_token="real_test_token")
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/github/repositories", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) > 0
    assert res.json()[0]["owner"] == "openai"

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_github_connect(db):
    owner = User(name="GH Owner4", email="gh.owner4@example.com", created_at=datetime.now(), github_token="real_test_token")
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

@patch("httpx.AsyncClient", new=MockAsyncClient)
def test_github_disconnect(db):
    owner = User(name="GH Owner5", email="gh.owner5@example.com", created_at=datetime.now(), github_token="real_test_token")
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

@patch("httpx.AsyncClient", new=MockAsyncClient)
@patch("app.api.routes.github.cicd_service.sync_github_runs", new_callable=AsyncMock)
@patch("app.api.routes.github.github_service.get_pull_requests", new_callable=AsyncMock)
@patch("app.api.routes.github.github_service.get_commits", new_callable=AsyncMock)
def test_github_sync(mock_commits, mock_prs, mock_sync, db):
    owner = User(name="GH Owner6", email="gh.owner6@example.com", created_at=datetime.now(), github_token="real_test_token")
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/projects", headers=headers, json={"name": "GH Project Sync", "description": "Desc"})
    project_id = res.json()["id"]
    
    # First connect
    res = client.post(f"/api/v1/github/projects/{project_id}/connect", headers=headers, json={"owner": "openai", "repo": "openai-python"})
    assert res.status_code == 200

    # Test sync
    res = client.post(f"/api/v1/github/projects/{project_id}/sync", headers=headers)
    assert res.status_code == 200
    
    # Verify in DB
    p = db.get(Project, project_id)
    assert p.github_sync_status == "SYNCED"
    assert p.github_last_synced_at is not None

def test_github_sync_unauthorized(db):
    owner = User(name="GH Owner7", email="gh.owner7@example.com", created_at=datetime.now(), github_token=None)
    db.add(owner)
    db.flush()
    from app.core.security import create_access_token
    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/projects", headers=headers, json={"name": "GH Project No Auth", "description": "Desc"})
    project_id = res.json()["id"]
    
    # Set owner without token
    p = db.get(Project, project_id)
    p.github_owner = "openai"
    p.github_repo = "openai-python"
    db.commit()

    # Test sync should fail
    res = client.post(f"/api/v1/github/projects/{project_id}/sync", headers=headers)
    assert res.status_code == 401
