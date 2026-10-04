from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.schemas.milestone import Milestone, MilestoneCreate, MilestoneUpdate
from app.services.milestone_service import milestone_service

router = APIRouter()

@router.get("/goals/{goal_id}/milestones", response_model=List[Milestone])
def get_milestones(goal_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return milestone_service.get_milestones(db, goal_id, current_user.id)

@router.post("/goals/{goal_id}/milestones", response_model=Milestone)
def create_milestone(goal_id: int, data: MilestoneCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return milestone_service.create_milestone(db, goal_id, data, current_user.id)

@router.get("/milestones/{milestone_id}", response_model=Milestone)
def get_milestone(milestone_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return milestone_service.get_milestone(db, milestone_id, current_user.id)

@router.patch("/milestones/{milestone_id}", response_model=Milestone)
def update_milestone(milestone_id: int, data: MilestoneUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return milestone_service.update_milestone(db, milestone_id, data, current_user.id)
