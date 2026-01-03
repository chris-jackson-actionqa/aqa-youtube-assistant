"""add workspace scope to templates

Revision ID: 4f8b5d4c7d3e
Revises: 99ece4a394aa
Create Date: 2026-01-01 00:00:00.000000

Related: Issue #91 - Multi-Workspace Support for templates
"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4f8b5d4c7d3e"
down_revision: str | Sequence[str] | None = "99ece4a394aa"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add workspace scoping to templates table."""
    # Add workspace_id column with default of 1 for existing rows
    op.add_column(
        "templates",
        sa.Column(
            "workspace_id",
            sa.Integer(),
            nullable=True,
            server_default="1",
        ),
    )

    # Backfill existing rows to workspace_id=1
    # (server_default handles this for new rows)
    op.execute("UPDATE templates SET workspace_id = 1 WHERE workspace_id IS NULL")

    # Make workspace_id non-nullable and remove server_default (SQLite-safe)
    with op.batch_alter_table("templates") as batch_op:
        batch_op.alter_column(
            "workspace_id",
            existing_type=sa.Integer(),
            nullable=False,
            existing_server_default=sa.text("1"),
            server_default=None,
        )

    # Drop old unique index if it exists (SQLite skips reflection of expression indexes)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_indexes = {idx["name"] for idx in inspector.get_indexes("templates")}
    if "uix_template_type_content_lower" in existing_indexes:
        op.drop_index("uix_template_type_content_lower", table_name="templates")

    # Index for workspace_id lookups
    op.create_index(
        op.f("ix_templates_workspace_id"), "templates", ["workspace_id"], unique=False
    )

    # New unique constraint scoped by workspace
    op.create_index(
        "uix_template_workspace_type_content_lower",
        "templates",
        ["workspace_id", "type", sa.text("lower(content)")],
        unique=True,
    )

    # Add FK to workspaces (batch mode for SQLite compatibility)
    with op.batch_alter_table("templates") as batch_op:
        batch_op.create_foreign_key(
            "fk_templates_workspace_id_workspaces",
            "workspaces",
            ["workspace_id"],
            ["id"],
            ondelete="CASCADE",
        )


def downgrade() -> None:
    """Revert workspace scoping from templates table."""
    op.drop_constraint(
        "fk_templates_workspace_id_workspaces", "templates", type_="foreignkey"
    )
    op.drop_index("uix_template_workspace_type_content_lower", table_name="templates")
    op.drop_index(op.f("ix_templates_workspace_id"), table_name="templates")

    # Restore old unique index
    op.create_index(
        "uix_template_type_content_lower",
        "templates",
        ["type", sa.text("lower(content)")],
        unique=True,
    )

    # Drop workspace_id column
    op.drop_column("templates", "workspace_id")
