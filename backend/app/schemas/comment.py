from datetime import datetime

from pydantic import BaseModel, Field


class IssueComment(BaseModel):
    id: int
    issue_id: int
    author_id: int
    author_name: str
    content: str
    created_at: datetime


class IssueCommentCreate(BaseModel):
    content: str = Field(
        min_length=1,
        max_length=5000,
    )