from datetime import datetime

from sqlalchemy.orm import Session

from app.schemas.intelligence import EngineeringIntelligenceContext
from app.services.engineering_health_service import (
    engineering_health_service,
)
from app.services.engineering_metrics_service import (
    engineering_metrics_service,
)
from app.services.engineering_signal_service import (
    engineering_signal_service,
)


class IntelligenceContextService:
    async def build_project_context(
        self,
        db: Session,
        project_id: str,
        *,
        lookback_days: int = 14,
        github_limit: int = 25,
    ) -> EngineeringIntelligenceContext:
        metrics = await engineering_metrics_service.get_project_metrics(
            db,
            project_id,
            include_github=True,
            lookback_days=lookback_days,
            github_limit=github_limit,
        )

        health = await engineering_health_service.get_project_health(
            db,
            project_id,
            include_github=True,
            lookback_days=lookback_days,
            github_limit=github_limit,
        )

        signals = engineering_signal_service.get_project_signals(
            metrics=metrics,
        )

        context_facts: list[str] = []

        issues = metrics.issues
        cicd = metrics.cicd
        github = metrics.github
        activity = metrics.activity

        context_facts.append(
            f"Issue completion rate is {issues.completion_rate:.2f}%."
        )

        context_facts.append(
            f"{issues.open} issue(s) are currently open."
        )

        if issues.stale_open > 0:
            context_facts.append(
                f"{issues.stale_open} stale open issue(s) were detected."
            )

        if cicd.completed_runs > 0:
            context_facts.append(
                f"{cicd.failed_runs} of {cicd.completed_runs} "
                "completed CI/CD run(s) failed."
            )

        if cicd.recent_failures > 0:
            context_facts.append(
                f"{cicd.recent_failures} CI/CD failure(s) occurred "
                f"during the {metrics.lookback_days}-day lookback period."
            )

        if github.connected and github.fetched:
            context_facts.append(
                f"{github.commits} commit(s) were retrieved from GitHub."
            )

            context_facts.append(
                f"{github.open_pull_requests} open pull request(s) "
                "were retrieved from GitHub."
            )

        context_facts.append(
            f"{activity.active_work} active work item(s) are present."
        )

        context_facts.append(
            f"{activity.completed_work} completed work item(s) are recorded."
        )

        if activity.recent_cicd_activity > 0:
            context_facts.append(
                f"{activity.recent_cicd_activity} recent CI/CD run(s) "
                "were detected."
            )

        return EngineeringIntelligenceContext(
            project_id=metrics.project_id,
            generated_at=datetime.now(),
            lookback_days=metrics.lookback_days,
            health=health,
            metrics=metrics,
            signals=signals,
            context_facts=context_facts,
        )


intelligence_context_service = IntelligenceContextService()
