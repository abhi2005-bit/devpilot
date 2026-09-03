import asyncio
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import app
from app.models.cicd_run import CICDJob, CICDRun
from app.models.issue import Issue
from app.models.project import Project
from app.models.user import User
from app.schemas.github import GitHubCommit, GitHubPullRequest
from app.services.engineering_metrics_service import (
    EngineeringMetricsService,
)


client = TestClient(app)


def _create_project(db, *, connected: bool = True) -> Project:
    user = User(
        name="Metrics User",
        email="metrics@example.com",
        created_at=datetime.now(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    project = Project(
        name="Metrics Project",
        description="Project for metrics.",
        owner_id=user.id,
        github_owner="octo-org" if connected else None,
        github_repo="devpilot" if connected else None,
        github_url=(
            "https://github.com/octo-org/devpilot"
            if connected
            else None
        ),
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


def _issue(
    project_id: int,
    *,
    title: str,
    status: str,
    priority: str = "MEDIUM",
    assignee_id: int | None = 1,
    age_days: int = 1,
) -> Issue:
    return Issue(
        project_id=project_id,
        assignee_id=assignee_id,
        title=title,
        description=None,
        status=status,
        priority=priority,
        created_at=datetime.now() - timedelta(days=age_days),
    )


def _run(
    project_id: int,
    *,
    github_run_id: int,
    conclusion: str | None,
    status: str = "completed",
    age_days: int = 1,
) -> CICDRun:
    return CICDRun(
        project_id=project_id,
        github_run_id=github_run_id,
        workflow_name="Build",
        branch="main",
        commit_sha="abc123",
        status=status,
        conclusion=conclusion,
        failed_tests=1 if conclusion == "failure" else 0,
        started_at=datetime.now() - timedelta(days=age_days),
        completed_at=datetime.now() - timedelta(days=age_days),
        url=(
            "https://github.com/octo-org/devpilot/actions/"
            f"runs/{github_run_id}"
        ),
    )


def _job(
    project_id: int,
    run_id: int,
    *,
    github_job_id: int,
    conclusion: str | None,
) -> CICDJob:
    return CICDJob(
        project_id=project_id,
        cicd_run_id=run_id,
        github_job_id=github_job_id,
        name="unit-tests",
        status="completed",
        conclusion=conclusion,
        started_at=datetime.now() - timedelta(days=1),
        completed_at=datetime.now() - timedelta(days=1),
        url=(
            "https://github.com/octo-org/devpilot/actions/"
            f"runs/{run_id}/job/{github_job_id}"
        ),
    )


def test_engineering_metrics_calculate_from_database(db):
    project = _create_project(db)
    service = EngineeringMetricsService()

    db.add_all(
        [
            _issue(
                project.id,
                title="Todo",
                status="TODO",
                assignee_id=None,
                age_days=20,
            ),
            _issue(
                project.id,
                title="Progress",
                status="IN_PROGRESS",
                priority="HIGH",
            ),
            _issue(
                project.id,
                title="Review",
                status="IN_REVIEW",
                priority="CRITICAL",
            ),
            _issue(
                project.id,
                title="Done",
                status="DONE",
            ),
        ]
    )
    db.commit()

    successful_run = _run(
        project.id,
        github_run_id=1001,
        conclusion="success",
    )
    failed_run = _run(
        project.id,
        github_run_id=1002,
        conclusion="failure",
    )
    running_run = _run(
        project.id,
        github_run_id=1003,
        conclusion=None,
        status="in_progress",
    )

    db.add_all([successful_run, failed_run, running_run])
    db.commit()
    db.refresh(failed_run)

    db.add(
        _job(
            project.id,
            failed_run.id,
            github_job_id=2001,
            conclusion="failure",
        )
    )
    db.commit()

    metrics = asyncio.run(
        service.get_project_metrics(
            db,
            str(project.id),
            lookback_days=14,
        )
    )

    assert metrics.issues.total == 4
    assert metrics.issues.open == 3
    assert metrics.issues.completed == 1
    assert metrics.issues.completion_rate == 25.0
    assert metrics.issues.critical == 1
    assert metrics.issues.high_priority == 1
    assert metrics.issues.unassigned == 1
    assert metrics.issues.stale_open == 1

    assert metrics.cicd.total_runs == 3
    assert metrics.cicd.completed_runs == 2
    assert metrics.cicd.successful_runs == 1
    assert metrics.cicd.failed_runs == 1
    assert metrics.cicd.running_runs == 1
    assert metrics.cicd.success_rate == 50.0
    assert metrics.cicd.failure_rate == 50.0
    assert metrics.cicd.failed_jobs == 1
    assert metrics.cicd.recent_runs == 3
    assert metrics.cicd.recent_failures == 1

    assert metrics.github.connected is True
    assert metrics.github.fetched is False
    assert metrics.activity.active_work == 3
    assert metrics.activity.blocked_or_review_work == 3


def test_engineering_metrics_fetch_github_when_explicit(db, monkeypatch):
    project = _create_project(db)
    service = EngineeringMetricsService()

    async def get_commits(owner, repo, limit=25):
        return [
            GitHubCommit(
                sha="abc123",
                message="Add metrics",
                author="octocat",
                date="2026-09-03T10:00:00Z",
                url="https://github.com/octo-org/devpilot/commit/abc123",
            )
        ]

    async def get_pull_requests(owner, repo, limit=25):
        return [
            GitHubPullRequest(
                number=1,
                title="Open PR",
                state="open",
                author="octocat",
                created_at="2026-09-03T10:00:00Z",
                updated_at="2026-09-03T11:00:00Z",
                merged=False,
                url="https://github.com/octo-org/devpilot/pull/1",
            ),
            GitHubPullRequest(
                number=2,
                title="Merged PR",
                state="closed",
                author="octocat",
                created_at="2026-09-02T10:00:00Z",
                updated_at="2026-09-02T11:00:00Z",
                merged=True,
                url="https://github.com/octo-org/devpilot/pull/2",
            ),
        ]

    monkeypatch.setattr(
        "app.services.engineering_metrics_service.github_service.get_commits",
        get_commits,
    )
    monkeypatch.setattr(
        "app.services.engineering_metrics_service.github_service.get_pull_requests",
        get_pull_requests,
    )

    metrics = asyncio.run(
        service.get_project_metrics(
            db,
            str(project.id),
            include_github=True,
            github_limit=10,
        )
    )

    assert metrics.github.connected is True
    assert metrics.github.fetched is True
    assert metrics.github.commits == 1
    assert metrics.github.pull_requests == 2
    assert metrics.github.open_pull_requests == 1
    assert metrics.github.merged_pull_requests == 1
    assert metrics.github.closed_pull_requests == 0


def test_engineering_metrics_api_returns_project_metrics(db):
    project = _create_project(db, connected=False)
    db.add(
        _issue(
            project.id,
            title="Done",
            status="DONE",
        )
    )
    db.commit()

    response = client.get(
        f"/api/v1/projects/{project.id}/metrics"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["project_id"] == project.id
    assert data["issues"]["total"] == 1
    assert data["issues"]["completion_rate"] == 100.0
    assert data["github"]["connected"] is False
