from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.issue import Issue


class Label(Base):
    __tablename__ = "labels"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    issues: Mapped[list["Issue"]] = relationship(
        "Issue",
        secondary="issue_labels",
        back_populates="labels",
    )