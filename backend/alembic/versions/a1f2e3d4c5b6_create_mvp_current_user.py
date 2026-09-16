"""create mvp current user

Revision ID: a1f2e3d4c5b6
Revises: 7a40a6601705
Create Date: 2026-09-16 00:00:00.000000

"""

from datetime import datetime
import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1f2e3d4c5b6"
down_revision: Union[str, Sequence[str], None] = "7a40a6601705"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DEFAULT_DEV_USER_EMAIL = "devpilot@example.com"
DEFAULT_DEV_USER_NAME = "DevPilot User"


def _dev_user_email() -> str:
    return os.getenv(
        "DEV_USER_EMAIL",
        DEFAULT_DEV_USER_EMAIL,
    ).strip().lower()


def _dev_user_name() -> str:
    return (
        os.getenv(
            "DEV_USER_NAME",
            DEFAULT_DEV_USER_NAME,
        ).strip()
        or DEFAULT_DEV_USER_NAME
    )


def upgrade() -> None:
    """Create the MVP current user if it does not already exist."""

    users = sa.table(
        "users",
        sa.column("id", sa.Integer),
        sa.column("name", sa.String),
        sa.column("email", sa.String),
        sa.column("created_at", sa.DateTime),
    )

    bind = op.get_bind()
    email = _dev_user_email()

    existing_user_id = bind.execute(
        sa.select(users.c.id).where(
            users.c.email == email
        )
    ).scalar_one_or_none()

    if existing_user_id is not None:
        return

    bind.execute(
        users.insert().values(
            name=_dev_user_name(),
            email=email,
            created_at=datetime.now(),
        )
    )


def downgrade() -> None:
    """Keep user data intact on downgrade."""

    pass
