from datetime import datetime

from pydantic import BaseModel


class EngineeringHealthHistoryItem(BaseModel):
    generated_at: datetime
    score: float
    status: str
    issue_health: float
    cicd_reliability: float
    delivery_activity: float
    github_activity: float


class EngineeringHealthHistory(BaseModel):
    project_id: int
    days: int
    snapshots: list[EngineeringHealthHistoryItem]
