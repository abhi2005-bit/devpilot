from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Table, Column, Integer
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.issue_comment import IssueComment
    from app.models.label import Label
    from app.models.project import Project
    from app.models.user import User


issue_labels = Table(
    "issue_labels",
    Base.metadata,
    Column(
        "issue_id",
        Integer,
        ForeignKey("issues.id"),
        primary_key=True,
    ),
    Column(
        "label_id",
        Integer,
        ForeignKey("labels.id"),
        primary_key=True,
    ),
)


class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    assignee_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="TODO",
    )

    priority: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="MEDIUM",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="issues",
    )

    assignee: Mapped["User | None"] = relationship(
        "User",
        back_populates="assigned_issues",
    )

    comments: Mapped[list["IssueComment"]] = relationship(
        "IssueComment",
        back_populates="issue",
    )

    labels: Mapped[list["Label"]] = relationship(
        "Label",
        secondary=issue_labels,
        back_populates="issues",
    )