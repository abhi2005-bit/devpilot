from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


if TYPE_CHECKING:
    from app.models.project import Project


class CICDRun(Base):
    __tablename__ = "cicd_runs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id"),
        nullable=False,
    )

    workflow_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    branch: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    commit_sha: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    conclusion: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    failed_tests: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="cicd_runs",
    )