from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.services.user_service import user_service


def get_current_mvp_user(
    db: Session = Depends(get_db),
) -> User:
    return user_service.get_or_create_mvp_user(db)
