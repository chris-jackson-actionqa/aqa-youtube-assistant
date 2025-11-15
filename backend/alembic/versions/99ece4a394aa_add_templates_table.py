"""add_templates_table

Revision ID: 99ece4a394aa
Revises: 9c20c5e9a908
Create Date: 2025-11-15 11:22:29.478642

Related: Epic #166 - Title Template Management
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '99ece4a394aa'
down_revision: str | Sequence[str] | None = '9c20c5e9a908'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema - Add templates table."""
    # Create templates table
    op.create_table(
        'templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('content', sa.String(length=256), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create index on id (primary key)
    op.create_index(op.f('ix_templates_id'), 'templates', ['id'], unique=False)

    # Create index on type for filtering queries
    op.create_index(op.f('ix_templates_type'), 'templates', ['type'], unique=False)

    # Create case-insensitive unique index on (type, lower(content))
    op.create_index(
        'uix_template_type_content_lower',
        'templates',
        ['type', sa.text('lower(content)')],
        unique=True
    )


def downgrade() -> None:
    """Downgrade schema - Remove templates table."""
    # Drop indexes first
    op.drop_index('uix_template_type_content_lower', table_name='templates')
    op.drop_index(op.f('ix_templates_type'), table_name='templates')
    op.drop_index(op.f('ix_templates_id'), table_name='templates')

    # Drop table
    op.drop_table('templates')
