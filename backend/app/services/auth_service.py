from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.user_service import user_service


class AuthService:

    def register(
        self,
        db: Session,
        data: RegisterRequest,
    ) -> tuple[User, str]:

        email = data.email.lower().strip()

        existing_user = db.scalar(
            select(User).where(User.email == email)
        )

        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        user = User(
            name=data.name.strip(),
            email=email,
            password_hash=hash_password(data.password),
            created_at=datetime.utcnow(),
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_access_token(user.id)

        return user, token

    def login(
        self,
        db: Session,
        data: LoginRequest,
    ) -> tuple[User, str]:

        email = data.email.lower().strip()

        user = db.scalar(
            select(User).where(User.email == email)
        )

        if user is None or user.password_hash is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(
            data.password,
            user.password_hash,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = create_access_token(user.id)

        return user, token

    def get_user_by_id(
        self,
        db: Session,
        user_id: int,
    ) -> User:

        user = user_service.get_by_id(
            db,
            user_id,
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User no longer exists.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user


auth_service = AuthService()
