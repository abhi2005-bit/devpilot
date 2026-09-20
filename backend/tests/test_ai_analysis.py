import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from app.schemas.ai import AIInsight
from app.schemas.health import (
    EngineeringHealth,
    HealthComponent,
    HealthEvidence,
)
from app.schemas.intelligence import EngineeringIntelligenceContext
from app.schemas.metrics import (
    ActivityEngineeringMetrics,
    CICDEngineeringMetrics,
    EngineeringMetrics,
    GitHubEngineeringMetrics,
    IssueEngineeringMetrics,
    MetricBasis,
)
from app.schemas.signals import (
    EngineeringSignal,
    EngineeringSignals,
)
from app.services.ai_analysis_service import AIAnalysisService


def make_context() -> EngineeringIntelligenceContext:
    basis = [MetricBasis(label="test", value="test")]

    metrics = EngineeringMetrics(
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

    component = HealthComponent(
        score=70,
        weight=0.25,
        weighted_score=17.5,
        calculation_basis=["test"],
    )

    health = EngineeringHealth(
        project_id=7,
        score=70,
        status="needs_attention",
        generated_at="2026-09-17T00:00:00",
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

    signals = EngineeringSignals(
        project_id=7,
        generated_at="2026-09-17T00:00:00",
        signals=[
            EngineeringSignal(
                category="issues",
                type="risk",
                severity="risk",
                title="Low Issue Completion Rate",
                description="Issue completion is low.",
                value="0.00%",
                evidence=[
                    "Issue completion rate is 0.00%."
                ],
                recommendation="Review the issue backlog.",
            )
        ],
    )

    return EngineeringIntelligenceContext(
        project_id=7,
        generated_at="2026-09-17T00:00:00",
        lookback_days=14,
        health=health,
        metrics=metrics,
        signals=signals,
        context_facts=[
            "Issue completion rate is 0.00%.",
            "17 open pull request(s) were retrieved from GitHub.",
            "1 CI/CD failure occurred during the 14-day lookback period.",
        ],
    )


def test_ai_analysis_uses_intelligence_context():
    service = AIAnalysisService()
    context = make_context()

    groq_response = """
{
  "title": "Delivery Activity Requires Attention",
  "summary": "The project has active engineering activity but no completed issue work.",
  "severity": "warning",
  "recommendation": "Review the active issue and pull request queues.",
  "evidence": [
    "Issue completion rate is 0.00%.",
    "17 open pull requests were retrieved from GitHub."
  ]
}
"""

    with (
        patch(
            "app.services.ai_analysis_service."
            "intelligence_context_service.build_project_context",
            AsyncMock(return_value=context),
        ),
        patch(
            "app.services.ai_analysis_service."
            "groq_service.generate",
            AsyncMock(return_value=groq_response),
        ) as mock_generate,
    ):
        result = asyncio.run(
            service.analyze_project(
                db=None,
                project_id="7",
                analysis_type="summary",
            )
        )

    assert isinstance(result, AIInsight)
    assert result.severity == "warning"
    assert result.title == "Delivery Activity Requires Attention"

    mock_generate.assert_awaited_once()

    system_prompt, user_prompt = (
        mock_generate.await_args.kwargs["system_prompt"],
        mock_generate.await_args.kwargs["user_prompt"],
    )

    assert "Engineering Intelligence Analyst" in system_prompt
    assert "Engineering Intelligence Context" in user_prompt
    assert "0.00%" in user_prompt
    assert "17" in user_prompt


def test_ai_analysis_passes_analysis_type_to_groq():
    service = AIAnalysisService()
    context = make_context()

    groq_response = """
{
  "title": "Engineering Risk",
  "summary": "The project has multiple risk signals.",
  "severity": "risk",
  "recommendation": "Review the highest priority engineering risks.",
  "evidence": [
    "Issue completion rate is 0.00%."
  ]
}
"""

    with (
        patch(
            "app.services.ai_analysis_service."
            "intelligence_context_service.build_project_context",
            AsyncMock(return_value=context),
        ),
        patch(
            "app.services.ai_analysis_service."
            "groq_service.generate",
            AsyncMock(return_value=groq_response),
        ) as mock_generate,
    ):
        result = asyncio.run(
            service.analyze_project(
                db=None,
                project_id="7",
                analysis_type="risks",
            )
        )

    assert result.severity == "risk"

    user_prompt = mock_generate.await_args.kwargs["user_prompt"]

    assert "Requested analysis type:" in user_prompt
    assert "risks" in user_prompt


def test_ai_analysis_rejects_invalid_json():
    service = AIAnalysisService()
    context = make_context()

    with (
        patch(
            "app.services.ai_analysis_service."
            "intelligence_context_service.build_project_context",
            AsyncMock(return_value=context),
        ),
        patch(
            "app.services.ai_analysis_service."
            "groq_service.generate",
            AsyncMock(return_value="not valid json"),
        ),
    ):
        with pytest.raises(RuntimeError, match="invalid JSON"):
            asyncio.run(
                service.analyze_project(
                    db=None,
                    project_id="7",
                    analysis_type="summary",
                )
            )
