from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
)
from app.services.project_service import (
    get_projects,
    get_project,
    create_project,
    update_project,
    delete_project,
)


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


@router.get(
    "",
    response_model=list[Project],
)
def list_projects(
    db: Session = Depends(get_db),
):
    return get_projects(db)


@router.get(
    "/{project_id}",
    response_model=Project,
)
def read_project(
    project_id: str,
    db: Session = Depends(get_db),
):
    project = get_project(
        db,
        project_id,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.post(
    "",
    response_model=Project,
    status_code=status.HTTP_201_CREATED,
)
def create_new_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
):
    return create_project(
        db,
        data,
    )


@router.put(
    "/{project_id}",
    response_model=Project,
)
def update_existing_project(
    project_id: str,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    project = update_project(
        db,
        project_id,
        data,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_project(
    project_id: str,
    db: Session = Depends(get_db),
):
    deleted = delete_project(
        db,
        project_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return None