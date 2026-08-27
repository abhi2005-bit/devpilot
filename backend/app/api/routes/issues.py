from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.issue import (
    Issue,
    IssueCreate,
    IssueUpdate,
)
from app.services.issue_service import issue_service


router = APIRouter(
    prefix="/issues",
    tags=["Issues"],
)


@router.get(
    "",
    response_model=list[Issue],
)
def list_issues(
    project_id: int | None = None,
    db: Session = Depends(get_db),
):
    return issue_service.get_issues(
        db,
        project_id,
    )


@router.get(
    "/{issue_id}",
    response_model=Issue,
)
def read_issue(
    issue_id: int,
    db: Session = Depends(get_db),
):
    return issue_service.get_issue(
        db,
        issue_id,
    )


@router.post(
    "",
    response_model=Issue,
    status_code=201,
)
def create_new_issue(
    data: IssueCreate,
    db: Session = Depends(get_db),
):
    return issue_service.create_issue(
        db,
        data,
    )


@router.put(
    "/{issue_id}",
    response_model=Issue,
)
def update_existing_issue(
    issue_id: int,
    data: IssueUpdate,
    db: Session = Depends(get_db),
):
    return issue_service.update_issue(
        db,
        issue_id,
        data,
    )


@router.delete(
    "/{issue_id}",
    status_code=204,
)
def delete_existing_issue(
    issue_id: int,
    db: Session = Depends(get_db),
):
    issue_service.delete_issue(
        db,
        issue_id,
    )

    return None