from datetime import datetime

from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.main import app
from app.models import Project, User


client = TestClient(app)


def test_get_missing_project():
    response = client.get("/api/v1/projects/999999")

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}


def test_user_cannot_access_another_users_project(db):
    user_a = User(
        name="Authorization Owner",
        email="authorization.owner@example.com",
        created_at=datetime.now(),
    )

    user_b = User(
        name="Authorization Other",
        email="authorization.other@example.com",
        created_at=datetime.now(),
    )

    db.add_all([user_a, user_b])
    db.flush()

    project = Project(
        name="Owner Only Project",
        description="Project used to verify ownership authorization.",
        owner_id=user_a.id,
        created_at=datetime.now(),
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    owner_token = create_access_token(user_a.id)
    other_user_token = create_access_token(user_b.id)

    owner_response = client.get(
        f"/api/v1/projects/{project.id}",
        headers={
            "Authorization": f"Bearer {owner_token}",
        },
    )

    assert owner_response.status_code == 200
    assert owner_response.json()["id"] == str(project.id)

    other_user_response = client.get(
        f"/api/v1/projects/{project.id}",
        headers={
            "Authorization": f"Bearer {other_user_token}",
        },
    )

    assert other_user_response.status_code == 404
    assert other_user_response.json() == {
        "detail": "Project not found."
    }
