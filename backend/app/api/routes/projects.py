from fastapi import APIRouter, HTTPException, status

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



# GET /projects


@router.get(
    "",
    response_model=list[Project],
)
def list_projects():
    return get_projects()



# GET /projects/{project_id}


@router.get(
    "/{project_id}",
    response_model=Project,
)
def read_project(project_id: str):

    project = get_project(project_id)

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project



# POST /projects


@router.post(
    "",
    response_model=Project,
    status_code=status.HTTP_201_CREATED,
)
def create_new_project(data: ProjectCreate):

    return create_project(data)



# PUT /projects/{project_id}


@router.put(
    "/{project_id}",
    response_model=Project,
)
def update_existing_project(
    project_id: str,
    data: ProjectUpdate,
):

    project = update_project(
        project_id,
        data,
    )

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project



# DELETE /projects/{project_id}


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_existing_project(
    project_id: str,
):

    deleted = delete_project(project_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return None