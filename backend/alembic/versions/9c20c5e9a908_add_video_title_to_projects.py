"""add_video_title_to_projects

Revision ID: 9c20c5e9a908
Revises: 71bc71cb8fac
Create Date: 2025-11-10 18:14:05.690921

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '9c20c5e9a908'
down_revision: str | Sequence[str] | None = '71bc71cb8fac'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema - Add video_title column to projects table."""
    op.add_column(
        'projects',
        sa.Column('video_title', sa.String(length=500), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema - Remove video_title column from projects table."""
    op.drop_column('projects', 'video_title')
