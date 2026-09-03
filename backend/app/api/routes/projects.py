from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db

from app.schemas.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
)

from app.schemas.health import ProjectHealth

from app.schemas.github import ProjectGitHub

from app.core.exceptions import GitHubRepositoryNotConnectedError
from app.services.project_service import project_service
from app.services.github_service import github_service


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


@router.get(
    "/{project_id}/health",
    response_model=ProjectHealth,
)
def read_project_health(
    project_id: str,
    db: Session = Depends(get_db),
):
    return project_service.get_project_health(
        db,
        project_id,
    )


@router.get(
    "/{project_id}/github",
    response_model=ProjectGitHub,
)
async def read_project_github(
    project_id: str,
    db: Session = Depends(get_db),
):
    project = project_service.get_project_model(
        db,
        project_id,
    )

    if not project.github_owner or not project.github_repo:
        raise GitHubRepositoryNotConnectedError()

    repository = await github_service.get_repository(
        project.github_owner,
        project.github_repo,
    )

    commits = await github_service.get_commits(
        project.github_owner,
        project.github_repo,
        5,
    )

    pull_requests = await github_service.get_pull_requests(
        project.github_owner,
        project.github_repo,
        5,
    )

    workflow_runs = await github_service.get_workflow_runs(
        project.github_owner,
        project.github_repo,
        5,
    )

    return ProjectGitHub(
        repository=repository,
        commits=commits,
        pull_requests=pull_requests,
        workflow_runs=workflow_runs,
    )


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
