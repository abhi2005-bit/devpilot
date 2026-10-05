from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import create_access_token
from app.main import app
from app.models import Project, User
from app.models.cicd_run import CICDJob, CICDRun
from app.schemas.github import GitHubJob, GitHubWorkflowRun


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


def _create_project(
    db,
    *,
    owner: User,
    name: str,
    connected: bool = True,
) -> Project:
    project = Project(
        name=name,
        description=f"{name} description.",
        owner_id=owner.id,
        created_at=datetime.now(),
        github_owner="octo-org" if connected else None,
        github_repo="devpilot" if connected else None,
        github_url=(
            "https://github.com/octo-org/devpilot"
            if connected
            else None
        ),
    )
    db.add(project)
    db.flush()
    return project


def _create_run(
    db,
    *,
    project: Project,
    github_run_id: int = 1001,
    status: str = "completed",
    conclusion: str | None = "success",
) -> CICDRun:
    run = CICDRun(
        project_id=project.id,
        github_run_id=github_run_id,
        workflow_name="Build",
        branch="main",
        commit_sha="abc123",
        status=status,
        conclusion=conclusion,
        failed_tests=0,
        started_at=datetime(2026, 9, 28, 10, 0),
        completed_at=datetime(2026, 9, 28, 10, 5),
        url=(
            "https://github.com/octo-org/devpilot/actions/runs/"
            f"{github_run_id}"
        ),
    )
    db.add(run)
    db.flush()
    return run


def _create_job(
    db,
    *,
    project: Project,
    run: CICDRun,
    github_job_id: int = 2001,
) -> CICDJob:
    job = CICDJob(
        project_id=project.id,
        cicd_run_id=run.id,
        github_job_id=github_job_id,
        name="unit-tests",
        status="completed",
        conclusion="failure",
        started_at=datetime(2026, 9, 28, 10, 1),
        completed_at=datetime(2026, 9, 28, 10, 4),
        url=(
            "https://github.com/octo-org/devpilot/actions/runs/"
            f"{run.github_run_id}/job/{github_job_id}"
        ),
    )
    db.add(job)
    db.flush()
    return job


def _headers(user: User) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {create_access_token(user.id)}",
    }


def _manual_run_payload(project_id: int) -> dict:
    return {
        "project_id": project_id,
        "github_run_id": None,
        "workflow_name": "Manual Build",
        "branch": "main",
        "commit_sha": "def456",
        "status": "completed",
        "conclusion": "success",
        "failed_tests": 0,
        "started_at": "2026-09-29T10:00:00",
        "completed_at": "2026-09-29T10:05:00",
        "url": "https://example.test/manual-run",
    }


def _request_endpoint(
    method: str,
    project_id: int,
    suffix: str,
    *,
    run_id: int,
    headers: dict[str, str] | None = None,
):
    request_kwargs = {}
    if headers is not None:
        request_kwargs["headers"] = headers

    if method == "POST" and suffix == "":
        request_kwargs["json"] = _manual_run_payload(project_id)

    path = f"/api/v1/projects/{project_id}/cicd{suffix}"
    return client.request(method, path, **request_kwargs)


ENDPOINTS = [
    pytest.param("GET", "", id="list-runs"),
    pytest.param("GET", "/health", id="cicd-health"),
    pytest.param("GET", "/{run_id}", id="run-detail"),
    pytest.param("GET", "/{run_id}/jobs", id="run-jobs"),
    pytest.param("POST", "/sync", id="sync"),
    pytest.param("POST", "", id="manual-run-create"),
]


@pytest.mark.parametrize(("method", "suffix"), ENDPOINTS)
def test_cicd_endpoints_require_authentication(
    db,
    method: str,
    suffix: str,
):
    owner = _create_user(
        db,
        name="Unauthenticated CI Owner",
        email=f"cicd-unauth-{suffix or 'runs'}-{method}@example.com",
    )
    project = _create_project(
        db,
        owner=owner,
        name="Unauthenticated CI Project",
    )
    run = _create_run(db, project=project)
    _create_job(db, project=project, run=run)
    db.commit()

    response = _request_endpoint(
        method,
        project.id,
        suffix.format(run_id=run.id),
        run_id=run.id,
    )

    assert response.status_code == 401


@pytest.mark.parametrize(("method", "suffix"), ENDPOINTS)
def test_non_owner_cannot_access_cicd_endpoints(
    db,
    method: str,
    suffix: str,
):
    requester = _create_user(
        db,
        name="CI Requester",
        email=f"cicd-nonowner-{suffix or 'runs'}-{method}@example.com",
    )
    owner = _create_user(
        db,
        name="CI Project Owner",
        email=f"cicd-owner-{suffix or 'runs'}-{method}@example.com",
    )
    project = _create_project(
        db,
        owner=owner,
        name="Owner CI Project",
    )
    run = _create_run(db, project=project)
    _create_job(db, project=project, run=run)
    db.commit()

    response = _request_endpoint(
        method,
        project.id,
        suffix.format(run_id=run.id),
        run_id=run.id,
        headers=_headers(requester),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}


def test_project_owner_can_list_cicd_runs(db):
    owner = _create_user(
        db,
        name="Run List Owner",
        email="cicd-run-list-owner@example.com",
    )
    project = _create_project(
        db,
        owner=owner,
        name="Run List Project",
    )
    run = _create_run(db, project=project)
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project.id}/cicd",
        headers=_headers(owner),
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == run.id
    assert response.json()[0]["github_run_id"] == run.github_run_id


def test_project_owner_can_read_cicd_health(db):
    owner = _create_user(
        db,
        name="CI Health Owner",
        email="cicd-health-owner@example.com",
    )
    project = _create_project(
        db,
        owner=owner,
        name="CI Health Project",
    )
    run = _create_run(db, project=project)
    run.failed_tests = 1
    _create_job(db, project=project, run=run)
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project.id}/cicd/health",
        headers=_headers(owner),
    )

    assert response.status_code == 200
    assert response.json() == {
        "total_runs": 1,
        "successful_runs": 1,
        "failed_runs": 0,
        "running_runs": 0,
        "success_rate": 100.0,
        "failure_rate": 0.0,
        "total_failed_tests": 1,
        "failed_jobs": 1,
    }


def test_project_owner_can_read_run_detail(db):
    owner = _create_user(
        db,
        name="Run Detail Owner",
        email="cicd-run-detail-owner@example.com",
    )
    project = _create_project(
        db,
        owner=owner,
        name="Run Detail Project",
    )
    run = _create_run(db, project=project)
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project.id}/cicd/{run.id}",
        headers=_headers(owner),
    )

    assert response.status_code == 200
    assert response.json()["id"] == run.id
    assert response.json()["project_id"] == project.id


def test_project_owner_can_read_run_jobs(db):
    owner = _create_user(
        db,
        name="Run Jobs Owner",
        email="cicd-run-jobs-owner@example.com",
    )
    project = _create_project(
        db,
        owner=owner,
        name="Run Jobs Project",
    )
    run = _create_run(db, project=project)
    job = _create_job(db, project=project, run=run)
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project.id}/cicd/{run.id}/jobs",
        headers=_headers(owner),
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == job.id
    assert response.json()[0]["github_job_id"] == job.github_job_id


def test_non_owner_sync_is_rejected_before_service_or_persistence(
    db,
    monkeypatch,
):
    requester = _create_user(
        db,
        name="Sync Requester",
        email="cicd-sync-nonowner-requester@example.com",
    )
    owner = _create_user(
        db,
        name="Sync Project Owner",
        email="cicd-sync-nonowner-owner@example.com",
    )
    project = _create_project(
        db,
        owner=owner,
        name="Protected Sync Project",
    )
    db.commit()
    sync_called = False

    async def sync_github_runs(*args, **kwargs):
        nonlocal sync_called
        sync_called = True
        return []

    monkeypatch.setattr(
        "app.api.routes.cicd.cicd_service.sync_github_runs",
        sync_github_runs,
    )

    response = client.post(
        f"/api/v1/projects/{project.id}/cicd/sync",
        headers=_headers(requester),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}
    assert sync_called is False
    assert db.scalars(select(CICDRun)).all() == []
    assert db.scalars(select(CICDJob)).all() == []


def test_project_owner_can_sync_github_actions(db, monkeypatch):
    owner = _create_user(
        db,
        name="Sync Owner",
        email="cicd-sync-owner@example.com",
    )
    project = _create_project(
        db,
        owner=owner,
        name="Sync Project",
    )
    workflow_run = GitHubWorkflowRun(
        id=3001,
        workflow_name="Build",
        branch="main",
        commit_sha="fedcba",
        status="completed",
        conclusion="failure",
        started_at="2026-09-29T10:00:00Z",
        completed_at="2026-09-29T10:05:00Z",
        url="https://github.com/octo-org/devpilot/actions/runs/3001",
    )
    github_job = GitHubJob(
        id=4001,
        name="unit-tests",
        status="completed",
        conclusion="failure",
        started_at="2026-09-29T10:01:00Z",
        completed_at="2026-09-29T10:04:00Z",
        url="https://github.com/octo-org/devpilot/actions/runs/3001/job/4001",
    )
    calls = []

    async def get_workflow_runs(github_owner, github_repo, limit=10, token=None):
        calls.append(("runs", github_owner, github_repo, limit))
        return [workflow_run]

    async def get_jobs(github_owner, github_repo, run_id, token=None):
        calls.append(("jobs", github_owner, github_repo, run_id))
        return [github_job]

    monkeypatch.setattr(
        "app.services.cicd_service.github_service.get_workflow_runs",
        get_workflow_runs,
    )
    monkeypatch.setattr(
        "app.services.cicd_service.github_service.get_jobs",
        get_jobs,
    )
    db.commit()

    response = client.post(
        f"/api/v1/projects/{project.id}/cicd/sync",
        headers=_headers(owner),
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["github_run_id"] == 3001
    assert response.json()[0]["failed_tests"] == 1
    assert calls == [
        ("runs", "octo-org", "devpilot", 10),
        ("jobs", "octo-org", "devpilot", 3001),
    ]
    assert db.scalars(select(CICDRun)).all()[0].github_run_id == 3001
    assert db.scalars(select(CICDJob)).all()[0].github_job_id == 4001


def test_non_owner_cannot_manually_create_run(db):
    requester = _create_user(
        db,
        name="Manual Run Requester",
        email="cicd-manual-nonowner-requester@example.com",
    )
    owner = _create_user(
        db,
        name="Manual Run Owner",
        email="cicd-manual-nonowner-owner@example.com",
    )
    project = _create_project(
        db,
        owner=owner,
        name="Protected Manual Run Project",
    )
    db.commit()

    response = client.post(
        f"/api/v1/projects/{project.id}/cicd",
        headers=_headers(requester),
        json=_manual_run_payload(project.id),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found."}
    assert db.scalars(select(CICDRun)).all() == []


def test_project_owner_can_manually_create_run(db):
    owner = _create_user(
        db,
        name="Manual Run Owner",
        email="cicd-manual-owner@example.com",
    )
    project = _create_project(
        db,
        owner=owner,
        name="Manual Run Project",
    )
    db.commit()

    response = client.post(
        f"/api/v1/projects/{project.id}/cicd",
        headers=_headers(owner),
        json=_manual_run_payload(project.id),
    )

    assert response.status_code == 201
    assert response.json()["project_id"] == project.id
    assert response.json()["workflow_name"] == "Manual Build"
    stored_runs = db.scalars(select(CICDRun)).all()
    assert len(stored_runs) == 1
    assert stored_runs[0].project_id == project.id


def test_run_id_from_another_project_is_not_accessible(db):
    owner = _create_user(
        db,
        name="Two Project Owner",
        email="cicd-cross-project-owner@example.com",
    )
    project_a = _create_project(
        db,
        owner=owner,
        name="Project A",
    )
    project_b = _create_project(
        db,
        owner=owner,
        name="Project B",
    )
    run_b = _create_run(db, project=project_b, github_run_id=5001)
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project_a.id}/cicd/{run_b.id}",
        headers=_headers(owner),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "CI/CD run not found"}