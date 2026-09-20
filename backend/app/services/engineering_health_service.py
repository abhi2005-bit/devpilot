from datetime import datetime

from sqlalchemy.orm import Session

from app.models.engineering_health_snapshot import EngineeringHealthSnapshot
from app.schemas.health import (
    EngineeringHealth,
    HealthComponent,
    HealthEvidence,
)
from app.services.engineering_metrics_service import (
    engineering_metrics_service,
)


ISSUE_WEIGHT = 0.30
CICD_WEIGHT = 0.35
DELIVERY_WEIGHT = 0.20
GITHUB_WEIGHT = 0.15


def _clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 100.0,
) -> float:
    return max(minimum, min(value, maximum))


def _weighted_score(
    score: float,
    weight: float,
) -> float:
    return round(score * weight, 2)


class EngineeringHealthService:
    async def get_project_health(
        self,
        db: Session,
        project_id: str,
        include_github: bool = True,
        lookback_days: int = 14,
        github_limit: int = 25,
        persist_snapshot: bool = False,
    ) -> EngineeringHealth:
        metrics = await engineering_metrics_service.get_project_metrics(
            db,
            project_id,
            include_github=include_github,
            lookback_days=lookback_days,
            github_limit=github_limit,
        )

        issue_score, issue_basis, issue_evidence = (
            self._calculate_issue_health(metrics)
        )

        cicd_score, cicd_basis, cicd_evidence = (
            self._calculate_cicd_reliability(metrics)
        )

        delivery_score, delivery_basis, delivery_evidence = (
            self._calculate_delivery_activity(metrics)
        )

        github_score, github_basis, github_evidence = (
            self._calculate_github_activity(metrics)
        )

        issue_component = HealthComponent(
            score=round(issue_score, 2),
            weight=ISSUE_WEIGHT,
            weighted_score=_weighted_score(
                issue_score,
                ISSUE_WEIGHT,
            ),
            calculation_basis=issue_basis,
        )

        cicd_component = HealthComponent(
            score=round(cicd_score, 2),
            weight=CICD_WEIGHT,
            weighted_score=_weighted_score(
                cicd_score,
                CICD_WEIGHT,
            ),
            calculation_basis=cicd_basis,
        )

        delivery_component = HealthComponent(
            score=round(delivery_score, 2),
            weight=DELIVERY_WEIGHT,
            weighted_score=_weighted_score(
                delivery_score,
                DELIVERY_WEIGHT,
            ),
            calculation_basis=delivery_basis,
        )

        github_component = HealthComponent(
            score=round(github_score, 2),
            weight=GITHUB_WEIGHT,
            weighted_score=_weighted_score(
                github_score,
                GITHUB_WEIGHT,
            ),
            calculation_basis=github_basis,
        )

        final_score = round(
            issue_component.weighted_score
            + cicd_component.weighted_score
            + delivery_component.weighted_score
            + github_component.weighted_score,
            2,
        )

        status = self._get_status(final_score)

        evidence = [
            *issue_evidence,
            *cicd_evidence,
            *delivery_evidence,
            *github_evidence,
        ]

        generated_at = datetime.utcnow()

        if persist_snapshot and db is not None:
            snapshot = EngineeringHealthSnapshot(
                project_id=metrics.project_id,
                generated_at=generated_at,
                score=final_score,
                status=status,
                issue_health=issue_component.score,
                cicd_reliability=cicd_component.score,
                delivery_activity=delivery_component.score,
                github_activity=github_component.score,
                lookback_days=metrics.lookback_days,
            )

            db.add(snapshot)
            db.commit()

        return EngineeringHealth(
            project_id=metrics.project_id,
            score=final_score,
            status=status,
            generated_at=generated_at,
            lookback_days=metrics.lookback_days,
            issue_health=issue_component,
            cicd_reliability=cicd_component,
            delivery_activity=delivery_component,
            github_activity=github_component,
            evidence=evidence,
        )

    def _calculate_issue_health(self, metrics):
        issues = metrics.issues

        if issues.total == 0:
            score = 75.0

            basis = [
                "No issues exist for this project.",
                "A neutral score of 75 is used when issue data is unavailable.",
            ]

            evidence = [
                HealthEvidence(
                    label="Issue volume",
                    value="0 issues",
                    impact="neutral",
                )
            ]

            return score, basis, evidence

        score = issues.completion_rate

        stale_penalty = min(
            issues.stale_open * 5,
            20,
        )

        critical_penalty = min(
            issues.critical * 5,
            20,
        )

        high_priority_penalty = min(
            issues.high_priority * 3,
            15,
        )

        unassigned_penalty = min(
            issues.unassigned * 2,
            10,
        )

        score -= stale_penalty
        score -= critical_penalty
        score -= high_priority_penalty
        score -= unassigned_penalty

        if issues.completion_rate == 0:
            score = max(score, 50)

        score = _clamp(score)

        basis = [
            f"Completion rate contributes {issues.completion_rate:.2f} points.",
            f"Stale open issues penalty: -{stale_penalty:.2f}.",
            f"Critical issue penalty: -{critical_penalty:.2f}.",
            f"High-priority issue penalty: -{high_priority_penalty:.2f}.",
            f"Unassigned issue penalty: -{unassigned_penalty:.2f}.",
        ]

        evidence = [
            HealthEvidence(
                label="Issue completion",
                value=f"{issues.completion_rate:.2f}%",
                impact="positive" if issues.completion_rate >= 50 else "negative",
            ),
            HealthEvidence(
                label="Stale open issues",
                value=str(issues.stale_open),
                impact="negative" if issues.stale_open > 0 else "neutral",
            ),
            HealthEvidence(
                label="Critical issues",
                value=str(issues.critical),
                impact="negative" if issues.critical > 0 else "neutral",
            ),
            HealthEvidence(
                label="Unassigned issues",
                value=str(issues.unassigned),
                impact="negative" if issues.unassigned > 0 else "neutral",
            ),
        ]

        return score, basis, evidence

    def _calculate_cicd_reliability(self, metrics):
        cicd = metrics.cicd

        if cicd.completed_runs == 0:
            score = 75.0

            basis = [
                "No completed CI/CD runs are available.",
                "A neutral score of 75 is used when completed-run data is unavailable.",
            ]

            evidence = [
                HealthEvidence(
                    label="Completed CI/CD runs",
                    value="0",
                    impact="neutral",
                )
            ]

            return score, basis, evidence

        score = cicd.success_rate

        recent_failure_penalty = min(
            cicd.recent_failures * 5,
            20,
        )

        failed_job_penalty = min(
            cicd.failed_jobs * 3,
            15,
        )

        score -= recent_failure_penalty
        score -= failed_job_penalty

        score = _clamp(score)

        basis = [
            f"CI/CD success rate contributes {cicd.success_rate:.2f} points.",
            f"Recent failure penalty: -{recent_failure_penalty:.2f}.",
            f"Failed job penalty: -{failed_job_penalty:.2f}.",
        ]

        evidence = [
            HealthEvidence(
                label="CI/CD success rate",
                value=f"{cicd.success_rate:.2f}%",
                impact="positive" if cicd.success_rate >= 90 else "negative",
            ),
            HealthEvidence(
                label="Recent CI/CD failures",
                value=str(cicd.recent_failures),
                impact="negative" if cicd.recent_failures > 0 else "neutral",
            ),
            HealthEvidence(
                label="Failed jobs",
                value=str(cicd.failed_jobs),
                impact="negative" if cicd.failed_jobs > 0 else "neutral",
            ),
        ]

        return score, basis, evidence

    def _calculate_delivery_activity(self, metrics):
        activity = metrics.activity

        score = 70.0

        completed_bonus = min(
            activity.completed_work * 5,
            15,
        )

        active_work_bonus = min(
            activity.active_work * 3,
            10,
        )

        blocked_review_penalty = min(
            activity.blocked_or_review_work * 5,
            20,
        )

        cicd_activity_bonus = (
            5 if activity.recent_cicd_activity > 0 else 0
        )

        no_completion_penalty = (
            10
            if metrics.issues.total > 0
            and activity.completed_work == 0
            else 0
        )

        score += completed_bonus
        score += active_work_bonus
        score -= blocked_review_penalty
        score += cicd_activity_bonus
        score -= no_completion_penalty

        score = _clamp(score)

        basis = [
            "Base delivery score: 70.",
            f"Completed work bonus: +{completed_bonus:.2f}.",
            f"Active work bonus: +{active_work_bonus:.2f}.",
            f"Blocked/review work penalty: -{blocked_review_penalty:.2f}.",
            f"Recent CI/CD activity bonus: +{cicd_activity_bonus:.2f}.",
            f"No completed work penalty: -{no_completion_penalty:.2f}.",
        ]

        evidence = [
            HealthEvidence(
                label="Active work",
                value=str(activity.active_work),
                impact="positive" if activity.active_work > 0 else "neutral",
            ),
            HealthEvidence(
                label="Completed work",
                value=str(activity.completed_work),
                impact="positive" if activity.completed_work > 0 else "negative",
            ),
            HealthEvidence(
                label="Blocked/review work",
                value=str(activity.blocked_or_review_work),
                impact=(
                    "negative"
                    if activity.blocked_or_review_work > 0
                    else "neutral"
                ),
            ),
            HealthEvidence(
                label="Recent CI/CD activity",
                value=str(activity.recent_cicd_activity),
                impact=(
                    "positive"
                    if activity.recent_cicd_activity > 0
                    else "neutral"
                ),
            ),
        ]

        return score, basis, evidence

    def _calculate_github_activity(self, metrics):
        github = metrics.github

        if not github.connected or not github.fetched:
            score = 75.0

            basis = [
                "GitHub data is not connected or was not fetched.",
                "A neutral score of 75 is used when GitHub activity data is unavailable.",
            ]

            evidence = [
                HealthEvidence(
                    label="GitHub connection",
                    value=(
                        "connected"
                        if github.connected
                        else "not connected"
                    ),
                    impact="neutral",
                )
            ]

            return score, basis, evidence

        score = 70.0

        total_prs = github.pull_requests

        if total_prs > 0:
            merge_ratio = (
                github.merged_pull_requests / total_prs
            )

            merge_bonus = min(
                merge_ratio * 20,
                20,
            )
        else:
            merge_bonus = 0.0

        commit_bonus = (
            10
            if github.commits > 0
            else 0
        )

        open_pr_penalty = 0.0

        if github.open_pull_requests > 20:
            open_pr_penalty = 10.0
        elif github.open_pull_requests > 10:
            open_pr_penalty = 5.0

        score += merge_bonus
        score += commit_bonus
        score -= open_pr_penalty

        score = _clamp(score)

        basis = [
            "GitHub activity starts from a base score of 70.",
            f"Pull-request merge bonus: +{merge_bonus:.2f}.",
            f"Commit activity bonus: +{commit_bonus:.2f}.",
            f"Open pull-request penalty: -{open_pr_penalty:.2f}.",
        ]

        evidence = [
            HealthEvidence(
                label="Commits",
                value=str(github.commits),
                impact="positive" if github.commits > 0 else "neutral",
            ),
            HealthEvidence(
                label="Pull requests",
                value=str(github.pull_requests),
                impact="neutral",
            ),
            HealthEvidence(
                label="Merged pull requests",
                value=str(github.merged_pull_requests),
                impact=(
                    "positive"
                    if github.merged_pull_requests > 0
                    else "neutral"
                ),
            ),
            HealthEvidence(
                label="Open pull requests",
                value=str(github.open_pull_requests),
                impact=(
                    "negative"
                    if github.open_pull_requests > 10
                    else "neutral"
                ),
            ),
        ]

        return score, basis, evidence

    def _get_status(self, score: float) -> str:
        if score >= 90:
            return "excellent"

        if score >= 75:
            return "healthy"

        if score >= 60:
            return "needs_attention"

        return "at_risk"


engineering_health_service = EngineeringHealthService()
