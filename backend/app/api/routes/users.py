from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User as UserModel
from app.schemas.user import User
from app.services.user_service import user_service


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "",
    response_model=list[User],
)
def list_users(
    db: Session = Depends(get_db),
    _current_user: UserModel = Depends(get_current_user),
):
    return user_service.get_users(db)