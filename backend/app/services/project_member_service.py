from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    PermissionDeniedError,
    ProjectMemberAlreadyExistsError,
    ProjectMemberNotFoundError,
    ProjectNotFoundError,
    UserNotFoundError,
)
from app.models.project import Project as ProjectModel
from app.models.project import project_members
from app.models.user import User as UserModel
from app.schemas.member import (
    ProjectMember,
    ProjectMemberAdd,
)


class ProjectMemberService:

    def _to_schema(
        self,
        user: UserModel,
        role: str,
    ) -> ProjectMember:
        return ProjectMember(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=role,
        )

    def _get_project(
        self,
        db: Session,
        project_id: int,
    ) -> ProjectModel:

        statement = select(ProjectModel).where(
            ProjectModel.id == project_id
        )

        project = db.scalar(statement)

        if project is None:
            raise ProjectNotFoundError()

        return project

    def get_members(
        self,
        db: Session,
        project_id: int,
    ) -> list[ProjectMember]:

        project = self._get_project(
            db,
            project_id,
        )

        member_roles = dict(
            db.execute(
                select(
                    project_members.c.user_id,
                    project_members.c.role,
                ).where(
                    project_members.c.project_id == project_id
                )
            ).all()
        )

        return [
            self._to_schema(user, member_roles[user.id])
            for user in project.members
        ]

    def add_member(
        self,
        db: Session,
        project_id: int,
        data: ProjectMemberAdd,
        current_user_id: int,
    ) -> ProjectMember:

        project = self._get_project(
            db,
            project_id,
        )

        if project.owner_id != current_user_id:
            raise PermissionDeniedError()

        statement = select(UserModel).where(
            UserModel.id == data.user_id
        )

        user = db.scalar(statement)

        if user is None:
            raise UserNotFoundError()

        existing_member = next(
            (
                member
                for member in project.members
                if member.id == user.id
            ),
            None,
        )

        if existing_member is not None:
            raise ProjectMemberAlreadyExistsError()

        db.execute(
            project_members.insert().values(
                project_id=project.id,
                user_id=user.id,
                role=data.role,
            )
        )
        
        from app.models.notification import Notification as NotificationModel
        from datetime import datetime
        notif = NotificationModel(
            user_id=user.id,
            type="PROJECT_ADDED",
            title="Added to Project",
            message=f"You have been added to project '{project.name}' as a {data.role}",
            project_id=project.id,
            entity_id=str(project.id),
            entity_type="project",
            created_at=datetime.now()
        )
        db.add(notif)

        db.commit()

        return self._to_schema(user, data.role)

    def remove_member(
        self,
        db: Session,
        project_id: int,
        user_id: int,
        current_user_id: int,
    ) -> None:

        project = self._get_project(
            db,
            project_id,
        )

        if project.owner_id != current_user_id:
            raise PermissionDeniedError()

        member = next(
            (
                user
                for user in project.members
                if user.id == user_id
            ),
            None,
        )

        if member is None:
            raise ProjectMemberNotFoundError()

        if member.id == project.owner_id:
            raise PermissionDeniedError()

        db.execute(
            delete(project_members).where(
                project_members.c.project_id == project.id,
                project_members.c.user_id == user_id,
            )
        )

        db.commit()


project_member_service = ProjectMemberService()
