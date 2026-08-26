from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project as ProjectModel
from app.schemas.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
)


def _to_schema(project: ProjectModel) -> Project:
    """
    Convert a SQLAlchemy Project model into the API response schema.
    """

    return Project(
        id=str(project.id),
        name=project.name,
        description=project.description,
        risk="LOW",
        progress=0,
        openIssues=0,
        prsPending=0,
        members=[],
        aiInsight=None,
    )


def get_projects(db: Session) -> list[Project]:
    """
    Return all projects from PostgreSQL.
    """

    statement = select(ProjectModel).order_by(ProjectModel.id)

    projects = db.scalars(statement).all()

    return [_to_schema(project) for project in projects]


def get_project(
    db: Session,
    project_id: str,
) -> Project | None:
    """
    Return one project by database ID.
    """

    try:
        project_id_int = int(project_id)
    except ValueError:
        return None

    statement = select(ProjectModel).where(
        ProjectModel.id == project_id_int
    )

    project = db.scalar(statement)

    if project is None:
        return None

    return _to_schema(project)


def create_project(
    db: Session,
    data: ProjectCreate,
) -> Project:
    """
    Create a project in PostgreSQL.
    """

    project = ProjectModel(
        name=data.name,
        description=data.description,
        owner_id=1,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return _to_schema(project)


def update_project(
    db: Session,
    project_id: str,
    data: ProjectUpdate,
) -> Project | None:
    """
    Update an existing project in PostgreSQL.
    """

    try:
        project_id_int = int(project_id)
    except ValueError:
        return None

    statement = select(ProjectModel).where(
        ProjectModel.id == project_id_int
    )

    project = db.scalar(statement)

    if project is None:
        return None

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

    return _to_schema(project)


def delete_project(
    db: Session,
    project_id: str,
) -> bool:
    """
    Delete a project from PostgreSQL.
    """

    try:
        project_id_int = int(project_id)
    except ValueError:
        return False

    statement = select(ProjectModel).where(
        ProjectModel.id == project_id_int
    )

    project = db.scalar(statement)

    if project is None:
        return False

    db.delete(project)
    db.commit()

    return True