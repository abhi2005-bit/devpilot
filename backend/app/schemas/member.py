from pydantic import BaseModel


class ProjectMember(BaseModel):
    id: str
    name: str
    email: str


class ProjectMemberAdd(BaseModel):
    user_id: int