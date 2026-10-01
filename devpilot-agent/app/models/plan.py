from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field

class ActionType(str,Enum):
    OBSERVE="observe"
    ANALYZE="analyze"
    ACT="act"

class AgentStep(BaseModel):
    id:str=Field(
        min_length=1,
        max_length=100,
    )
    action:ActionType

    description:str = Field(
        min_length=1,
        max_length=500,
    )
    requires_approval:bool = False
class AgentPlan(BaseModel):
    goal:str = Field(
        min_length=1,
        max_length=1000,
    )
    steps:list[AgentStep]=Field(
        min_length=1,
    )

