from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_mvp_user
from app.db.database import get_db
from app.models.user import User as UserModel
from app.schemas.comment import (
    IssueComment,
    IssueCommentCreate,
)
from app.services.comment_service import comment_service


router = APIRouter(
    prefix="/issues/{issue_id}/comments",
    tags=["Issue Comments"],
)


@router.get(
    "",
    response_model=list[IssueComment],
)
def list_issue_comments(
    issue_id: int,
    db: Session = Depends(get_db),
):
    return comment_service.get_comments(
        db,
        issue_id,
    )


@router.post(
    "",
    response_model=IssueComment,
    status_code=201,
)
def create_issue_comment(
    issue_id: int,
    data: IssueCommentCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_mvp_user),
):
    return comment_service.create_comment(
        db,
        issue_id,
        data,
        current_user.id,
    )
