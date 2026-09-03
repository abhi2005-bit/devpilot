import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.services.engineering_health_service import (
    EngineeringHealthService,
)


def make_metrics(
    *,
    project_id=7,
    issues=None,
    cicd=None,
    github=None,
    activity=None,
    lookback_days=14,
    github_limit=25,
):
    if issues is None:
        issues = SimpleNamespace(
            total=1,
            open=1,
            completed=0,
            completion_rate=0.0,
            todo=1,
            in_progress=0,
            in_review=0,
            critical=0,
            high_priority=0,
            unassigned=0,
            stale_open=0,
        )

    if cicd is None:
        cicd = SimpleNamespace(
            total_runs=12,
            completed_runs=12,
            successful_runs=11,
            failed_runs=1,
            running_runs=0,
            success_rate=91.67,
            failure_rate=8.33,
            failed_jobs=0,
            recent_runs=12,
            recent_failures=1,
        )

    if github is None:
        github = SimpleNamespace(
            connected=True,
            fetched=True,
            commits=25,
            pull_requests=25,
            open_pull_requests=21,
            merged_pull_requests=4,
            closed_pull_requests=0,
        )

    if activity is None:
        activity = SimpleNamespace(
            active_work=1,
            blocked_or_review_work=0,
            completed_work=0,
            recent_cicd_activity=12,
        )

    return SimpleNamespace(
        project_id=project_id,
        generated_at=None,
        lookback_days=lookback_days,
        github_limit=github_limit,
        issues=issues,
        cicd=cicd,
        github=github,
        activity=activity,
    )


@pytest.fixture
def service():
    return EngineeringHealthService()


def test_health_calculation_matches_project_7_scenario(
    service,
    monkeypatch,
):
    metrics = make_metrics()

    mocked_get_project_metrics = AsyncMock(
        return_value=metrics,
    )

    monkeypatch.setattr(
        "app.services.engineering_health_service.engineering_metrics_service.get_project_metrics",
        mocked_get_project_metrics,
    )

    result = asyncio.run(
        service.get_project_health(
            db=None,
            project_id="7",
        )
    )

    assert result.project_id == 7
    assert result.score == 69.91
    assert result.status == "needs_attention"

    assert result.issue_health.score == 50.0
    assert result.issue_health.weight == 0.30
    assert result.issue_health.weighted_score == 15.0

    assert result.cicd_reliability.score == 86.67
    assert result.cicd_reliability.weight == 0.35
    assert result.cicd_reliability.weighted_score == 30.33

    assert result.delivery_activity.score == 68.0
    assert result.delivery_activity.weight == 0.20
    assert result.delivery_activity.weighted_score == 13.6

    assert result.github_activity.score == 73.2
    assert result.github_activity.weight == 0.15
    assert result.github_activity.weighted_score == 10.98

    mocked_get_project_metrics.assert_awaited_once_with(
        None,
        "7",
        include_github=True,
        lookback_days=14,
        github_limit=25,
    )


def test_health_is_deterministic(
    service,
    monkeypatch,
):
    metrics = make_metrics()

    monkeypatch.setattr(
        "app.services.engineering_health_service.engineering_metrics_service.get_project_metrics",
        AsyncMock(return_value=metrics),
    )

    first = asyncio.run(
        service.get_project_health(
            db=None,
            project_id="7",
        )
    )

    second = asyncio.run(
        service.get_project_health(
            db=None,
            project_id="7",
        )
    )

    assert first.score == second.score
    assert first.status == second.status

    assert (
        first.issue_health.score
        == second.issue_health.score
    )

    assert (
        first.cicd_reliability.score
        == second.cicd_reliability.score
    )

    assert (
        first.delivery_activity.score
        == second.delivery_activity.score
    )

    assert (
        first.github_activity.score
        == second.github_activity.score
    )


def test_no_issues_uses_neutral_issue_score(
    service,
    monkeypatch,
):
    metrics = make_metrics(
        issues=SimpleNamespace(
            total=0,
            open=0,
            completed=0,
            completion_rate=0.0,
            todo=0,
            in_progress=0,
            in_review=0,
            critical=0,
            high_priority=0,
            unassigned=0,
            stale_open=0,
        )
    )

    monkeypatch.setattr(
        "app.services.engineering_health_service.engineering_metrics_service.get_project_metrics",
        AsyncMock(return_value=metrics),
    )

    result = asyncio.run(
        service.get_project_health(
            db=None,
            project_id="7",
        )
    )

    assert result.issue_health.score == 75.0


def test_no_completed_cicd_runs_uses_neutral_cicd_score(
    service,
    monkeypatch,
):
    metrics = make_metrics(
        cicd=SimpleNamespace(
            total_runs=0,
            completed_runs=0,
            successful_runs=0,
            failed_runs=0,
            running_runs=0,
            success_rate=0.0,
            failure_rate=0.0,
            failed_jobs=0,
            recent_runs=0,
            recent_failures=0,
        )
    )

    monkeypatch.setattr(
        "app.services.engineering_health_service.engineering_metrics_service.get_project_metrics",
        AsyncMock(return_value=metrics),
    )

    result = asyncio.run(
        service.get_project_health(
            db=None,
            project_id="7",
        )
    )

    assert result.cicd_reliability.score == 75.0


def test_missing_github_data_uses_neutral_github_score(
    service,
    monkeypatch,
):
    metrics = make_metrics(
        github=SimpleNamespace(
            connected=False,
            fetched=False,
            commits=0,
            pull_requests=0,
            open_pull_requests=0,
            merged_pull_requests=0,
            closed_pull_requests=0,
        )
    )

    monkeypatch.setattr(
        "app.services.engineering_health_service.engineering_metrics_service.get_project_metrics",
        AsyncMock(return_value=metrics),
    )

    result = asyncio.run(
        service.get_project_health(
            db=None,
            project_id="7",
        )
    )

    assert result.github_activity.score == 75.0


def test_health_score_stays_within_bounds(
    service,
    monkeypatch,
):
    metrics = make_metrics(
        issues=SimpleNamespace(
            total=100,
            open=100,
            completed=0,
            completion_rate=0.0,
            todo=100,
            in_progress=0,
            in_review=0,
            critical=100,
            high_priority=100,
            unassigned=100,
            stale_open=100,
        ),
        cicd=SimpleNamespace(
            total_runs=100,
            completed_runs=100,
            successful_runs=0,
            failed_runs=100,
            running_runs=0,
            success_rate=0.0,
            failure_rate=100.0,
            failed_jobs=100,
            recent_runs=100,
            recent_failures=100,
        ),
        github=SimpleNamespace(
            connected=True,
            fetched=True,
            commits=0,
            pull_requests=100,
            open_pull_requests=100,
            merged_pull_requests=0,
            closed_pull_requests=0,
        ),
        activity=SimpleNamespace(
            active_work=100,
            blocked_or_review_work=100,
            completed_work=0,
            recent_cicd_activity=0,
        ),
    )

    monkeypatch.setattr(
        "app.services.engineering_health_service.engineering_metrics_service.get_project_metrics",
        AsyncMock(return_value=metrics),
    )

    result = asyncio.run(
        service.get_project_health(
            db=None,
            project_id="7",
        )
    )

    assert 0 <= result.score <= 100

    assert 0 <= result.issue_health.score <= 100
    assert 0 <= result.cicd_reliability.score <= 100
    assert 0 <= result.delivery_activity.score <= 100
    assert 0 <= result.github_activity.score <= 100


def test_health_forwards_custom_parameters(
    service,
    monkeypatch,
):
    metrics = make_metrics(
        lookback_days=7,
        github_limit=10,
    )

    mocked_get_project_metrics = AsyncMock(
        return_value=metrics,
    )

    monkeypatch.setattr(
        "app.services.engineering_health_service.engineering_metrics_service.get_project_metrics",
        mocked_get_project_metrics,
    )

    result = asyncio.run(
        service.get_project_health(
            db=None,
            project_id="7",
            include_github=False,
            lookback_days=7,
            github_limit=10,
        )
    )

    assert result.lookback_days == 7

    mocked_get_project_metrics.assert_awaited_once_with(
        None,
        "7",
        include_github=False,
        lookback_days=7,
        github_limit=10,
    )