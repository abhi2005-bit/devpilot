import pytest
from datetime import datetime
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.main import app
from app.models import Project, User

client = TestClient(app)

def setup_user_and_project(db):
    owner = User(
        name="Plan Owner",
        email="plan.owner@example.com",
        created_at=datetime.now(),
    )
    db.add(owner)
    db.flush()

    token = create_access_token(owner.id)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/projects", headers=headers, json={"name": "Plan Project", "description": "Desc"})
    project_id = res.json()["id"]

    return headers, project_id


def test_create_and_get_goal(db):
    headers, project_id = setup_user_and_project(db)

    # Create goal
    response = client.post(
        f"/api/v1/projects/{project_id}/goals",
        json={"title": "Improve Auth", "description": "Make it better"},
        headers=headers,
    )
    assert response.status_code == 200
    goal = response.json()
    assert goal["title"] == "Improve Auth"
    assert goal["status"] == "PLANNED"

    # Get goals
    response = client.get(
        f"/api/v1/projects/{project_id}/goals",
        headers=headers,
    )
    assert response.status_code == 200
    goals = response.json()
    assert len(goals) >= 1
    assert any(g["id"] == goal["id"] for g in goals)

    # Get single goal
    response = client.get(
        f"/api/v1/goals/{goal['id']}",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["id"] == goal["id"]
    
    # Update goal
    response = client.patch(
        f"/api/v1/goals/{goal['id']}",
        json={"status": "ACTIVE"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ACTIVE"


def test_create_and_get_milestone(db):
    headers, project_id = setup_user_and_project(db)

    # Create goal first
    goal_res = client.post(
        f"/api/v1/projects/{project_id}/goals",
        json={"title": "Goal for Milestone"},
        headers=headers,
    )
    goal_id = goal_res.json()["id"]

    # Create milestone
    response = client.post(
        f"/api/v1/goals/{goal_id}/milestones",
        json={"title": "OAuth 2"},
        headers=headers,
    )
    assert response.status_code == 200
    milestone = response.json()
    assert milestone["title"] == "OAuth 2"

    # Get milestones
    response = client.get(
        f"/api/v1/goals/{goal_id}/milestones",
        headers=headers,
    )
    assert response.status_code == 200
    milestones = response.json()
    assert len(milestones) == 1
    assert milestones[0]["id"] == milestone["id"]

    # Update milestone
    response = client.patch(
        f"/api/v1/milestones/{milestone['id']}",
        json={"status": "COMPLETED"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"

def test_sprint_milestone_relation(db):
    headers, project_id = setup_user_and_project(db)

    goal_res = client.post(
        f"/api/v1/projects/{project_id}/goals",
        json={"title": "Sprint test goal"},
        headers=headers,
    )
    goal_id = goal_res.json()["id"]

    milestone_res = client.post(
        f"/api/v1/goals/{goal_id}/milestones",
        json={"title": "Sprint test milestone"},
        headers=headers,
    )
    milestone_id = milestone_res.json()["id"]

    # Create sprint with milestone
    sprint_res = client.post(
        f"/api/v1/projects/{project_id}/sprints",
        json={"name": "Sprint 1", "milestone_id": milestone_id},
        headers=headers,
    )
    assert sprint_res.status_code == 200
    assert sprint_res.json()["milestone_id"] == milestone_id

    # Update sprint with milestone
    sprint_id = sprint_res.json()["id"]
    update_res = client.patch(
        f"/api/v1/sprints/{sprint_id}",
        json={"status": "ACTIVE"},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["milestone_id"] == milestone_id
