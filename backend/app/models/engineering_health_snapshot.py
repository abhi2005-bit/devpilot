from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.project import Project


class EngineeringHealthSnapshot(Base):
    __tablename__ = "engineering_health_snapshots"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    generated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    issue_health: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    cicd_reliability: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    delivery_activity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    github_activity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    lookback_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=14,
    )

    project: Mapped["Project"] = relationship(
        "Project",
    )
