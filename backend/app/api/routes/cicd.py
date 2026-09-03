from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.cicd import (
    CICDHealth,
    CICDJob,
    CICDRun,
    CICDRunCreate,
)
from app.services.cicd_service import cicd_service


router = APIRouter(
    prefix="/projects/{project_id}/cicd",
    tags=["CI/CD"],
)


@router.get(
    "",
    response_model=list[CICDRun],
)
def list_cicd_runs(
    project_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return cicd_service.get_runs(
        db,
        project_id,
        limit,
        offset,
    )


@router.get(
    "/health",
    response_model=CICDHealth,
)
def read_cicd_health(
    project_id: str,
    db: Session = Depends(get_db),
):
    return cicd_service.get_health(
        db,
        project_id,
    )


@router.get(
    "/{run_id}",
    response_model=CICDRun,
)
def read_cicd_run(
    project_id: str,
    run_id: int,
    db: Session = Depends(get_db),
):
    return cicd_service.get_run(
        db,
        project_id,
        run_id,
    )


@router.get(
    "/{run_id}/jobs",
    response_model=list[CICDJob],
)
def list_cicd_jobs(
    project_id: str,
    run_id: int,
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return cicd_service.get_jobs(
        db,
        project_id,
        run_id,
        limit,
        offset,
    )


@router.post(
    "/sync",
    response_model=list[CICDRun],
)
async def sync_cicd_runs(
    project_id: str,
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return await cicd_service.sync_github_runs(
        db,
        project_id,
        limit,
    )


@router.post(
    "",
    response_model=CICDRun,
    status_code=status.HTTP_201_CREATED,
)
def create_cicd_run(
    project_id: str,
    data: CICDRunCreate,
    db: Session = Depends(get_db),
):
    data.project_id = int(project_id)

    return cicd_service.create_run(
        db,
        data,
    )
