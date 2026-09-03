from datetime import datetime

from pydantic import BaseModel


class IssueMetrics(BaseModel):
    total: int
    open: int
    todo: int
    in_progress: int
    in_review: int
    done: int
    critical: int
    high_priority: int
    unassigned: int


class ProjectHealth(BaseModel):
    project_id: int
    health: str
    health_score: int
    issues: IssueMetrics
class HealthComponent(BaseModel):
    score: float
    weight: float
    weighted_score: float
    calculation_basis: list[str]


class HealthEvidence(BaseModel):
    label: str
    value: str
    impact: str


class EngineeringHealth(BaseModel):
    project_id: int
    score: float
    status: str
    generated_at: datetime
    lookback_days: int

    issue_health: HealthComponent
    cicd_reliability: HealthComponent
    delivery_activity: HealthComponent
    github_activity: HealthComponent

    evidence: list[HealthEvidence]