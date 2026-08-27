from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
)
from app.services.project_service import project_service


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
    return project_service.get_projects(db)


@router.get(
    "/{project_id}",
    response_model=Project,
)
def read_project(
    project_id: str,
    db: Session = Depends(get_db),
):
    return project_service.get_project(
        db,
        project_id,
    )


@router.post(
    "",
    response_model=Project,
    status_code=201,
)
def create_new_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
):
    return project_service.create_project(
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
    return project_service.update_project(
        db,
        project_id,
        data,
    )


@router.delete(
    "/{project_id}",
    status_code=204,
)
def delete_existing_project(
    project_id: str,
    db: Session = Depends(get_db),
):
    project_service.delete_project(
        db,
        project_id,
    )

    return None