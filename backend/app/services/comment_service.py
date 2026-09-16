from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import IssueNotFoundError
from app.models.issue import Issue as IssueModel
from app.models.issue_comment import IssueComment as IssueCommentModel
from app.models.user import User as UserModel
from app.schemas.comment import (
    IssueComment,
    IssueCommentCreate,
)


class CommentService:

    def _to_schema(
        self,
        comment: IssueCommentModel,
    ) -> IssueComment:

        return IssueComment(
            id=comment.id,
            issue_id=comment.issue_id,
            author_id=comment.author_id,
            author_name=comment.author.name,
            content=comment.content,
            created_at=comment.created_at,
        )

    def get_comments(
        self,
        db: Session,
        issue_id: int,
    ) -> list[IssueComment]:

        issue = db.scalar(
            select(IssueModel).where(
                IssueModel.id == issue_id
            )
        )

        if issue is None:
            raise IssueNotFoundError()

        statement = (
            select(IssueCommentModel)
            .where(
                IssueCommentModel.issue_id == issue_id
            )
            .order_by(
                IssueCommentModel.created_at
            )
        )

        comments = db.scalars(statement).all()

        return [
            self._to_schema(comment)
            for comment in comments
        ]

    def create_comment(
        self,
        db: Session,
        issue_id: int,
        data: IssueCommentCreate,
        current_user_id: int,
    ) -> IssueComment:

        issue = db.scalar(
            select(IssueModel).where(
                IssueModel.id == issue_id
            )
        )

        if issue is None:
            raise IssueNotFoundError()

        user = db.scalar(
            select(UserModel).where(
                UserModel.id == current_user_id
            )
        )

        if user is None:
            raise ValueError(
                "Current user not found"
            )

        comment = IssueCommentModel(
            issue_id=issue_id,
            author_id=current_user_id,
            content=data.content.strip(),
            created_at=datetime.now(),
        )

        db.add(comment)
        db.commit()
        db.refresh(comment)

        return self._to_schema(comment)


comment_service = CommentService()
