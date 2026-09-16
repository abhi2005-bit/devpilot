from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import settings
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

    def get_or_create_mvp_user(
        self,
        db: Session,
    ) -> UserModel:

        email = settings.dev_user_email.strip().lower()
        name = settings.dev_user_name.strip() or "DevPilot User"

        statement = select(UserModel).where(
            UserModel.email == email
        )

        user = db.scalar(statement)

        if user is not None:
            return user

        user = UserModel(
            name=name,
            email=email,
            created_at=datetime.now(),
        )

        db.add(user)

        try:
            db.commit()

        except IntegrityError:
            db.rollback()
            existing_user = db.scalar(statement)

            if existing_user is not None:
                return existing_user

            raise

        db.refresh(user)

        return user


user_service = UserService()
