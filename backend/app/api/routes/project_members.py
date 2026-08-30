from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.member import (
    ProjectMember,
    ProjectMemberAdd,
)
from app.services.project_member_service import (
    project_member_service,
)


router = APIRouter(
    prefix="/projects/{project_id}/members",
    tags=["Project Members"],
)


@router.get(
    "",
    response_model=list[ProjectMember],
)
def list_project_members(
    project_id: int,
    db: Session = Depends(get_db),
):
    return project_member_service.get_members(
        db,
        project_id,
    )


@router.post(
    "",
    response_model=ProjectMember,
    status_code=201,
)
def add_project_member(
    project_id: int,
    data: ProjectMemberAdd,
    db: Session = Depends(get_db),
):
    return project_member_service.add_member(
        db,
        project_id,
        data,
    )


@router.delete(
    "/{user_id}",
    status_code=204,
)
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):
    project_member_service.remove_member(
        db,
        project_id,
        user_id,
    )

    return None