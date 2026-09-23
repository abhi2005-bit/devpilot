from datetime import datetime

from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.main import app
from app.models import Issue, Project, User


client = TestClient(app)


def test_issue_endpoints_require_authentication():
    response = client.get("/api/v1/issues")

    assert response.status_code == 401
    assert response.json() == {
        "detail": "Authentication required."
    }


def test_user_cannot_access_another_users_issues(db):
    user_a = User(
        name="Issue Owner",
        email="issue.owner@example.com",
        created_at=datetime.now(),
    )

    user_b = User(
        name="Issue Other",
        email="issue.other@example.com",
        created_at=datetime.now(),
    )

    db.add_all([user_a, user_b])
    db.flush()

    project = Project(
        name="Issue Authorization Project",
        description="Project used for issue authorization tests.",
        owner_id=user_a.id,
        created_at=datetime.now(),
    )

    db.add(project)
    db.flush()

    issue = Issue(
        project_id=project.id,
        assignee_id=None,
        title="Owner Issue",
        description="Private owner issue.",
        status="TODO",
        priority="MEDIUM",
        created_at=datetime.now(),
    )

    db.add(issue)
    db.commit()
    db.refresh(issue)

    owner_token = create_access_token(user_a.id)
    other_user_token = create_access_token(user_b.id)

    owner_headers = {
        "Authorization": f"Bearer {owner_token}",
    }

    other_user_headers = {
        "Authorization": f"Bearer {other_user_token}",
    }

    owner_get = client.get(
        f"/api/v1/issues/{issue.id}",
        headers=owner_headers,
    )

    assert owner_get.status_code == 200
    assert owner_get.json()["id"] == issue.id

    other_get = client.get(
        f"/api/v1/issues/{issue.id}",
        headers=other_user_headers,
    )

    assert other_get.status_code == 404
    assert other_get.json() == {
        "detail": "Issue not found"
    }

    other_list = client.get(
        f"/api/v1/issues?project_id={project.id}",
        headers=other_user_headers,
    )

    assert other_list.status_code == 200
    assert other_list.json() == []

    other_all = client.get(
        "/api/v1/issues",
        headers=other_user_headers,
    )

    assert other_all.status_code == 200
    assert other_all.json() == []

    create_response = client.post(
        "/api/v1/issues",
        headers=other_user_headers,
        json={
            "project_id": project.id,
            "title": "Unauthorized Issue",
            "description": "Should not be created.",
            "status": "TODO",
            "priority": "MEDIUM",
        },
    )

    assert create_response.status_code == 404
    assert create_response.json() == {
        "detail": "Project not found"
    }

    update_response = client.put(
        f"/api/v1/issues/{issue.id}",
        headers=other_user_headers,
        json={
            "title": "Unauthorized Update",
        },
    )

    assert update_response.status_code == 404
    assert update_response.json() == {
        "detail": "Issue not found"
    }

    delete_response = client.delete(
        f"/api/v1/issues/{issue.id}",
        headers=other_user_headers,
    )

    assert delete_response.status_code == 404
    assert delete_response.json() == {
        "detail": "Issue not found"
    }

    owner_still_can_read = client.get(
        f"/api/v1/issues/{issue.id}",
        headers=owner_headers,
    )

    assert owner_still_can_read.status_code == 200
