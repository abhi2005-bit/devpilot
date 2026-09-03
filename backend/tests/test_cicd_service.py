import asyncio
from datetime import datetime

from sqlalchemy import select

from app.models.cicd_run import CICDJob, CICDRun
from app.models.project import Project
from app.models.user import User
from app.schemas.github import GitHubJob, GitHubWorkflowRun
from app.services.cicd_service import CICDService


def _create_github_project(db):
    user = User(
        name="CI User",
        email="ci@example.com",
        created_at=datetime.now(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    project = Project(
        name="CI Project",
        description="Project with GitHub Actions.",
        owner_id=user.id,
        github_owner="octo-org",
        github_repo="devpilot",
        github_url="https://github.com/octo-org/devpilot",
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


def _workflow_run(
    *,
    run_id: int = 1001,
    status: str = "completed",
    conclusion: str | None = "success",
    url: str = "https://github.com/octo-org/devpilot/actions/runs/1001",
) -> GitHubWorkflowRun:
    return GitHubWorkflowRun(
        id=run_id,
        workflow_name="Build",
        branch="main",
        commit_sha="abc123",
        status=status,
        conclusion=conclusion,
        started_at="2026-09-03T10:00:00Z",
        completed_at="2026-09-03T10:05:00Z",
        url=url,
    )


def _job(
    *,
    job_id: int = 2001,
    name: str = "unit-tests",
    status: str = "completed",
    conclusion: str | None = "success",
) -> GitHubJob:
    return GitHubJob(
        id=job_id,
        name=name,
        status=status,
        conclusion=conclusion,
        started_at="2026-09-03T10:01:00Z",
        completed_at="2026-09-03T10:04:00Z",
        url=(
            "https://github.com/octo-org/devpilot/actions/"
            f"runs/1001/job/{job_id}"
        ),
    )


def _mock_github(monkeypatch, workflow_runs, jobs_by_run):
    async def get_workflow_runs(owner, repo, limit=10):
        return workflow_runs[:limit]

    async def get_jobs(owner, repo, run_id):
        return jobs_by_run.get(run_id, [])

    monkeypatch.setattr(
        "app.services.cicd_service.github_service.get_workflow_runs",
        get_workflow_runs,
    )
    monkeypatch.setattr(
        "app.services.cicd_service.github_service.get_jobs",
        get_jobs,
    )


def test_sync_inserts_workflow_run(db, monkeypatch):
    project = _create_github_project(db)
    service = CICDService()

    _mock_github(
        monkeypatch,
        [_workflow_run()],
        {1001: []},
    )

    runs = asyncio.run(
        service.sync_github_runs(db, str(project.id))
    )

    assert len(runs) == 1
    assert runs[0].github_run_id == 1001

    stored_run = db.scalar(
        select(CICDRun).where(
            CICDRun.github_run_id == 1001
        )
    )

    assert stored_run is not None
    assert stored_run.project_id == project.id


def test_sync_updates_existing_workflow_run(db, monkeypatch):
    project = _create_github_project(db)
    service = CICDService()

    _mock_github(
        monkeypatch,
        [_workflow_run(status="in_progress", conclusion=None)],
        {1001: []},
    )
    asyncio.run(service.sync_github_runs(db, str(project.id)))

    _mock_github(
        monkeypatch,
        [_workflow_run(status="completed", conclusion="failure")],
        {1001: []},
    )
    asyncio.run(service.sync_github_runs(db, str(project.id)))

    runs = db.scalars(select(CICDRun)).all()

    assert len(runs) == 1
    assert runs[0].status == "completed"
    assert runs[0].conclusion == "failure"


def test_sync_is_idempotent_for_workflow_runs(db, monkeypatch):
    project = _create_github_project(db)
    service = CICDService()

    _mock_github(
        monkeypatch,
        [_workflow_run()],
        {1001: []},
    )

    asyncio.run(service.sync_github_runs(db, str(project.id)))
    asyncio.run(service.sync_github_runs(db, str(project.id)))

    runs = db.scalars(select(CICDRun)).all()

    assert len(runs) == 1


def test_sync_inserts_jobs(db, monkeypatch):
    project = _create_github_project(db)
    service = CICDService()

    _mock_github(
        monkeypatch,
        [_workflow_run()],
        {1001: [_job()]},
    )

    asyncio.run(service.sync_github_runs(db, str(project.id)))

    jobs = db.scalars(select(CICDJob)).all()

    assert len(jobs) == 1
    assert jobs[0].github_job_id == 2001
    assert jobs[0].name == "unit-tests"


def test_sync_updates_existing_job(db, monkeypatch):
    project = _create_github_project(db)
    service = CICDService()

    _mock_github(
        monkeypatch,
        [_workflow_run()],
        {1001: [_job(status="in_progress", conclusion=None)]},
    )
    asyncio.run(service.sync_github_runs(db, str(project.id)))

    _mock_github(
        monkeypatch,
        [_workflow_run()],
        {
            1001: [
                _job(
                    name="unit-tests-renamed",
                    status="completed",
                    conclusion="failure",
                )
            ]
        },
    )
    asyncio.run(service.sync_github_runs(db, str(project.id)))

    jobs = db.scalars(select(CICDJob)).all()

    assert len(jobs) == 1
    assert jobs[0].name == "unit-tests-renamed"
    assert jobs[0].status == "completed"
    assert jobs[0].conclusion == "failure"


def test_sync_is_idempotent_for_jobs_and_counts_failures(db, monkeypatch):
    project = _create_github_project(db)
    service = CICDService()

    _mock_github(
        monkeypatch,
        [_workflow_run(conclusion="failure")],
        {
            1001: [
                _job(job_id=2001, conclusion="success"),
                _job(
                    job_id=2002,
                    name="integration-tests",
                    conclusion="failure",
                ),
            ]
        },
    )

    asyncio.run(service.sync_github_runs(db, str(project.id)))
    asyncio.run(service.sync_github_runs(db, str(project.id)))

    jobs = db.scalars(select(CICDJob)).all()
    run = db.scalar(
        select(CICDRun).where(
            CICDRun.github_run_id == 1001
        )
    )
    health = service.get_health(db, str(project.id))

    assert len(jobs) == 2
    assert run is not None
    assert run.failed_tests == 1
    assert health.failed_jobs == 1
    assert health.total_failed_tests == 1
