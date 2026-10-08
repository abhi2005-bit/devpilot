from typing import Literal

from pydantic import BaseModel


ProjectMemberRole = Literal[
    "OWNER",
    "ENGINEER",
    "DESIGNER",
    "PRODUCT",
    "QA",
]


class ProjectMember(BaseModel):
    id: str
    name: str
    email: str
    role: ProjectMemberRole


class ProjectMemberAdd(BaseModel):
    user_id: int
    role: ProjectMemberRole = "ENGINEER"