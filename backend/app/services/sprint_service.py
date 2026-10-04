from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.sprint import Sprint as SprintModel
from app.models.project import Project as ProjectModel
from app.schemas.sprint import SprintCreate, SprintUpdate, Sprint
from app.core.exceptions import ProjectNotFoundError

class SprintService:
    def get_sprints(self, db: Session, project_id: int, current_user_id: int) -> List[Sprint]:
        # Validate project access
        project = db.scalar(select(ProjectModel).where(ProjectModel.id == project_id, ProjectModel.owner_id == current_user_id))
        if not project:
            raise ProjectNotFoundError()

        statement = select(SprintModel).where(SprintModel.project_id == project_id).order_by(SprintModel.created_at)
        sprints = db.scalars(statement).all()
        return sprints

    def get_sprint(self, db: Session, sprint_id: int, current_user_id: int) -> Sprint:
        statement = select(SprintModel).join(ProjectModel).where(SprintModel.id == sprint_id, ProjectModel.owner_id == current_user_id)
        sprint = db.scalar(statement)
        if not sprint:
            raise Exception("Sprint not found")
        return sprint

    def create_sprint(self, db: Session, project_id: int, data: SprintCreate, current_user_id: int) -> Sprint:
        project = db.scalar(select(ProjectModel).where(ProjectModel.id == project_id, ProjectModel.owner_id == current_user_id))
        if not project:
            raise ProjectNotFoundError()

        sprint = SprintModel(
            project_id=project_id,
            milestone_id=data.milestone_id,
            name=data.name,
            description=data.description,
            start_date=data.start_date,
            end_date=data.end_date,
            status=data.status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(sprint)
        db.commit()
        db.refresh(sprint)
        return sprint

    def update_sprint(self, db: Session, sprint_id: int, data: SprintUpdate, current_user_id: int) -> Sprint:
        sprint = db.scalar(select(SprintModel).join(ProjectModel).where(SprintModel.id == sprint_id, ProjectModel.owner_id == current_user_id))
        if not sprint:
            raise Exception("Sprint not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(sprint, field, value)
        
        sprint.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(sprint)
        return sprint

sprint_service = SprintService()
