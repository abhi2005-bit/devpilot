from pydantic import BaseModel, Field
from typing import Optional


class ProjectMember(BaseModel):
    id: str
    name: str
    role: Optional[str] = None
    avatar: Optional[str] = None


class Project(BaseModel):
    id: str
    name: str
    description: str
    ownerId: str
    risk: str
    progress: int = Field(ge=0, le=100)
    openIssues: int = Field(ge=0)
    prsPending: int = Field(ge=0)
    members: list[ProjectMember]
    aiInsight: Optional[str] = None


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=1000)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, min_length=1, max_length=1000)
    risk: Optional[str] = None
    progress: Optional[int] = Field(default=None, ge=0, le=100)