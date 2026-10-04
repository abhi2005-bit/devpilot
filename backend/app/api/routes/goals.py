from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.schemas.goal import Goal, GoalCreate, GoalUpdate, GoalWithMilestones
from app.services.goal_service import goal_service

router = APIRouter()

@router.get("/projects/{project_id}/goals", response_model=List[GoalWithMilestones])
def get_goals(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return goal_service.get_goals(db, project_id, current_user.id)

@router.post("/projects/{project_id}/goals", response_model=Goal)
def create_goal(project_id: int, data: GoalCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return goal_service.create_goal(db, project_id, data, current_user.id)

@router.get("/goals/{goal_id}", response_model=GoalWithMilestones)
def get_goal(goal_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return goal_service.get_goal(db, goal_id, current_user.id)

@router.patch("/goals/{goal_id}", response_model=Goal)
def update_goal(goal_id: int, data: GoalUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return goal_service.update_goal(db, goal_id, data, current_user.id)
