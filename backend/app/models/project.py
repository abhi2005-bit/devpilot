from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.issue import Issue
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, Table, Column, Integer, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

project_members = Table(
    "project_members",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
)


class Project(Base):
    __tablename__ = "projects"

    members: Mapped[list["User"]] = relationship(
    "User",
    secondary=project_members,
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
    DateTime,
    nullable=False,
    server_default=text("CURRENT_TIMESTAMP"),
    )

    owner: Mapped["User"] = relationship(
        "User",
        back_populates="owned_projects",
    )
    issues: Mapped[list["Issue"]] = relationship(
    "Issue",
    back_populates="project",
    )
    github_owner:Mapped[str | None]=mapped_column(
        String(100),
        nullable=True,
    )
    github_repo:Mapped[str | None]=mapped_column(
        String(100),
        nullable=True,
    )
    github_url:Mapped[str | None]=mapped_column(
        String(500),
        nullable=True,
    )

