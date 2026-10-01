from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.schemas.sprint import Sprint, SprintCreate, SprintUpdate
from app.services.sprint_service import sprint_service

router = APIRouter()

@router.get("/projects/{project_id}/sprints", response_model=List[Sprint])
def get_sprints(project_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return sprint_service.get_sprints(db, project_id, current_user.id)

@router.post("/projects/{project_id}/sprints", response_model=Sprint)
def create_sprint(project_id: int, data: SprintCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return sprint_service.create_sprint(db, project_id, data, current_user.id)

@router.get("/sprints/{sprint_id}", response_model=Sprint)
def get_sprint(sprint_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return sprint_service.get_sprint(db, sprint_id, current_user.id)

@router.patch("/sprints/{sprint_id}", response_model=Sprint)
def update_sprint(sprint_id: int, data: SprintUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return sprint_service.update_sprint(db, sprint_id, data, current_user.id)
