from datetime import datetime

from app.schemas.metrics import EngineeringMetrics
from app.schemas.signals import (
    EngineeringSignal,
    EngineeringSignals,
)


class EngineeringSignalService:
    """
    Converts deterministic engineering metrics into actionable signals.

    This service intentionally does not use an LLM.

    Metrics are facts.
    Signals are deterministic interpretations of those facts.
    AI reasoning will happen in a later layer.
    """

    def _add_issue_signals(
        self,
        metrics: EngineeringMetrics,
        signals: list[EngineeringSignal],
    ) -> None:
        issues = metrics.issues

        if issues.critical > 0:
            severity = (
                "risk"
                if issues.critical >= 3
                else "warning"
            )

            signals.append(
                EngineeringSignal(
                    category="issues",
                    type="risk",
                    severity=severity,
                    title="Critical Issues Require Attention",
                    description=(
                        f"{issues.critical} critical issue"
                        f"{'s' if issues.critical != 1 else ''} "
                        "remain unresolved."
                    ),
                    value=str(issues.critical),
                    evidence=[
                        f"{issues.critical} critical issue(s) "
                        "are currently open."
                    ],
                    recommendation=(
                        "Review the critical issues and prioritize "
                        "resolution of the highest-impact work."
                    ),
                )
            )

        if issues.high_priority > 0:
            severity = (
                "risk"
                if issues.high_priority >= 3
                else "warning"
            )

            signals.append(
                EngineeringSignal(
                    category="issues",
                    type="risk",
                    severity=severity,
                    title="High-Priority Issues Are Open",
                    description=(
                        f"{issues.high_priority} high-priority issue"
                        f"{'s' if issues.high_priority != 1 else ''} "
                        "require attention."
                    ),
                    value=str(issues.high_priority),
                    evidence=[
                        f"{issues.high_priority} high-priority "
                        "issue(s) are currently present."
                    ],
                    recommendation=(
                        "Review high-priority issues and confirm "
                        "that ownership and next actions are clear."
                    ),
                )
            )

        if issues.stale_open > 0:
            severity = (
                "risk"
                if issues.stale_open >= 3
                else "warning"
            )

            signals.append(
                EngineeringSignal(
                    category="issues",
                    type="risk",
                    severity=severity,
                    title="Stale Open Issues Detected",
                    description=(
                        f"{issues.stale_open} open issue"
                        f"{'s' if issues.stale_open != 1 else ''} "
                        "have remained open beyond the configured "
                        "lookback threshold."
                    ),
                    value=str(issues.stale_open),
                    evidence=[
                        f"{issues.stale_open} stale open issue(s) "
                        f"were detected using the {metrics.lookback_days}-"
                        "day cutoff."
                    ],
                    recommendation=(
                        "Review stale issues and either progress, "
                        "reassign, reprioritize, or close them."
                    ),
                )
            )

        if issues.unassigned > 0:
            severity = (
                "risk"
                if issues.unassigned >= 3
                else "warning"
            )

            signals.append(
                EngineeringSignal(
                    category="issues",
                    type="warning",
                    severity=severity,
                    title="Unassigned Issues Detected",
                    description=(
                        f"{issues.unassigned} issue"
                        f"{'s' if issues.unassigned != 1 else ''} "
                        "currently have no assigned owner."
                    ),
                    value=str(issues.unassigned),
                    evidence=[
                        f"{issues.unassigned} issue(s) have "
                        "no assignee."
                    ],
                    recommendation=(
                        "Assign clear owners to unresolved issues "
                        "to reduce ownership ambiguity."
                    ),
                )
            )

        if issues.total > 0:
            if issues.completion_rate < 25:
                signals.append(
                    EngineeringSignal(
                        category="issues",
                        type="risk",
                        severity="risk",
                        title="Low Issue Completion Rate",
                        description=(
                            "Less than one quarter of the project's "
                            "issues have been completed."
                        ),
                        value=f"{issues.completion_rate:.2f}%",
                        evidence=[
                            f"Issue completion rate is "
                            f"{issues.completion_rate:.2f}%."
                        ],
                        recommendation=(
                            "Review the open issue backlog and "
                            "identify the work preventing completion."
                        ),
                    )
                )

            elif issues.completion_rate < 50:
                signals.append(
                    EngineeringSignal(
                        category="issues",
                        type="warning",
                        severity="warning",
                        title="Issue Completion Rate Needs Attention",
                        description=(
                            "Less than half of the project's "
                            "issues have been completed."
                        ),
                        value=f"{issues.completion_rate:.2f}%",
                        evidence=[
                            f"Issue completion rate is "
                            f"{issues.completion_rate:.2f}%."
                        ],
                        recommendation=(
                            "Review the open backlog and focus on "
                            "finishing existing work before adding "
                            "unnecessary new scope."
                        ),
                    )
                )

            elif issues.completion_rate >= 75:
                signals.append(
                    EngineeringSignal(
                        category="issues",
                        type="positive",
                        severity="positive",
                        title="Strong Issue Completion",
                        description=(
                            "Most recorded issues have been completed."
                        ),
                        value=f"{issues.completion_rate:.2f}%",
                        evidence=[
                            f"Issue completion rate is "
                            f"{issues.completion_rate:.2f}%."
                        ],
                        recommendation=(
                            "Maintain the current delivery discipline "
                            "while continuing to monitor new issues."
                        ),
                    )
                )

    def _add_cicd_signals(
        self,
        metrics: EngineeringMetrics,
        signals: list[EngineeringSignal],
    ) -> None:
        cicd = metrics.cicd

        if cicd.completed_runs > 0:
            if cicd.failure_rate >= 20:
                signals.append(
                    EngineeringSignal(
                        category="cicd",
                        type="risk",
                        severity="risk",
                        title="High CI/CD Failure Rate",
                        description=(
                            "A significant portion of completed "
                            "CI/CD runs have failed."
                        ),
                        value=f"{cicd.failure_rate:.2f}%",
                        evidence=[
                            f"{cicd.failed_runs} of "
                            f"{cicd.completed_runs} completed "
                            f"CI/CD runs failed."
                        ],
                        recommendation=(
                            "Review recent failed runs and identify "
                            "recurring failure causes before continuing "
                            "to increase delivery volume."
                        ),
                    )
                )

            elif cicd.failure_rate >= 10:
                signals.append(
                    EngineeringSignal(
                        category="cicd",
                        type="warning",
                        severity="warning",
                        title="Elevated CI/CD Failure Rate",
                        description=(
                            "CI/CD reliability shows a noticeable "
                            "level of failed runs."
                        ),
                        value=f"{cicd.failure_rate:.2f}%",
                        evidence=[
                            f"{cicd.failed_runs} of "
                            f"{cicd.completed_runs} completed "
                            f"CI/CD runs failed."
                        ],
                        recommendation=(
                            "Inspect failed runs and determine whether "
                            "failures are isolated or recurring."
                        ),
                    )
                )

            elif cicd.failure_rate == 0:
                signals.append(
                    EngineeringSignal(
                        category="cicd",
                        type="positive",
                        severity="positive",
                        title="Stable CI/CD Reliability",
                        description=(
                            "No completed CI/CD runs have failed "
                            "in the available dataset."
                        ),
                        value="0.00%",
                        evidence=[
                            f"{cicd.completed_runs} completed CI/CD "
                            "run(s) were successful."
                        ],
                        recommendation=(
                            "Continue monitoring CI/CD reliability "
                            "as new changes are delivered."
                        ),
                    )
                )

        if cicd.recent_failures > 0:
            severity = (
                "risk"
                if cicd.recent_failures >= 3
                else "warning"
            )

            signals.append(
                EngineeringSignal(
                    category="cicd",
                    type="risk",
                    severity=severity,
                    title="Recent CI/CD Failures Detected",
                    description=(
                        f"{cicd.recent_failures} CI/CD failure"
                        f"{'s' if cicd.recent_failures != 1 else ''} "
                        "occurred during the configured lookback period."
                    ),
                    value=str(cicd.recent_failures),
                    evidence=[
                        f"{cicd.recent_failures} recent failed "
                        f"run(s) were detected in the last "
                        f"{metrics.lookback_days} days."
                    ],
                    recommendation=(
                        "Inspect the most recent failed runs and "
                        "check for recurring failures."
                    ),
                )
            )

        if cicd.failed_jobs > 0:
            severity = (
                "risk"
                if cicd.failed_jobs >= 3
                else "warning"
            )

            signals.append(
                EngineeringSignal(
                    category="cicd",
                    type="risk",
                    severity=severity,
                    title="Failed CI/CD Jobs Detected",
                    description=(
                        f"{cicd.failed_jobs} CI/CD job"
                        f"{'s' if cicd.failed_jobs != 1 else ''} "
                        "have failed."
                    ),
                    value=str(cicd.failed_jobs),
                    evidence=[
                        f"{cicd.failed_jobs} failed CI/CD job(s) "
                        "are present in the available run data."
                    ],
                    recommendation=(
                        "Inspect the failed jobs to determine whether "
                        "they represent recurring pipeline problems."
                    ),
                )
            )

    def _add_github_signals(
        self,
        metrics: EngineeringMetrics,
        signals: list[EngineeringSignal],
    ) -> None:
        github = metrics.github

        if not github.connected:
            signals.append(
                EngineeringSignal(
                    category="github",
                    type="observation",
                    severity="neutral",
                    title="GitHub Repository Not Connected",
                    description=(
                        "No GitHub repository is connected to this project."
                    ),
                    value="not connected",
                    evidence=[
                        "GitHub repository connection fields are not configured."
                    ],
                    recommendation=(
                        "Connect a GitHub repository if repository activity "
                        "should contribute to engineering intelligence."
                    ),
                )
            )
            return

        if not github.fetched:
            signals.append(
                EngineeringSignal(
                    category="github",
                    type="observation",
                    severity="neutral",
                    title="GitHub Activity Unavailable",
                    description=(
                        "The project has a GitHub connection, but repository "
                        "activity could not be fetched."
                    ),
                    value="unavailable",
                    evidence=[
                        github.error
                        or "GitHub activity was not available."
                    ],
                    recommendation=(
                        "Check the GitHub connection and repository "
                        "availability before relying on GitHub signals."
                    ),
                )
            )
            return

        if github.commits > 0:
            signals.append(
                EngineeringSignal(
                    category="github",
                    type="positive",
                    severity="positive",
                    title="Active GitHub Development",
                    description=(
                        "Commit activity is present in the retrieved "
                        "GitHub data."
                    ),
                    value=str(github.commits),
                    evidence=[
                        f"{github.commits} commit(s) were retrieved."
                    ],
                    recommendation=(
                        "Continue monitoring repository activity "
                        "alongside issue and CI/CD signals."
                    ),
                )
            )

        if github.open_pull_requests > 10:
            severity = (
                "risk"
                if github.open_pull_requests > 20
                else "warning"
            )

            signals.append(
                EngineeringSignal(
                    category="github",
                    type="risk",
                    severity=severity,
                    title="Large Open Pull Request Backlog",
                    description=(
                        f"{github.open_pull_requests} pull requests "
                        "are currently open in the retrieved GitHub data."
                    ),
                    value=str(github.open_pull_requests),
                    evidence=[
                        f"{github.open_pull_requests} open pull request(s) "
                        "were retrieved."
                    ],
                    recommendation=(
                        "Review the open pull request backlog and "
                        "prioritize reviews or merges where appropriate."
                    ),
                )
            )

        if (
            github.pull_requests > 0
            and github.merged_pull_requests == 0
        ):
            signals.append(
                EngineeringSignal(
                    category="github",
                    type="warning",
                    severity="warning",
                    title="No Merged Pull Requests in Retrieved Data",
                    description=(
                        "Pull request activity exists, but none of the "
                        "retrieved pull requests are marked as merged."
                    ),
                    value="0 merged",
                    evidence=[
                        f"{github.pull_requests} pull request(s) "
                        "were retrieved.",
                        "0 retrieved pull requests are marked as merged.",
                    ],
                    recommendation=(
                        "Review the pull request queue to determine "
                        "whether reviews or integration are becoming "
                        "a delivery bottleneck."
                    ),
                )
            )

    def _add_delivery_signals(
        self,
        metrics: EngineeringMetrics,
        signals: list[EngineeringSignal],
    ) -> None:
        activity = metrics.activity

        if activity.blocked_or_review_work > 0:
            severity = (
                "risk"
                if activity.blocked_or_review_work >= 3
                else "warning"
            )

            signals.append(
                EngineeringSignal(
                    category="delivery",
                    type="risk",
                    severity=severity,
                    title="Delivery Work Needs Attention",
                    description=(
                        f"{activity.blocked_or_review_work} work item"
                        f"{'s' if activity.blocked_or_review_work != 1 else ''} "
                        "are currently classified as blocked or review work."
                    ),
                    value=str(activity.blocked_or_review_work),
                    evidence=[
                        f"{activity.blocked_or_review_work} blocked/review "
                        "work item(s) were derived from the issue state."
                    ],
                    recommendation=(
                        "Review blocked and in-review work to identify "
                        "items that can be progressed or completed."
                    ),
                )
            )

        if activity.completed_work > 0:
            signals.append(
                EngineeringSignal(
                    category="delivery",
                    type="positive",
                    severity="positive",
                    title="Completed Work Is Present",
                    description=(
                        "The project has recorded completed work."
                    ),
                    value=str(activity.completed_work),
                    evidence=[
                        f"{activity.completed_work} completed work item(s) "
                        "were recorded."
                    ],
                    recommendation=(
                        "Continue tracking completed work alongside "
                        "active and blocked work."
                    ),
                )
            )

        if (
            activity.active_work > 0
            and activity.completed_work == 0
        ):
            signals.append(
                EngineeringSignal(
                    category="delivery",
                    type="warning",
                    severity="warning",
                    title="Active Work Without Completed Work",
                    description=(
                        "The project has active work but no completed "
                        "work in the available issue data."
                    ),
                    value=str(activity.active_work),
                    evidence=[
                        f"{activity.active_work} active work item(s) "
                        "are present.",
                        "0 completed work items are recorded.",
                    ],
                    recommendation=(
                        "Review active work and identify items that "
                        "can be completed before expanding scope."
                    ),
                )
            )

        if activity.recent_cicd_activity > 0:
            signals.append(
                EngineeringSignal(
                    category="delivery",
                    type="positive",
                    severity="positive",
                    title="Recent Delivery Activity Detected",
                    description=(
                        "CI/CD activity is present during the configured "
                        "lookback period."
                    ),
                    value=str(activity.recent_cicd_activity),
                    evidence=[
                        f"{activity.recent_cicd_activity} recent CI/CD "
                        "run(s) were detected."
                    ],
                    recommendation=(
                        "Continue correlating delivery activity with "
                        "issue completion and CI/CD reliability."
                    ),
                )
            )

    def get_project_signals(
        self,
        *,
        metrics: EngineeringMetrics,
    ) -> EngineeringSignals:
        signals: list[EngineeringSignal] = []

        self._add_issue_signals(
            metrics,
            signals,
        )

        self._add_cicd_signals(
            metrics,
            signals,
        )

        self._add_github_signals(
            metrics,
            signals,
        )

        self._add_delivery_signals(
            metrics,
            signals,
        )

        return EngineeringSignals(
            project_id=metrics.project_id,
            generated_at=datetime.now().isoformat(),
            signals=signals,
        )


engineering_signal_service = EngineeringSignalService()

