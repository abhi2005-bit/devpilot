from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    IssueNotFoundError,
    ProjectNotFoundError,
)
from app.models.issue import Issue as IssueModel
from app.models.project import Project as ProjectModel
from app.schemas.issue import (
    Issue,
    IssueCreate,
    IssueUpdate,
)


class IssueService:

    def _to_schema(
        self,
        issue: IssueModel,
    ) -> Issue:
        return Issue(
            id=issue.id,
            project_id=issue.project_id,
            assignee_id=issue.assignee_id,
            title=issue.title,
            description=issue.description,
            status=issue.status,
            priority=issue.priority,
        )

    def _get_owned_project(
        self,
        db: Session,
        project_id: int,
        current_user_id: int,
    ) -> ProjectModel:
        statement = select(ProjectModel).where(
            ProjectModel.id == project_id,
            ProjectModel.owner_id == current_user_id,
        )

        project = db.scalar(statement)

        if project is None:
            raise ProjectNotFoundError()

        return project

    def _get_owned_issue(
        self,
        db: Session,
        issue_id: int,
        current_user_id: int,
    ) -> IssueModel:
        statement = (
            select(IssueModel)
            .join(
                ProjectModel,
                IssueModel.project_id == ProjectModel.id,
            )
            .where(
                IssueModel.id == issue_id,
                ProjectModel.owner_id == current_user_id,
            )
        )

        issue = db.scalar(statement)

        if issue is None:
            raise IssueNotFoundError()

        return issue

    def get_issues(
        self,
        db: Session,
        current_user_id: int,
        project_id: int | None = None,
    ) -> list[Issue]:

        statement = (
            select(IssueModel)
            .join(
                ProjectModel,
                IssueModel.project_id == ProjectModel.id,
            )
            .where(
                ProjectModel.owner_id == current_user_id,
            )
            .order_by(IssueModel.id)
        )

        if project_id is not None:
            statement = statement.where(
                IssueModel.project_id == project_id,
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
        current_user_id: int,
    ) -> Issue:

        issue = self._get_owned_issue(
            db,
            issue_id,
            current_user_id,
        )

        return self._to_schema(issue)

    def create_issue(
        self,
        db: Session,
        data: IssueCreate,
        current_user_id: int,
    ) -> Issue:

        self._get_owned_project(
            db,
            data.project_id,
            current_user_id,
        )

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
        current_user_id: int,
    ) -> Issue:

        issue = self._get_owned_issue(
            db,
            issue_id,
            current_user_id,
        )

        update_data = data.model_dump(
            exclude_unset=True,
        )

        for field, value in update_data.items():
            setattr(
                issue,
                field,
                value,
            )

        db.commit()
        db.refresh(issue)

        return self._to_schema(issue)

    def delete_issue(
        self,
        db: Session,
        issue_id: int,
        current_user_id: int,
    ) -> bool:

        issue = self._get_owned_issue(
            db,
            issue_id,
            current_user_id,
        )

        db.delete(issue)
        db.commit()

        return True


issue_service = IssueService()
