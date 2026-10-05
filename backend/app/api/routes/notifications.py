from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User as UserModel
from app.models.notification import Notification as NotificationModel
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    project_id: Optional[int] = None
    entity_id: Optional[str] = None
    entity_type: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=list[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    stmt = select(NotificationModel).where(NotificationModel.user_id == current_user.id).order_by(NotificationModel.created_at.desc())
    return db.scalars(stmt).all()

@router.post("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    stmt = select(NotificationModel).where(NotificationModel.id == notification_id, NotificationModel.user_id == current_user.id)
    notif = db.scalar(stmt)
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}

@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    stmt = select(NotificationModel).where(NotificationModel.user_id == current_user.id, NotificationModel.is_read == False)
    for notif in db.scalars(stmt).all():
        notif.is_read = True
    db.commit()
    return {"status": "success"}
