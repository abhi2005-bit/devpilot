from datetime import datetime

from pydantic import BaseModel, Field


class MetricBasis(BaseModel):
    label: str
    value: str


class IssueEngineeringMetrics(BaseModel):
    total: int
    open: int
    completed: int
    completion_rate: float
    todo: int
    in_progress: int
    in_review: int
    critical: int
    high_priority: int
    unassigned: int
    stale_open: int
    calculation_basis: list[MetricBasis]


class CICDEngineeringMetrics(BaseModel):
    total_runs: int
    completed_runs: int
    successful_runs: int
    failed_runs: int
    running_runs: int
    success_rate: float
    failure_rate: float
    failed_jobs: int
    recent_runs: int
    recent_failures: int
    calculation_basis: list[MetricBasis]


class GitHubEngineeringMetrics(BaseModel):
    connected: bool
    fetched: bool
    commits: int
    pull_requests: int
    open_pull_requests: int
    merged_pull_requests: int
    closed_pull_requests: int
    calculation_basis: list[MetricBasis]
    error: str | None = None


class ActivityEngineeringMetrics(BaseModel):
    active_work: int
    blocked_or_review_work: int
    completed_work: int
    recent_cicd_activity: int
    calculation_basis: list[MetricBasis]


class EngineeringMetrics(BaseModel):
    project_id: int
    generated_at: datetime
    lookback_days: int = Field(ge=1)
    github_limit: int = Field(ge=1)
    issues: IssueEngineeringMetrics
    cicd: CICDEngineeringMetrics
    github: GitHubEngineeringMetrics
    activity: ActivityEngineeringMetrics
