from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict
from app.schemas.milestone import Milestone

class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "PLANNED"
    target_date: Optional[datetime] = None

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    target_date: Optional[datetime] = None

class GoalInDBBase(GoalBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Goal(GoalInDBBase):
    pass

class GoalWithMilestones(Goal):
    milestones: List[Milestone] = []
