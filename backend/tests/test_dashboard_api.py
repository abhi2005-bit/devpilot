from datetime import datetime

from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.main import app
from app.models import Issue, Project, User


client = TestClient(app)
DASHBOARD_SUMMARY_URL = "/api/v1/dashboard/summary"


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


def _create_issue(
    db,
    *,
    project_id: int,
    title: str,
    status: str,
    priority: str,
) -> Issue:
    issue = Issue(
        project_id=project_id,
        assignee_id=None,
        title=title,
        description=f"{title} description.",
        status=status,
        priority=priority,
        created_at=datetime.now(),
    )
    db.add(issue)
    return issue


def _authorization_headers(user: User) -> dict[str, str]:
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


def test_dashboard_summary_requires_authentication():
    response = client.get(DASHBOARD_SUMMARY_URL)

    assert response.status_code == 401


def test_dashboard_summary_is_scoped_to_authenticated_user(db):
    user_a = _create_user(
        db,
        name="Dashboard User A",
        email="dashboard.user.a@example.com",
    )
    user_b = _create_user(
        db,
        name="Dashboard User B",
        email="dashboard.user.b@example.com",
    )

    project_a = _create_project(
        db,
        name="User A Project",
        owner_id=user_a.id,
    )
    project_b = _create_project(
        db,
        name="User B Project",
        owner_id=user_b.id,
    )

    _create_issue(
        db,
        project_id=project_a.id,
        title="A TODO",
        status="TODO",
        priority="MEDIUM",
    )
    _create_issue(
        db,
        project_id=project_a.id,
        title="A in progress high",
        status="IN_PROGRESS",
        priority="HIGH",
    )
    _create_issue(
        db,
        project_id=project_a.id,
        title="A in review",
        status="IN_REVIEW",
        priority="LOW",
    )
    _create_issue(
        db,
        project_id=project_a.id,
        title="A done critical",
        status="DONE",
        priority="CRITICAL",
    )
    _create_issue(
        db,
        project_id=project_a.id,
        title="A done medium",
        status="DONE",
        priority="MEDIUM",
    )

    _create_issue(
        db,
        project_id=project_b.id,
        title="B TODO critical",
        status="TODO",
        priority="CRITICAL",
    )
    _create_issue(
        db,
        project_id=project_b.id,
        title="B in progress high",
        status="IN_PROGRESS",
        priority="HIGH",
    )
    _create_issue(
        db,
        project_id=project_b.id,
        title="B done",
        status="DONE",
        priority="LOW",
    )
    db.commit()

    expected_summary = {
        "active_projects": 1,
        "open_issues": 3,
        "completed_issues": 2,
        "blocked_or_review": 3,
        "critical_issues": 1,
    }
    headers = _authorization_headers(user_a)

    response = client.get(
        DASHBOARD_SUMMARY_URL,
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == expected_summary

    additional_project_b = _create_project(
        db,
        name="User B Additional Project",
        owner_id=user_b.id,
    )
    _create_issue(
        db,
        project_id=additional_project_b.id,
        title="Additional B TODO critical",
        status="TODO",
        priority="CRITICAL",
    )
    _create_issue(
        db,
        project_id=additional_project_b.id,
        title="Additional B in review high",
        status="IN_REVIEW",
        priority="HIGH",
    )
    _create_issue(
        db,
        project_id=additional_project_b.id,
        title="Additional B done",
        status="DONE",
        priority="MEDIUM",
    )
    db.commit()

    response_after_other_user_data = client.get(
        DASHBOARD_SUMMARY_URL,
        headers=headers,
    )

    assert response_after_other_user_data.status_code == 200
    assert response_after_other_user_data.json() == expected_summary


def test_dashboard_owner_can_access_summary(db):
    user_a = _create_user(
        db,
        name="Dashboard Owner",
        email="dashboard.owner@example.com",
    )
    project_a = _create_project(
        db,
        name="Owned Dashboard Project",
        owner_id=user_a.id,
    )
    _create_issue(
        db,
        project_id=project_a.id,
        title="Owned in review issue",
        status="IN_REVIEW",
        priority="MEDIUM",
    )
    db.commit()

    response = client.get(
        DASHBOARD_SUMMARY_URL,
        headers=_authorization_headers(user_a),
    )

    assert response.status_code == 200
    assert response.json() == {
        "active_projects": 1,
        "open_issues": 1,
        "completed_issues": 0,
        "blocked_or_review": 1,
        "critical_issues": 0,
    }