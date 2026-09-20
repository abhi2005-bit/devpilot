import asyncio
from unittest.mock import AsyncMock

from app.schemas.health import EngineeringHealth
from app.schemas.intelligence import EngineeringIntelligenceContext
from app.schemas.metrics import (
    ActivityEngineeringMetrics,
    CICDEngineeringMetrics,
    EngineeringMetrics,
    GitHubEngineeringMetrics,
    IssueEngineeringMetrics,
    MetricBasis,
)
from app.schemas.signals import EngineeringSignals
from app.services.intelligence_context_service import (
    IntelligenceContextService,
)


def make_metrics() -> EngineeringMetrics:
    basis = [MetricBasis(label="test", value="test")]

    return EngineeringMetrics(
        project_id=7,
        generated_at="2026-09-17T00:00:00",
        lookback_days=14,
        github_limit=25,
        issues=IssueEngineeringMetrics(
            total=4,
            open=4,
            completed=0,
            completion_rate=0,
            todo=2,
            in_progress=2,
            in_review=0,
            critical=1,
            high_priority=1,
            unassigned=1,
            stale_open=1,
            calculation_basis=basis,
        ),
        cicd=CICDEngineeringMetrics(
            total_runs=5,
            completed_runs=5,
            successful_runs=4,
            failed_runs=1,
            running_runs=0,
            success_rate=80,
            failure_rate=20,
            failed_jobs=1,
            recent_runs=5,
            recent_failures=1,
            calculation_basis=basis,
        ),
        github=GitHubEngineeringMetrics(
            connected=True,
            fetched=True,
            commits=25,
            pull_requests=25,
            open_pull_requests=17,
            merged_pull_requests=2,
            closed_pull_requests=6,
            calculation_basis=basis,
        ),
        activity=ActivityEngineeringMetrics(
            active_work=4,
            blocked_or_review_work=1,
            completed_work=0,
            recent_cicd_activity=5,
            calculation_basis=basis,
        ),
    )


def make_health() -> EngineeringHealth:
    basis = ["test"]

    from datetime import datetime

    from app.schemas.health import (
        HealthComponent,
        HealthEvidence,
    )

    component = HealthComponent(
        score=70,
        weight=0.25,
        weighted_score=17.5,
        calculation_basis=basis,
    )

    return EngineeringHealth(
        project_id=7,
        score=70,
        status="needs_attention",
        generated_at=datetime.now(),
        lookback_days=14,
        issue_health=component,
        cicd_reliability=component,
        delivery_activity=component,
        github_activity=component,
        evidence=[
            HealthEvidence(
                label="Test",
                value="Test",
                impact="neutral",
            )
        ],
    )


def test_build_project_context_combines_engineering_layers():
    service = IntelligenceContextService()
    metrics = make_metrics()
    health = make_health()

    mock_metrics = AsyncMock(return_value=metrics)
    mock_health = AsyncMock(return_value=health)

    from unittest.mock import patch

    with (
        patch(
            "app.services.intelligence_context_service."
            "engineering_metrics_service.get_project_metrics",
            mock_metrics,
        ),
        patch(
            "app.services.intelligence_context_service."
            "engineering_health_service.get_project_health",
            mock_health,
        ),
    ):
        result = asyncio.run(
            service.build_project_context(
                db=None,
                project_id="7",
            )
        )

    assert isinstance(result, EngineeringIntelligenceContext)
    assert result.project_id == 7
    assert result.health.score == 70
    assert result.metrics.issues.completion_rate == 0
    assert result.signals.project_id == 7
    assert len(result.context_facts) > 0


def test_context_contains_cross_system_facts():
    service = IntelligenceContextService()
    metrics = make_metrics()
    health = make_health()

    from unittest.mock import patch

    with (
        patch(
            "app.services.intelligence_context_service."
            "engineering_metrics_service.get_project_metrics",
            AsyncMock(return_value=metrics),
        ),
        patch(
            "app.services.intelligence_context_service."
            "engineering_health_service.get_project_health",
            AsyncMock(return_value=health),
        ),
    ):
        result = asyncio.run(
            service.build_project_context(
                db=None,
                project_id="7",
            )
        )

    assert any("0.00%" in fact for fact in result.context_facts)
    assert any("17 open pull request" in fact for fact in result.context_facts)
    assert any("1 CI/CD failure" in fact for fact in result.context_facts)


def test_context_preserves_signals():
    service = IntelligenceContextService()
    metrics = make_metrics()
    health = make_health()

    from unittest.mock import patch

    with (
        patch(
            "app.services.intelligence_context_service."
            "engineering_metrics_service.get_project_metrics",
            AsyncMock(return_value=metrics),
        ),
        patch(
            "app.services.intelligence_context_service."
            "engineering_health_service.get_project_health",
            AsyncMock(return_value=health),
        ),
    ):
        result = asyncio.run(
            service.build_project_context(
                db=None,
                project_id="7",
            )
        )

    assert len(result.signals.signals) > 0
