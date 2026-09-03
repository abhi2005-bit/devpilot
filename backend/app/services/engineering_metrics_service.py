from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import GitHubAPIError, InvalidGitHubResponseError
from app.models.cicd_run import (
    CICDJob as CICDJobModel,
    CICDRun as CICDRunModel,
)
from app.models.issue import Issue as IssueModel
from app.schemas.github import GitHubCommit, GitHubPullRequest
from app.schemas.metrics import (
    ActivityEngineeringMetrics,
    CICDEngineeringMetrics,
    EngineeringMetrics,
    GitHubEngineeringMetrics,
    IssueEngineeringMetrics,
    MetricBasis,
)
from app.services.github_service import github_service
from app.services.project_service import project_service


class EngineeringMetricsService:
    def _rate(
        self,
        part: int,
        total: int,
    ) -> float:
        if total == 0:
            return 0.0

        return round(part / total * 100, 2)

    def _basis(
        self,
        label: str,
        value: object,
    ) -> MetricBasis:
        return MetricBasis(
            label=label,
            value=str(value),
        )

    def _build_issue_metrics(
        self,
        issues: list[IssueModel],
        stale_cutoff: datetime,
    ) -> IssueEngineeringMetrics:
        total = len(issues)
        todo = sum(1 for issue in issues if issue.status == "TODO")
        in_progress = sum(
            1 for issue in issues if issue.status == "IN_PROGRESS"
        )
        in_review = sum(
            1 for issue in issues if issue.status == "IN_REVIEW"
        )
        completed = sum(
            1 for issue in issues if issue.status == "DONE"
        )
        critical = sum(
            1 for issue in issues if issue.priority == "CRITICAL"
        )
        high_priority = sum(
            1 for issue in issues if issue.priority == "HIGH"
        )
        unassigned = sum(
            1 for issue in issues if issue.assignee_id is None
        )
        open_issues = todo + in_progress + in_review
        stale_open = sum(
            1
            for issue in issues
            if issue.status != "DONE"
            and issue.created_at < stale_cutoff
        )

        return IssueEngineeringMetrics(
            total=total,
            open=open_issues,
            completed=completed,
            completion_rate=self._rate(completed, total),
            todo=todo,
            in_progress=in_progress,
            in_review=in_review,
            critical=critical,
            high_priority=high_priority,
            unassigned=unassigned,
            stale_open=stale_open,
            calculation_basis=[
                self._basis("source", "issues table"),
                self._basis("open_statuses", "TODO, IN_PROGRESS, IN_REVIEW"),
                self._basis("completed_status", "DONE"),
                self._basis("stale_cutoff", stale_cutoff.isoformat()),
            ],
        )

    def _build_cicd_metrics(
        self,
        runs: list[CICDRunModel],
        jobs: list[CICDJobModel],
        recent_cutoff: datetime,
    ) -> CICDEngineeringMetrics:
        total_runs = len(runs)
        successful_runs = sum(
            1 for run in runs if run.conclusion == "success"
        )
        failed_runs = sum(
            1 for run in runs if run.conclusion == "failure"
        )
        running_runs = sum(
            1
            for run in runs
            if run.status in {"queued", "in_progress"}
        )
        completed_runs = successful_runs + failed_runs
        failed_jobs = sum(
            1 for job in jobs if job.conclusion == "failure"
        )
        recent_runs = sum(
            1 for run in runs if run.started_at >= recent_cutoff
        )
        recent_failures = sum(
            1
            for run in runs
            if run.started_at >= recent_cutoff
            and run.conclusion == "failure"
        )

        return CICDEngineeringMetrics(
            total_runs=total_runs,
            completed_runs=completed_runs,
            successful_runs=successful_runs,
            failed_runs=failed_runs,
            running_runs=running_runs,
            success_rate=self._rate(successful_runs, completed_runs),
            failure_rate=self._rate(failed_runs, completed_runs),
            failed_jobs=failed_jobs,
            recent_runs=recent_runs,
            recent_failures=recent_failures,
            calculation_basis=[
                self._basis("source", "cicd_runs and cicd_jobs tables"),
                self._basis("completed_conclusions", "success, failure"),
                self._basis("running_statuses", "queued, in_progress"),
                self._basis("recent_cutoff", recent_cutoff.isoformat()),
            ],
        )

    def _build_activity_metrics(
        self,
        issue_metrics: IssueEngineeringMetrics,
        cicd_metrics: CICDEngineeringMetrics,
    ) -> ActivityEngineeringMetrics:
        active_work = (
            issue_metrics.todo
            + issue_metrics.in_progress
            + issue_metrics.in_review
        )
        blocked_or_review_work = (
            issue_metrics.in_review
            + issue_metrics.critical
            + issue_metrics.high_priority
        )

        return ActivityEngineeringMetrics(
            active_work=active_work,
            blocked_or_review_work=blocked_or_review_work,
            completed_work=issue_metrics.completed,
            recent_cicd_activity=cicd_metrics.recent_runs,
            calculation_basis=[
                self._basis("active_work", "open issue statuses"),
                self._basis(
                    "blocked_or_review_work",
                    "in-review plus critical/high-priority issues",
                ),
                self._basis("recent_cicd_activity", "recent CI/CD runs"),
            ],
        )

    async def _build_github_metrics(
        self,
        *,
        owner: str | None,
        repo: str | None,
        include_github: bool,
        github_limit: int,
    ) -> GitHubEngineeringMetrics:
        connected = bool(owner and repo)

        if not connected:
            return GitHubEngineeringMetrics(
                connected=False,
                fetched=False,
                commits=0,
                pull_requests=0,
                open_pull_requests=0,
                merged_pull_requests=0,
                closed_pull_requests=0,
                calculation_basis=[
                    self._basis("source", "project github connection fields"),
                ],
                error="GitHub repository is not connected.",
            )

        if not include_github:
            return GitHubEngineeringMetrics(
                connected=True,
                fetched=False,
                commits=0,
                pull_requests=0,
                open_pull_requests=0,
                merged_pull_requests=0,
                closed_pull_requests=0,
                calculation_basis=[
                    self._basis("source", "project github connection fields"),
                    self._basis("include_github", False),
                ],
            )

        try:
            commits = await github_service.get_commits(
                owner,
                repo,
                github_limit,
            )
            pull_requests = await github_service.get_pull_requests(
                owner,
                repo,
                github_limit,
            )
        except (GitHubAPIError, InvalidGitHubResponseError) as exc:
            return self._unavailable_github_metrics(
                error=exc.__class__.__name__,
            )

        return self._summarize_github(
            commits,
            pull_requests,
            github_limit,
        )

    def _unavailable_github_metrics(
        self,
        error: str,
    ) -> GitHubEngineeringMetrics:
        return GitHubEngineeringMetrics(
            connected=True,
            fetched=False,
            commits=0,
            pull_requests=0,
            open_pull_requests=0,
            merged_pull_requests=0,
            closed_pull_requests=0,
            calculation_basis=[
                self._basis("source", "GitHub API"),
            ],
            error=error,
        )

    def _summarize_github(
        self,
        commits: list[GitHubCommit],
        pull_requests: list[GitHubPullRequest],
        github_limit: int,
    ) -> GitHubEngineeringMetrics:
        open_pull_requests = sum(
            1
            for pull_request in pull_requests
            if pull_request.state == "open"
        )
        merged_pull_requests = sum(
            1
            for pull_request in pull_requests
            if pull_request.merged
        )
        closed_pull_requests = sum(
            1
            for pull_request in pull_requests
            if pull_request.state == "closed"
            and not pull_request.merged
        )

        return GitHubEngineeringMetrics(
            connected=True,
            fetched=True,
            commits=len(commits),
            pull_requests=len(pull_requests),
            open_pull_requests=open_pull_requests,
            merged_pull_requests=merged_pull_requests,
            closed_pull_requests=closed_pull_requests,
            calculation_basis=[
                self._basis("source", "GitHub commits and pulls API"),
                self._basis("github_limit", github_limit),
                self._basis("pull_request_state", "all"),
            ],
        )

    async def get_project_metrics(
        self,
        db: Session,
        project_id: str,
        *,
        include_github: bool = False,
        lookback_days: int = 14,
        github_limit: int = 25,
    ) -> EngineeringMetrics:
        project = project_service.get_project_model(
            db,
            project_id,
        )

        now = datetime.now()
        recent_cutoff = now - timedelta(days=lookback_days)
        stale_cutoff = now - timedelta(days=lookback_days)

        issues = db.scalars(
            select(IssueModel).where(
                IssueModel.project_id == project.id
            )
        ).all()
        runs = db.scalars(
            select(CICDRunModel).where(
                CICDRunModel.project_id == project.id
            )
        ).all()
        jobs = db.scalars(
            select(CICDJobModel).where(
                CICDJobModel.project_id == project.id
            )
        ).all()

        issue_metrics = self._build_issue_metrics(
            list(issues),
            stale_cutoff,
        )
        cicd_metrics = self._build_cicd_metrics(
            list(runs),
            list(jobs),
            recent_cutoff,
        )
        github_metrics = await self._build_github_metrics(
            owner=project.github_owner,
            repo=project.github_repo,
            include_github=include_github,
            github_limit=github_limit,
        )
        activity_metrics = self._build_activity_metrics(
            issue_metrics,
            cicd_metrics,
        )

        return EngineeringMetrics(
            project_id=project.id,
            generated_at=now,
            lookback_days=lookback_days,
            github_limit=github_limit,
            issues=issue_metrics,
            cicd=cicd_metrics,
            github=github_metrics,
            activity=activity_metrics,
        )


engineering_metrics_service = EngineeringMetricsService()
