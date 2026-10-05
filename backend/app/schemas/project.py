from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.member import ProjectMemberRole


class ProjectMember(BaseModel):
    id: str
    name: str
    role: ProjectMemberRole
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

    github_owner: Optional[str] = None
    github_repo: Optional[str] = None
    github_url: Optional[str] = None
    github_sync_status: str = "NOT_CONNECTED"
    github_last_synced_at: Optional[datetime] = None
    github_sync_error: Optional[str] = None


class ProjectCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )

    description: str = Field(
        min_length=1,
        max_length=1000,
    )

    github_owner: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    github_repo: Optional[str] = Field(
        default=None,
        max_length=200,
    )


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    description: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=1000,
    )

    risk: Optional[str] = None

    progress: Optional[int] = Field(
        default=None,
        ge=0,
        le=100,
    )

    github_owner: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    github_repo: Optional[str] = Field(
        default=None,
        max_length=200,
    )