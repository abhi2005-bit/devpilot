from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import IssueNotFoundError
from app.models.issue import Issue as IssueModel
from app.schemas.issue import (
    Issue,
    IssueCreate,
    IssueUpdate,
)


class IssueService:

    def _to_schema(self, issue: IssueModel) -> Issue:
        return Issue(
            id=issue.id,
            project_id=issue.project_id,
            assignee_id=issue.assignee_id,
            title=issue.title,
            description=issue.description,
            status=issue.status,
            priority=issue.priority,
        )

    def get_issues(
        self,
        db: Session,
        project_id: int | None = None,
    ) -> list[Issue]:

        statement = select(IssueModel).order_by(
            IssueModel.id
        )

        if project_id is not None:
            statement = statement.where(
                IssueModel.project_id == project_id
            )

        issues = db.scalars(statement).all()

        return [
            self._to_schema(issue)
            for issue in issues
        ]

    def get_issue(
        self,
        db: Session,
        issue_id: int,
    ) -> Issue:

        statement = select(IssueModel).where(
            IssueModel.id == issue_id
        )

        issue = db.scalar(statement)

        if issue is None:
            raise IssueNotFoundError()

        return self._to_schema(issue)

    def create_issue(
        self,
        db: Session,
        data: IssueCreate,
    ) -> Issue:

        issue = IssueModel(
            project_id=data.project_id,
            assignee_id=data.assignee_id,
            title=data.title,
            description=data.description,
            status=data.status,
            priority=data.priority,
            created_at=datetime.now(),
        )

        db.add(issue)
        db.commit()
        db.refresh(issue)

        return self._to_schema(issue)

    def update_issue(
        self,
        db: Session,
        issue_id: int,
        data: IssueUpdate,
    ) -> Issue:

        statement = select(IssueModel).where(
            IssueModel.id == issue_id
        )

        issue = db.scalar(statement)

        if issue is None:
            raise IssueNotFoundError()

        update_data = data.model_dump(
            exclude_unset=True
        )

        for field, value in update_data.items():
            setattr(issue, field, value)

        db.commit()
        db.refresh(issue)

        return self._to_schema(issue)

    def delete_issue(
        self,
        db: Session,
        issue_id: int,
    ) -> bool:

        statement = select(IssueModel).where(
            IssueModel.id == issue_id
        )

        issue = db.scalar(statement)

        if issue is None:
            raise IssueNotFoundError()

        db.delete(issue)
        db.commit()

        return True


issue_service = IssueService()