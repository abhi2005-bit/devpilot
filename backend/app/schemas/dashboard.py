from pydantic import BaseModel


class DashboardSummary(BaseModel):
    active_projects: int
    open_issues: int
    completed_issues: int
    blocked_or_review: int
    critical_issues: int