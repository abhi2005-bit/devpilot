from datetime import datetime
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.main import app
from app.models import Project, User, Sprint, Issue

client = TestClient(app)

def test_sprint_lifecycle(db):
    owner = User(
        name="Sprint Owner",
        email="sprint.owner@example.com",
        created_at=datetime.now(),
    )
    db.add(owner)
    db.flush()

    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Project
    res = client.post("/api/v1/projects", headers=headers, json={"name": "Sprint Project", "description": "Desc"})
    assert res.status_code in [200, 201], f"Project create failed: {res.status_code} {res.text}"
    project_id = res.json()["id"]

    # 2. Create Sprint
    res = client.post(f"/api/v1/projects/{project_id}/sprints", headers=headers, json={"name": "Sprint 1"})
    assert res.status_code in [200, 201], f"Sprint create failed: {res.status_code} {res.text}"
    sprint_id = res.json()["id"]
    assert res.json()["status"] == "PLANNED"

    # 3. Create Issue
    res = client.post("/api/v1/issues", headers=headers, json={"title": "Issue 1", "project_id": project_id})
    assert res.status_code in [200, 201], f"Issue create failed: {res.status_code} {res.text}"
    issue_id = res.json()["id"]

    # 4. Add Issue to Sprint
    res = client.put(f"/api/v1/issues/{issue_id}", headers=headers, json={"title": "Issue 1 updated", "sprint_id": sprint_id})
    assert res.status_code in [200, 201], f"Issue update failed: {res.status_code} {res.text}"
    assert res.json()["sprint_id"] == sprint_id

    # 5. Start Sprint
    res = client.patch(f"/api/v1/sprints/{sprint_id}", headers=headers, json={"status": "ACTIVE"})
    assert res.status_code in [200, 201], f"Sprint update failed: {res.status_code} {res.text}"
    assert res.json()["status"] == "ACTIVE"

    # 6. Complete Sprint
    res = client.patch(f"/api/v1/sprints/{sprint_id}", headers=headers, json={"status": "COMPLETED"})
    assert res.status_code in [200, 201], f"Sprint complete failed: {res.status_code} {res.text}"
    assert res.json()["status"] == "COMPLETED"
