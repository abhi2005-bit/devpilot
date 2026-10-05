from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import insert
from app.core.security import create_access_token
from app.main import app
from app.models import Project, User, Issue, Goal, Milestone, Sprint, PullRequest, Commit
from app.models.project import project_members

client = TestClient(app)

def test_search_unauthenticated():
    response = client.get("/api/v1/search?q=test")
    assert response.status_code == 401

def test_search_works_and_respects_authorization(db):
    user_a = User(name="User A", email="usera@example.com", created_at=datetime.now())
    user_b = User(name="User B", email="userb@example.com", created_at=datetime.now())
    db.add_all([user_a, user_b])
    db.flush()

    project_a = Project(name="Project A", description="Desc", owner_id=user_a.id, created_at=datetime.now())
    project_b = Project(name="Project B", description="Desc", owner_id=user_b.id, created_at=datetime.now())
    db.add_all([project_a, project_b])
    db.commit()

    issue_a = Issue(project_id=project_a.id, title="Secret Issue A", description="Secret", status="TODO", priority="HIGH", created_at=datetime.now())
    issue_b = Issue(project_id=project_b.id, title="Secret Issue B", description="Secret", status="TODO", priority="HIGH", created_at=datetime.now())
    db.add_all([issue_a, issue_b])
    db.commit()

    token_a = create_access_token(user_a.id)
    token_b = create_access_token(user_b.id)

    # User A searches
    resp_a = client.get("/api/v1/search?q=Secret", headers={"Authorization": f"Bearer {token_a}"})
    assert resp_a.status_code == 200
    results_a = resp_a.json()["results"]
    assert len(results_a) == 1
    assert results_a[0]["title"] == "Secret Issue A"

    # User B searches
    resp_b = client.get("/api/v1/search?q=Secret", headers={"Authorization": f"Bearer {token_b}"})
    assert resp_b.status_code == 200
    results_b = resp_b.json()["results"]
    assert len(results_b) == 1
    assert results_b[0]["title"] == "Secret Issue B"

def test_search_empty_query(db):
    user = User(name="User C", email="userc@example.com", created_at=datetime.now())
    db.add(user)
    db.commit()
    token = create_access_token(user.id)
    
    resp = client.get("/api/v1/search?q=", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["results"] == []

def test_search_limits(db):
    user = User(name="User Limits", email="userlimits@example.com", created_at=datetime.now())
    db.add(user)
    db.flush()
    project = Project(name="Project Limits", description="Desc", owner_id=user.id, created_at=datetime.now())
    db.add(project)
    db.commit()

    issues = [Issue(project_id=project.id, title=f"Limit Issue {i}", description="Desc", status="TODO", priority="HIGH", created_at=datetime.now()) for i in range(15)]
    db.add_all(issues)
    db.commit()

    token = create_access_token(user.id)
    resp = client.get("/api/v1/search?q=Limit", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    
    results = resp.json()["results"]
    assert len(results) <= 12 # Because the limit for issues is 10 + maybe 1 project
    issue_results = [r for r in results if r["type"] == "issue"]
    assert len(issue_results) == 10
