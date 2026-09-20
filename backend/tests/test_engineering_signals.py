from datetime import datetime

import pytest

from app.schemas.metrics import (
    ActivityEngineeringMetrics,
    CICDEngineeringMetrics,
    EngineeringMetrics,
    GitHubEngineeringMetrics,
    IssueEngineeringMetrics,
)
from app.services.engineering_signal_service import (
    engineering_signal_service,
)


def make_metrics(
    *,
    critical: int = 0,
    high_priority: int = 0,
    stale_open: int = 0,
    unassigned: int = 0,
    total_issues: int = 10,
    completed_issues: int = 5,
    completion_rate: float = 50.0,
    completed_runs: int = 10,
    failed_runs: int = 0,
    failure_rate: float = 0.0,
    recent_failures: int = 0,
    failed_jobs: int = 0,
    commits: int = 0,
    pull_requests: int = 0,
    open_pull_requests: int = 0,
    merged_pull_requests: int = 0,
    github_connected: bool = True,
    github_fetched: bool = True,
    active_work: int = 2,
    blocked_or_review_work: int = 0,
    completed_work: int = 5,
    recent_cicd_activity: int = 2,
) -> EngineeringMetrics:
    return EngineeringMetrics(
        project_id=1,
        generated_at=datetime.now(),
        lookback_days=14,
        github_limit=25,
        issues=IssueEngineeringMetrics(
            total=total_issues,
            open=max(total_issues - completed_issues, 0),
            completed=completed_issues,
            completion_rate=completion_rate,
            todo=2,
            in_progress=2,
            in_review=1,
            critical=critical,
            high_priority=high_priority,
            unassigned=unassigned,
            stale_open=stale_open,
            calculation_basis=[],
        ),
        cicd=CICDEngineeringMetrics(
            total_runs=completed_runs,
            completed_runs=completed_runs,
            successful_runs=completed_runs - failed_runs,
            failed_runs=failed_runs,
            running_runs=0,
            success_rate=100.0 - failure_rate,
            failure_rate=failure_rate,
            failed_jobs=failed_jobs,
            recent_runs=recent_cicd_activity,
            recent_failures=recent_failures,
            calculation_basis=[],
        ),
        github=GitHubEngineeringMetrics(
            connected=github_connected,
            fetched=github_fetched,
            commits=commits,
            pull_requests=pull_requests,
            open_pull_requests=open_pull_requests,
            merged_pull_requests=merged_pull_requests,
            closed_pull_requests=0,
            calculation_basis=[],
            error=None,
        ),
        activity=ActivityEngineeringMetrics(
            active_work=active_work,
            blocked_or_review_work=blocked_or_review_work,
            completed_work=completed_work,
            recent_cicd_activity=recent_cicd_activity,
            calculation_basis=[],
        ),
    )


def test_critical_issue_creates_risk_signal():
    metrics = make_metrics(
        critical=3,
    )

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    titles = [signal.title for signal in result.signals]

    assert "Critical Issues Require Attention" in titles

    signal = next(
        signal
        for signal in result.signals
        if signal.title == "Critical Issues Require Attention"
    )

    assert signal.category == "issues"
    assert signal.type == "risk"
    assert signal.severity == "risk"


def test_stale_issue_creates_warning_or_risk_signal():
    metrics = make_metrics(
        stale_open=2,
    )

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    signal = next(
        signal
        for signal in result.signals
        if signal.title == "Stale Open Issues Detected"
    )

    assert signal.category == "issues"
    assert signal.type == "risk"
    assert signal.severity == "warning"


def test_low_completion_rate_creates_risk_signal():
    metrics = make_metrics(
        total_issues=10,
        completed_issues=2,
        completion_rate=20.0,
    )

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    signal = next(
        signal
        for signal in result.signals
        if signal.title == "Low Issue Completion Rate"
    )

    assert signal.severity == "risk"
    assert signal.value == "20.00%"


def test_high_cicd_failure_rate_creates_risk_signal():
    metrics = make_metrics(
        completed_runs=20,
        failed_runs=5,
        failure_rate=25.0,
    )

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    signal = next(
        signal
        for signal in result.signals
        if signal.title == "High CI/CD Failure Rate"
    )

    assert signal.category == "cicd"
    assert signal.severity == "risk"
    assert signal.value == "25.00%"


def test_recent_cicd_failures_create_signal():
    metrics = make_metrics(
        recent_failures=3,
    )

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    signal = next(
        signal
        for signal in result.signals
        if signal.title == "Recent CI/CD Failures Detected"
    )

    assert signal.category == "cicd"
    assert signal.severity == "risk"


def test_open_pr_backlog_creates_signal():
    metrics = make_metrics(
        commits=10,
        pull_requests=25,
        open_pull_requests=21,
        merged_pull_requests=2,
    )

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    signal = next(
        signal
        for signal in result.signals
        if signal.title == "Large Open Pull Request Backlog"
    )

    assert signal.category == "github"
    assert signal.severity == "risk"
    assert signal.value == "21"


def test_active_github_development_creates_positive_signal():
    metrics = make_metrics(
        commits=10,
    )

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    signal = next(
        signal
        for signal in result.signals
        if signal.title == "Active GitHub Development"
    )

    assert signal.category == "github"
    assert signal.type == "positive"
    assert signal.severity == "positive"


def test_unconnected_github_creates_observation():
    metrics = make_metrics(
        github_connected=False,
        github_fetched=False,
    )

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    signal = next(
        signal
        for signal in result.signals
        if signal.title == "GitHub Repository Not Connected"
    )

    assert signal.category == "github"
    assert signal.type == "observation"
    assert signal.severity == "neutral"


def test_blocked_work_creates_delivery_signal():
    metrics = make_metrics(
        blocked_or_review_work=4,
    )

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    signal = next(
        signal
        for signal in result.signals
        if signal.title == "Delivery Work Needs Attention"
    )

    assert signal.category == "delivery"
    assert signal.severity == "risk"


def test_completed_work_creates_positive_signal():
    metrics = make_metrics(
        completed_work=5,
    )

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    signal = next(
        signal
        for signal in result.signals
        if signal.title == "Completed Work Is Present"
    )

    assert signal.category == "delivery"
    assert signal.type == "positive"
    assert signal.severity == "positive"


def test_signal_generation_preserves_project_id():
    metrics = make_metrics()

    result = engineering_signal_service.get_project_signals(
        metrics=metrics,
    )

    assert result.project_id == metrics.project_id
    assert result.generated_at
    assert isinstance(result.signals, list)
