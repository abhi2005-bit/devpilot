from pydantic import BaseModel, Field


class Issue(BaseModel):
    id: int
    project_id: int
    assignee_id: int | None
    title: str
    description: str | None
    status: str
    priority: str


class IssueCreate(BaseModel):
    project_id: int
    assignee_id: int | None = None
    title: str = Field(
        min_length=1,
        max_length=200,
    )
    description: str | None = None
    status: str = "TODO"
    priority: str = "MEDIUM"


class IssueUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    assignee_id: int | None = None