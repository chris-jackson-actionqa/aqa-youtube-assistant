"""Database migration utilities."""
import logging
from pathlib import Path

from alembic.config import Config

from alembic import command

logger = logging.getLogger(__name__)


def run_migrations() -> None:
    """
    Run database migrations to latest version.

    This function is called on application startup to ensure
    the database schema is up-to-date. It's safe to call
    multiple times - if migrations are already applied, it's a no-op.

    Raises:
        FileNotFoundError: If alembic.ini not found
        Exception: If migration fails
    """
    try:
        # Get path to alembic.ini relative to this file
        alembic_cfg_path = Path(__file__).parent.parent / "alembic.ini"

        if not alembic_cfg_path.exists():
            logger.error(f"❌ Alembic config not found: {alembic_cfg_path}")
            raise FileNotFoundError(f"Alembic config not found: {alembic_cfg_path}")

        alembic_cfg = Config(str(alembic_cfg_path))

        # Run migrations to latest version
        logger.info("🔄 Running database migrations...")
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Database migrations complete")

    except FileNotFoundError:
        # Re-raise FileNotFoundError as-is
        raise
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise
