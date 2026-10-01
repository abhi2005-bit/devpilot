from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import create_access_token
from app.main import app
from app.models import Project, User
from app.models.project import project_members


client = TestClient(app)


def _create_user(db, *, name: str, email: str) -> User:
    user = User(
        name=name,
        email=email,
        created_at=datetime.now(),
    )
    db.add(user)
    db.flush()
    return user


def _create_project(db, *, name: str, owner_id: int) -> Project:
    project = Project(
        name=name,
        description=f"{name} description.",
        owner_id=owner_id,
        created_at=datetime.now(),
    )
    db.add(project)
    db.flush()
    return project


def _headers(user: User) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {create_access_token(user.id)}",
    }


def _membership_user_id(db, project_id: int, user_id: int) -> int | None:
    statement = select(project_members.c.user_id).where(
        project_members.c.project_id == project_id,
        project_members.c.user_id == user_id,
    )
    return db.scalar(statement)


def _membership_role(db, project_id: int, user_id: int) -> str | None:
    statement = select(project_members.c.role).where(
        project_members.c.project_id == project_id,
        project_members.c.user_id == user_id,
    )
    return db.scalar(statement)


def test_member_list_requires_authentication(db):
    owner = _create_user(
        db,
        name="Project Owner",
        email="member-list-owner@example.com",
    )
    project = _create_project(
        db,
        name="Owner Project",
        owner_id=owner.id,
    )
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project.id}/members",
    )

    assert response.status_code == 401


def test_owner_can_list_project_members(db):
    owner = _create_user(
        db,
        name="Project Owner",
        email="member-list-success-owner@example.com",
    )
    member = _create_user(
        db,
        name="Project Member",
        email="member-list-success-member@example.com",
    )
    project = _create_project(
        db,
        name="Owner Project",
        owner_id=owner.id,
    )
    project.members.append(member)
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project.id}/members",
        headers=_headers(owner),
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": str(member.id),
            "name": member.name,
            "email": member.email,
            "role": "ENGINEER",
        }
    ]


def test_non_owner_cannot_list_project_members(db):
    requester = _create_user(
        db,
        name="Requesting User",
        email="member-list-requester@example.com",
    )
    owner = _create_user(
        db,
        name="Project Owner",
        email="member-list-other-owner@example.com",
    )
    project = _create_project(
        db,
        name="Private Project",
        owner_id=owner.id,
    )
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project.id}/members",
        headers=_headers(requester),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}


def test_real_project_owner_can_add_member(db):
    owner = _create_user(
        db,
        name="Real Project Owner",
        email="member-add-owner@example.com",
    )
    member = _create_user(
        db,
        name="New Member",
        email="member-add-user@example.com",
    )
    project = _create_project(
        db,
        name="Real Owner Project",
        owner_id=owner.id,
    )
    db.commit()

    response = client.post(
        f"/api/v1/projects/{project.id}/members",
        headers=_headers(owner),
        json={"user_id": member.id, "role": "DESIGNER"},
    )

    assert response.status_code == 201
    assert response.json() == {
        "id": str(member.id),
        "name": member.name,
        "email": member.email,
        "role": "DESIGNER",
    }
    assert _membership_user_id(db, project.id, member.id) == member.id
    assert _membership_role(db, project.id, member.id) == "DESIGNER"


def test_added_member_role_is_returned_by_fresh_get(db):
    owner = _create_user(
        db,
        name="Product Project Owner",
        email="member-product-owner@example.com",
    )
    member = _create_user(
        db,
        name="Product Member",
        email="member-product-user@example.com",
    )
    project = _create_project(
        db,
        name="Product Project",
        owner_id=owner.id,
    )
    db.commit()

    add_response = client.post(
        f"/api/v1/projects/{project.id}/members",
        headers=_headers(owner),
        json={"user_id": member.id, "role": "PRODUCT"},
    )
    get_response = client.get(
        f"/api/v1/projects/{project.id}/members",
        headers=_headers(owner),
    )

    assert add_response.status_code == 201
    assert _membership_role(db, project.id, member.id) == "PRODUCT"
    assert get_response.status_code == 200
    assert get_response.json() == [
        {
            "id": str(member.id),
            "name": member.name,
            "email": member.email,
            "role": "PRODUCT",
        }
    ]


def test_add_member_without_role_defaults_to_engineer(db):
    owner = _create_user(
        db,
        name="Default Project Owner",
        email="member-default-owner@example.com",
    )
    member = _create_user(
        db,
        name="Default Member",
        email="member-default-user@example.com",
    )
    project = _create_project(
        db,
        name="Default Role Project",
        owner_id=owner.id,
    )
    db.commit()

    response = client.post(
        f"/api/v1/projects/{project.id}/members",
        headers=_headers(owner),
        json={"user_id": member.id},
    )

    assert response.status_code == 201
    assert response.json()["role"] == "ENGINEER"
    assert _membership_role(db, project.id, member.id) == "ENGINEER"


def test_add_member_rejects_invalid_role(db):
    owner = _create_user(
        db,
        name="Invalid Role Owner",
        email="member-invalid-role-owner@example.com",
    )
    member = _create_user(
        db,
        name="Invalid Role Member",
        email="member-invalid-role-user@example.com",
    )
    project = _create_project(
        db,
        name="Invalid Role Project",
        owner_id=owner.id,
    )
    db.commit()

    response = client.post(
        f"/api/v1/projects/{project.id}/members",
        headers=_headers(owner),
        json={"user_id": member.id, "role": "MANAGER"},
    )

    assert response.status_code == 422
    assert _membership_user_id(db, project.id, member.id) is None


def test_non_owner_cannot_add_member(db):
    owner = _create_user(
        db,
        name="Project Owner",
        email="member-add-nonowner-owner@example.com",
    )
    requester = _create_user(
        db,
        name="Non-owner",
        email="member-add-nonowner-requester@example.com",
    )
    new_member = _create_user(
        db,
        name="New Member",
        email="member-add-nonowner-member@example.com",
    )
    project = _create_project(
        db,
        name="Owner Project",
        owner_id=owner.id,
    )
    db.commit()

    response = client.post(
        f"/api/v1/projects/{project.id}/members",
        headers=_headers(requester),
        json={"user_id": new_member.id},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}
    assert _membership_user_id(db, project.id, new_member.id) is None


def test_real_project_owner_can_remove_member(db):
    owner = _create_user(
        db,
        name="Project Owner",
        email="member-remove-owner@example.com",
    )
    member = _create_user(
        db,
        name="Existing Member",
        email="member-remove-user@example.com",
    )
    project = _create_project(
        db,
        name="Owner Project",
        owner_id=owner.id,
    )
    project.members.append(member)
    db.commit()

    response = client.delete(
        f"/api/v1/projects/{project.id}/members/{member.id}",
        headers=_headers(owner),
    )

    assert response.status_code == 204
    assert _membership_user_id(db, project.id, member.id) is None


def test_project_owner_cannot_remove_themselves_as_member(db):
    owner = _create_user(
        db,
        name="Owner Removal Guard",
        email="member-remove-owner-guard@example.com",
    )
    project = _create_project(
        db,
        name="Owner Removal Project",
        owner_id=owner.id,
    )
    project.members.append(owner)
    db.commit()

    response = client.delete(
        f"/api/v1/projects/{project.id}/members/{owner.id}",
        headers=_headers(owner),
    )

    assert response.status_code == 403
    assert _membership_user_id(db, project.id, owner.id) == owner.id


def test_non_owner_cannot_remove_member(db):
    owner = _create_user(
        db,
        name="Project Owner",
        email="member-remove-nonowner-owner@example.com",
    )
    requester = _create_user(
        db,
        name="Non-owner",
        email="member-remove-nonowner-requester@example.com",
    )
    member = _create_user(
        db,
        name="Existing Member",
        email="member-remove-nonowner-member@example.com",
    )
    project = _create_project(
        db,
        name="Owner Project",
        owner_id=owner.id,
    )
    project.members.append(member)
    db.commit()

    response = client.delete(
        f"/api/v1/projects/{project.id}/members/{member.id}",
        headers=_headers(requester),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}
    assert _membership_user_id(db, project.id, member.id) == member.id


def test_users_endpoint_requires_authentication():
    response = client.get("/api/v1/users")

    assert response.status_code == 401


def test_authenticated_user_can_list_users(db):
    user = _create_user(
        db,
        name="Authenticated User",
        email="authenticated-users-list@example.com",
    )
    other_user = _create_user(
        db,
        name="Other User",
        email="authenticated-users-other@example.com",
    )
    db.commit()

    response = client.get(
        "/api/v1/users",
        headers=_headers(user),
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
        },
        {
            "id": str(other_user.id),
            "name": other_user.name,
            "email": other_user.email,
        },
    ]


def test_project_membership_does_not_grant_project_access(db):
    owner = _create_user(
        db,
        name="Project Owner",
        email="membership-access-owner@example.com",
    )
    member = _create_user(
        db,
        name="Project Member",
        email="membership-access-member@example.com",
    )
    project = _create_project(
        db,
        name="Owner-only Project",
        owner_id=owner.id,
    )
    project.members.append(member)
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project.id}",
        headers=_headers(member),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}