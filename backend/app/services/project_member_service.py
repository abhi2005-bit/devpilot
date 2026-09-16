from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    PermissionDeniedError,
    ProjectMemberAlreadyExistsError,
    ProjectMemberNotFoundError,
    ProjectNotFoundError,
    UserNotFoundError,
)
from app.models.project import Project as ProjectModel
from app.models.user import User as UserModel
from app.schemas.member import (
    ProjectMember,
    ProjectMemberAdd,
)


class ProjectMemberService:

    def _to_schema(
        self,
        user: UserModel,
    ) -> ProjectMember:
        return ProjectMember(
            id=str(user.id),
            name=user.name,
            email=user.email,
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

        return [
            self._to_schema(user)
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

        project.members.append(user)

        db.commit()

        return self._to_schema(user)

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

        project.members.remove(member)

        db.commit()


project_member_service = ProjectMemberService()
