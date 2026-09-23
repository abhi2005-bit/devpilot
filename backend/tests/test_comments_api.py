from datetime import datetime

from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.main import app
from app.models import Issue, Project, User


client = TestClient(app)


def test_comment_endpoints_require_authentication(db):
    user = User(
        name="Comment Owner",
        email="comment-auth@example.com",
        created_at=datetime.now(),
    )

    db.add(user)
    db.flush()

    project = Project(
        name="Comment Auth Project",
        description="Project used for comment authentication tests.",
        owner_id=user.id,
        created_at=datetime.now(),
    )

    db.add(project)
    db.flush()

    issue = Issue(
        project_id=project.id,
        assignee_id=None,
        title="Comment Auth Issue",
        description="Issue used for comment authentication tests.",
        status="TODO",
        priority="MEDIUM",
        created_at=datetime.now(),
    )

    db.add(issue)
    db.commit()
    db.refresh(issue)

    get_response = client.get(
        f"/api/v1/issues/{issue.id}/comments",
    )

    assert get_response.status_code == 401
    assert get_response.json() == {
        "detail": "Authentication required."
    }

    post_response = client.post(
        f"/api/v1/issues/{issue.id}/comments",
        json={
            "content": "Unauthenticated comment",
        },
    )

    assert post_response.status_code == 401
    assert post_response.json() == {
        "detail": "Authentication required."
    }


def test_user_cannot_access_another_users_comments(db):
    user_a = User(
        name="Comment Owner",
        email="comment.owner@example.com",
        created_at=datetime.now(),
    )

    user_b = User(
        name="Comment Other",
        email="comment.other@example.com",
        created_at=datetime.now(),
    )

    db.add_all([user_a, user_b])
    db.flush()

    project = Project(
        name="Comment Authorization Project",
        description="Project used for comment authorization tests.",
        owner_id=user_a.id,
        created_at=datetime.now(),
    )

    db.add(project)
    db.flush()

    issue = Issue(
        project_id=project.id,
        assignee_id=None,
        title="Private Comment Issue",
        description="Issue belonging to user A.",
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

    owner_post = client.post(
        f"/api/v1/issues/{issue.id}/comments",
        headers=owner_headers,
        json={
            "content": "Private owner comment",
        },
    )

    assert owner_post.status_code == 201
    assert owner_post.json()["issue_id"] == issue.id
    assert owner_post.json()["author_id"] == user_a.id
    assert owner_post.json()["content"] == "Private owner comment"

    owner_get = client.get(
        f"/api/v1/issues/{issue.id}/comments",
        headers=owner_headers,
    )

    assert owner_get.status_code == 200
    assert len(owner_get.json()) == 1
    assert owner_get.json()[0]["author_id"] == user_a.id

    other_get = client.get(
        f"/api/v1/issues/{issue.id}/comments",
        headers=other_user_headers,
    )

    assert other_get.status_code == 404
    assert other_get.json() == {
        "detail": "Issue not found"
    }

    other_post = client.post(
        f"/api/v1/issues/{issue.id}/comments",
        headers=other_user_headers,
        json={
            "content": "Unauthorized comment",
        },
    )

    assert other_post.status_code == 404
    assert other_post.json() == {
        "detail": "Issue not found"
    }

    owner_get_after_attack = client.get(
        f"/api/v1/issues/{issue.id}/comments",
        headers=owner_headers,
    )

    assert owner_get_after_attack.status_code == 200
    assert len(owner_get_after_attack.json()) == 1
