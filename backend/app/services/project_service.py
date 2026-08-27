from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    PermissionDeniedError,
    ProjectNotFoundError,
)
from app.models.project import Project as ProjectModel
from app.schemas.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
)


class ProjectService:

    def _to_schema(self, project: ProjectModel) -> Project:
        return Project(
            id=str(project.id),
            name=project.name,
            description=project.description or "",
            risk="LOW",
            progress=0,
            openIssues=0,
            prsPending=0,
            members=[],
            aiInsight=None,
        )

    def get_projects(self, db: Session) -> list[Project]:
        statement = (
            select(ProjectModel)
            .order_by(ProjectModel.id)
        )

        projects = db.scalars(statement).all()

        return [
            self._to_schema(project)
            for project in projects
        ]

    def get_project(
        self,
        db: Session,
        project_id: str,
    ) -> Project:

        try:
            project_id_int = int(project_id)
        except ValueError:
            raise ProjectNotFoundError()

        statement = select(ProjectModel).where(
            ProjectModel.id == project_id_int
        )

        project = db.scalar(statement)

        if project is None:
            raise ProjectNotFoundError()

        return self._to_schema(project)

    def create_project(
        self,
        db: Session,
        data: ProjectCreate,
        current_user_id: int = 1,
    ) -> Project:

        project = ProjectModel(
            name=data.name,
            description=data.description,
            owner_id=current_user_id,
        )

        db.add(project)
        db.commit()
        db.refresh(project)

        return self._to_schema(project)

    def update_project(
        self,
        db: Session,
        project_id: str,
        data: ProjectUpdate,
        current_user_id: int = 1,
    ) -> Project:

        try:
            project_id_int = int(project_id)
        except ValueError:
            raise ProjectNotFoundError()

        statement = select(ProjectModel).where(
            ProjectModel.id == project_id_int
        )

        project = db.scalar(statement)

        if project is None:
            raise ProjectNotFoundError()

        if project.owner_id != current_user_id:
            raise PermissionDeniedError()

        update_data = data.model_dump(
            exclude_unset=True
        )

        allowed_fields = {
            "name",
            "description",
        }

        for field, value in update_data.items():
            if field in allowed_fields:
                setattr(project, field, value)

        db.commit()
        db.refresh(project)

        return self._to_schema(project)

    def delete_project(
        self,
        db: Session,
        project_id: str,
        current_user_id: int = 1,
    ) -> bool:

        try:
            project_id_int = int(project_id)
        except ValueError:
            raise ProjectNotFoundError()

        statement = select(ProjectModel).where(
            ProjectModel.id == project_id_int
        )

        project = db.scalar(statement)

        if project is None:
            raise ProjectNotFoundError()

        if project.owner_id != current_user_id:
            raise PermissionDeniedError()

        db.delete(project)
        db.commit()

        return True


project_service = ProjectService()