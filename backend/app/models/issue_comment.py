from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.issue import Issue
    from app.models.user import User


class IssueComment(Base):
    __tablename__ = "issue_comments"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    issue_id: Mapped[int] = mapped_column(
        ForeignKey("issues.id"),
        nullable=False,
    )

    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    issue: Mapped["Issue"] = relationship(
        "Issue",
        back_populates="comments",
    )

    author: Mapped["User"] = relationship(
        "User",
    )