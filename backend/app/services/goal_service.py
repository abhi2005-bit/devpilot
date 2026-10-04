from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from datetime import datetime

from app.models.goal import Goal as GoalModel
from app.models.project import Project as ProjectModel
from app.schemas.goal import GoalCreate, GoalUpdate, Goal, GoalWithMilestones
from app.core.exceptions import ProjectNotFoundError

class GoalService:
    def get_goals(self, db: Session, project_id: int, current_user_id: int) -> List[GoalWithMilestones]:
        project = db.scalar(select(ProjectModel).where(ProjectModel.id == project_id, ProjectModel.owner_id == current_user_id))
        if not project:
            raise ProjectNotFoundError()

        statement = select(GoalModel).options(selectinload(GoalModel.milestones)).where(GoalModel.project_id == project_id).order_by(GoalModel.created_at)
        goals = db.scalars(statement).all()
        return goals

    def get_goal(self, db: Session, goal_id: int, current_user_id: int) -> GoalWithMilestones:
        statement = select(GoalModel).options(selectinload(GoalModel.milestones)).join(ProjectModel).where(GoalModel.id == goal_id, ProjectModel.owner_id == current_user_id)
        goal = db.scalar(statement)
        if not goal:
            raise Exception("Goal not found")
        return goal

    def create_goal(self, db: Session, project_id: int, data: GoalCreate, current_user_id: int) -> Goal:
        project = db.scalar(select(ProjectModel).where(ProjectModel.id == project_id, ProjectModel.owner_id == current_user_id))
        if not project:
            raise ProjectNotFoundError()

        goal = GoalModel(
            project_id=project_id,
            title=data.title,
            description=data.description,
            status=data.status,
            target_date=data.target_date,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal

    def update_goal(self, db: Session, goal_id: int, data: GoalUpdate, current_user_id: int) -> Goal:
        goal = db.scalar(select(GoalModel).join(ProjectModel).where(GoalModel.id == goal_id, ProjectModel.owner_id == current_user_id))
        if not goal:
            raise Exception("Goal not found")

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(goal, field, value)
        
        goal.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(goal)
        return goal

goal_service = GoalService()
