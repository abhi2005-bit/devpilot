from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import insert

from app.core.security import create_access_token
from app.main import app
from app.models import Project, User
from app.models.project import project_members


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

    other_user_update = client.put(
        f"/api/v1/projects/{project.id}",
        headers={
            "Authorization": f"Bearer {other_user_token}",
        },
        json={
            "github_owner": "not-the-owner",
            "github_repo": "unauthorized-repo",
        },
    )

    assert other_user_update.status_code == 403
    db.refresh(project)
    assert project.github_owner is None
    assert project.github_repo is None


def test_project_response_includes_actual_members(db):
    user_a = User(
        name="Project Owner",
        email="project-members.owner@example.com",
        created_at=datetime.now(),
    )
    user_b = User(
        name="Project Member",
        email="project-members.member@example.com",
        created_at=datetime.now(),
    )

    db.add_all([user_a, user_b])
    db.flush()

    project = Project(
        name="Project With Member",
        description="Project response membership test.",
        owner_id=user_a.id,
        created_at=datetime.now(),
    )
    db.add(project)
    db.commit()
    db.execute(
        insert(project_members).values(
            project_id=project.id,
            user_id=user_b.id,
            role="QA",
        )
    )
    db.commit()
    db.refresh(project)

    response = client.get(
        f"/api/v1/projects/{project.id}",
        headers={
            "Authorization": f"Bearer {create_access_token(user_a.id)}",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["members"], list)

    returned_member = next(
        member
        for member in data["members"]
        if member["id"] == str(user_b.id)
    )
    assert returned_member["name"] == user_b.name
    assert returned_member["id"] == str(user_b.id)
    assert returned_member["role"] == "QA"


def test_create_project_persists_github_repository_configuration(db):
    owner = User(
        name="GitHub Project Owner",
        email="github-project-create-owner@example.com",
        created_at=datetime.now(),
    )
    db.add(owner)
    db.commit()

    response = client.post(
        "/api/v1/projects",
        headers={
            "Authorization": f"Bearer {create_access_token(owner.id)}",
        },
        json={
            "name": "Connected Project",
            "description": "Project connected to a public repository.",
            "github_owner": "example-owner",
            "github_repo": "example-repo",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["github_owner"] == "example-owner"
    assert data["github_repo"] == "example-repo"
    assert data["github_url"] == (
        "https://github.com/example-owner/example-repo"
    )

    project = db.get(Project, int(data["id"]))
    assert project is not None
    assert project.github_owner == "example-owner"
    assert project.github_repo == "example-repo"


def test_update_project_changes_github_repository_configuration(db):
    owner = User(
        name="GitHub Project Editor",
        email="github-project-update-owner@example.com",
        created_at=datetime.now(),
    )
    db.add(owner)
    db.flush()

    project = Project(
        name="Repository Update Project",
        description="Project with an existing public repository.",
        owner_id=owner.id,
        github_owner="old-owner",
        github_repo="old-repo",
        github_url="https://github.com/old-owner/old-repo",
        created_at=datetime.now(),
    )
    db.add(project)
    db.commit()

    response = client.put(
        f"/api/v1/projects/{project.id}",
        headers={
            "Authorization": f"Bearer {create_access_token(owner.id)}",
        },
        json={
            "github_owner": "example-owner",
            "github_repo": "example-repo",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["github_owner"] == "example-owner"
    assert data["github_repo"] == "example-repo"
    assert data["github_url"] == (
        "https://github.com/example-owner/example-repo"
    )

    db.refresh(project)
    assert project.github_owner == "example-owner"
    assert project.github_repo == "example-repo"
    assert project.github_url == (
        "https://github.com/example-owner/example-repo"
    )
