from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User as UserModel
from app.schemas.user import User


class UserService:

    def _to_schema(
        self,
        user: UserModel,
    ) -> User:
        return User(
            id=str(user.id),
            name=user.name,
            email=user.email,
        )

    def get_users(
        self,
        db: Session,
    ) -> list[User]:

        statement = select(UserModel).order_by(
            UserModel.name
        )

        users = db.scalars(statement).all()

        return [
            self._to_schema(user)
            for user in users
        ]


user_service = UserService()