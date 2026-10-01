"""add project member roles

Revision ID: d9e4c2a8f617
Revises: 42dec8c9ae4a
Create Date: 2026-09-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d9e4c2a8f617"
down_revision: Union[str, Sequence[str], None] = "42dec8c9ae4a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "project_members",
        sa.Column(
            "role",
            sa.String(length=20),
            nullable=False,
            server_default="ENGINEER",
        ),
    )


def downgrade() -> None:
    op.drop_column("project_members", "role")