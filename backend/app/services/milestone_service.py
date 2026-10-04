from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.milestone import Milestone as MilestoneModel
from app.models.goal import Goal as GoalModel
from app.models.project import Project as ProjectModel
from app.schemas.milestone import MilestoneCreate, MilestoneUpdate, Milestone
from app.core.exceptions import ProjectNotFoundError

class MilestoneService:
    def get_milestones(self, db: Session, goal_id: int, current_user_id: int) -> List[Milestone]:
        goal = db.scalar(select(GoalModel).join(ProjectModel).where(GoalModel.id == goal_id, ProjectModel.owner_id == current_user_id))
        if not goal:
            raise Exception("Goal not found or project access denied")

        statement = select(MilestoneModel).where(MilestoneModel.goal_id == goal_id).order_by(MilestoneModel.created_at)
        milestones = db.scalars(statement).all()
        return milestones

    def get_milestone(self, db: Session, milestone_id: int, current_user_id: int) -> Milestone:
        statement = select(MilestoneModel).join(GoalModel).join(ProjectModel).where(MilestoneModel.id == milestone_id, ProjectModel.owner_id == current_user_id)
        milestone = db.scalar(statement)
        if not milestone:
            raise Exception("Milestone not found")
        return milestone

    def create_milestone(self, db: Session, goal_id: int, data: MilestoneCreate, current_user_id: int) -> Milestone:
        goal = db.scalar(select(GoalModel).join(ProjectModel).where(GoalModel.id == goal_id, ProjectModel.owner_id == current_user_id))
        if not goal:
            raise Exception("Goal not found or project access denied")

        milestone = MilestoneModel(
            goal_id=goal_id,
            title=data.title,
            description=data.description,
            status=data.status,
            target_date=data.target_date,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(milestone)
        db.commit()
        db.refresh(milestone)
        return milestone

    def update_milestone(self, db: Session, milestone_id: int, data: MilestoneUpdate, current_user_id: int) -> Milestone:
        milestone = db.scalar(select(MilestoneModel).join(GoalModel).join(ProjectModel).where(MilestoneModel.id == milestone_id, ProjectModel.owner_id == current_user_id))
        if not milestone:
            raise Exception("Milestone not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(milestone, field, value)
        
        milestone.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(milestone)
        return milestone

milestone_service = MilestoneService()
