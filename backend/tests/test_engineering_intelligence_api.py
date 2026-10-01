from datetime import datetime, timedelta
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.core.security import create_access_token
from app.main import app
from app.models import Issue, Project, User
from app.models.engineering_health_snapshot import EngineeringHealthSnapshot


client = TestClient(app)

ENDPOINTS = [
    pytest.param(
        "intelligence-context",
        "/api/v1/projects/{project_id}/intelligence-context",
        id="intelligence-context",
    ),
    pytest.param(
        "metrics",
        "/api/v1/projects/{project_id}/metrics",
        id="metrics",
    ),
    pytest.param(
        "engineering-health",
        "/api/v1/projects/{project_id}/engineering-health",
        id="engineering-health",
    ),
    pytest.param(
        "health-history",
        "/api/v1/projects/{project_id}/engineering-health/history",
        id="health-history",
    ),
    pytest.param(
        "engineering-signals",
        "/api/v1/projects/{project_id}/engineering-signals",
        id="engineering-signals",
    ),
]


def _create_user(db, *, name: str, email: str) -> User:
    user = User(
        name=name,
        email=email,
        created_at=datetime.now(),
    )
    db.add(user)
    db.flush()
    return user


def _create_project(db, *, owner_id: int, name: str) -> Project:
    project = Project(
        name=name,
        description=f"{name} description.",
        owner_id=owner_id,
        created_at=datetime.now(),
    )
    db.add(project)
    db.flush()
    return project


def _create_issue(db, *, project_id: int) -> Issue:
    issue = Issue(
        project_id=project_id,
        assignee_id=None,
        title="Critical open issue",
        description="Seeded for engineering intelligence API tests.",
        status="TODO",
        priority="CRITICAL",
        created_at=datetime.now() - timedelta(days=2),
    )
    db.add(issue)
    return issue


def _authorization_headers(user: User) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {create_access_token(user.id)}",
    }


def _project_endpoint(endpoint_path: str, project_id: int) -> str:
    return endpoint_path.format(project_id=project_id)


@pytest.mark.parametrize(("endpoint_name", "endpoint_path"), ENDPOINTS)
def test_engineering_endpoints_require_authentication(
    db,
    endpoint_name: str,
    endpoint_path: str,
):
    user = _create_user(
        db,
        name="Endpoint Owner",
        email="endpoint.owner@example.com",
    )
    project = _create_project(
        db,
        owner_id=user.id,
        name="Endpoint Owner Project",
    )
    db.commit()

    response = client.get(
        _project_endpoint(endpoint_path, project.id),
    )

    assert response.status_code == 401, endpoint_name


@pytest.mark.parametrize(("endpoint_name", "endpoint_path"), ENDPOINTS)
def test_project_owner_can_access_engineering_endpoints(
    db,
    endpoint_name: str,
    endpoint_path: str,
):
    user = _create_user(
        db,
        name="Endpoint Owner",
        email="endpoint.owner@example.com",
    )
    project = _create_project(
        db,
        owner_id=user.id,
        name="Endpoint Owner Project",
    )
    _create_issue(db, project_id=project.id)

    if endpoint_name == "health-history":
        db.add(
            EngineeringHealthSnapshot(
                project_id=project.id,
                generated_at=datetime.utcnow(),
                score=91.5,
                status="healthy",
                issue_health=90.0,
                cicd_reliability=92.0,
                delivery_activity=93.0,
                github_activity=91.0,
                lookback_days=14,
            )
        )
    db.commit()

    response = client.get(
        _project_endpoint(endpoint_path, project.id),
        headers=_authorization_headers(user),
    )

    assert response.status_code == 200, response.text
    data = response.json()
    assert data["project_id"] == project.id

    if endpoint_name == "intelligence-context":
        assert data["metrics"]["issues"]["total"] == 1
        assert data["health"]["project_id"] == project.id
        assert data["signals"]["project_id"] == project.id
    elif endpoint_name == "metrics":
        assert data["issues"]["total"] == 1
        assert data["issues"]["critical"] == 1
    elif endpoint_name == "engineering-health":
        assert data["score"] >= 0
        snapshot_count = db.scalar(
            select(func.count(EngineeringHealthSnapshot.id)).where(
                EngineeringHealthSnapshot.project_id == project.id
            )
        )
        assert snapshot_count == 1
    elif endpoint_name == "health-history":
        assert len(data["snapshots"]) == 1
        assert data["snapshots"][0]["score"] == 91.5
    else:
        assert any(
            signal["category"] == "issues"
            and signal["title"] == "Critical Issues Require Attention"
            for signal in data["signals"]
        )


@pytest.mark.parametrize(("endpoint_name", "endpoint_path"), ENDPOINTS)
def test_non_owner_cannot_access_engineering_endpoints(
    db,
    endpoint_name: str,
    endpoint_path: str,
):
    requester = _create_user(
        db,
        name="Requesting User",
        email="requesting.user@example.com",
    )
    owner = _create_user(
        db,
        name="Project Owner",
        email="project.owner@example.com",
    )
    project = _create_project(
        db,
        owner_id=owner.id,
        name="Private Project",
    )
    db.commit()

    response = client.get(
        _project_endpoint(endpoint_path, project.id),
        headers=_authorization_headers(requester),
    )

    assert response.status_code == 404, endpoint_name
    assert response.json() == {"detail": "Project not found."}


def test_non_owner_health_request_does_not_run_service_or_persist_snapshot(
    db,
    monkeypatch,
):
    requester = _create_user(
        db,
        name="Requesting User",
        email="requesting.user@example.com",
    )
    owner = _create_user(
        db,
        name="Project Owner",
        email="project.owner@example.com",
    )
    project = _create_project(
        db,
        owner_id=owner.id,
        name="Private Health Project",
    )
    db.commit()

    mock_get_project_health = AsyncMock()
    monkeypatch.setattr(
        "app.api.routes.health.engineering_health_service.get_project_health",
        mock_get_project_health,
    )

    response = client.get(
        f"/api/v1/projects/{project.id}/engineering-health",
        headers=_authorization_headers(requester),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}
    mock_get_project_health.assert_not_awaited()

    snapshot_count = db.scalar(
        select(func.count(EngineeringHealthSnapshot.id)).where(
            EngineeringHealthSnapshot.project_id == project.id
        )
    )
    assert snapshot_count == 0