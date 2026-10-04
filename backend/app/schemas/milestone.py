from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict

class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "PLANNED"
    target_date: Optional[datetime] = None

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    target_date: Optional[datetime] = None

class MilestoneInDBBase(MilestoneBase):
    id: int
    goal_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Milestone(MilestoneInDBBase):
    pass
