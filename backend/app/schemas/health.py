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