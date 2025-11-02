"""
Unit tests for migrations module.

Tests automatic database migration functionality.

Related: Issue #99
"""

import logging
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.migrations import run_migrations


class TestRunMigrations:
    """Tests for run_migrations function."""

    @patch("app.migrations.command")
    @patch("app.migrations.Config")
    def test_successful_migration(self, mock_config_class, mock_command):
        """Test that migrations run successfully with correct configuration."""
        # Arrange
        mock_alembic_config = MagicMock()
        mock_config_class.return_value = mock_alembic_config

        # Act
        run_migrations()

        # Assert
        # Verify Config was created with correct alembic.ini path
        expected_alembic_ini = Path(__file__).parent.parent / "alembic.ini"
        mock_config_class.assert_called_once()
        actual_path = mock_config_class.call_args[0][0]
        assert Path(actual_path) == expected_alembic_ini

        # Verify upgrade command was called with "head"
        mock_command.upgrade.assert_called_once_with(
            mock_alembic_config, "head"
        )

    @patch("app.migrations.command")
    @patch("app.migrations.Config")
    @patch("app.migrations.Path")
    def test_migration_with_alembic_ini_not_found(
        self, mock_path, mock_config_class, mock_command
    ):
        """Test FileNotFoundError when alembic.ini is missing."""
        # Arrange - set up the Path mock chain
        mock_file_path = MagicMock()
        mock_parent = MagicMock()
        mock_alembic_ini_path = MagicMock()

        # Chain: Path(__file__).parent.parent / "alembic.ini"
        mock_path.return_value = mock_file_path
        mock_file_path.parent = mock_parent
        mock_parent.parent = mock_parent  # parent.parent
        mock_parent.__truediv__ = MagicMock(return_value=mock_alembic_ini_path)
        mock_alembic_ini_path.exists.return_value = False
        mock_alembic_ini_path.__str__ = lambda self: "/fake/path/alembic.ini"

        # Act & Assert
        with pytest.raises(
            FileNotFoundError, match="Alembic config not found"
        ):
            run_migrations()

        # Verify upgrade was not called
        mock_command.upgrade.assert_not_called()

    @patch("app.migrations.command")
    @patch("app.migrations.Config")
    def test_migration_with_alembic_error(
        self, mock_config_class, mock_command
    ):
        """Test that exceptions during migration are propagated."""
        # Arrange
        mock_alembic_config = MagicMock()
        mock_config_class.return_value = mock_alembic_config
        mock_command.upgrade.side_effect = RuntimeError(
            "Migration failed: column already exists"
        )

        # Act & Assert
        with pytest.raises(
            RuntimeError, match="Migration failed: column already exists"
        ):
            run_migrations()

    @patch("app.migrations.command")
    @patch("app.migrations.Config")
    def test_migration_logs_success(
        self, mock_config_class, mock_command, caplog
    ):
        """Test that successful migration is logged."""
        # Arrange
        mock_alembic_config = MagicMock()
        mock_config_class.return_value = mock_alembic_config

        # Act
        with caplog.at_level(logging.INFO):
            run_migrations()

        # Assert - check for actual log messages from the module
        assert "🔄 Running database migrations..." in caplog.text
        assert "✅ Database migrations complete" in caplog.text

    @patch("app.migrations.command")
    @patch("app.migrations.Config")
    @patch("app.migrations.Path")
    def test_migration_logs_error_on_missing_config(
        self, mock_path, mock_config_class, mock_command, caplog
    ):
        """Test that FileNotFoundError is logged with helpful message."""
        # Arrange - set up the Path mock chain to simulate missing file
        mock_file_path = MagicMock()
        mock_parent = MagicMock()
        mock_alembic_ini_path = MagicMock()

        mock_path.return_value = mock_file_path
        mock_file_path.parent = mock_parent
        mock_parent.parent = mock_parent
        mock_parent.__truediv__ = MagicMock(return_value=mock_alembic_ini_path)
        mock_alembic_ini_path.exists.return_value = False
        mock_alembic_ini_path.__str__ = lambda self: "/fake/path/alembic.ini"

        # Act & Assert
        with caplog.at_level(logging.ERROR):
            with pytest.raises(FileNotFoundError):
                run_migrations()

        # Verify error was logged
        assert "❌ Alembic config not found" in caplog.text

    @patch("app.migrations.command")
    @patch("app.migrations.Config")
    def test_migration_logs_error_on_migration_failure(
        self, mock_config_class, mock_command, caplog
    ):
        """Test that migration errors are logged before propagating."""
        # Arrange
        mock_alembic_config = MagicMock()
        mock_config_class.return_value = mock_alembic_config
        mock_command.upgrade.side_effect = RuntimeError("Database locked")

        # Act & Assert
        with caplog.at_level(logging.ERROR):
            with pytest.raises(RuntimeError):
                run_migrations()

        # Verify error was logged with the exact format from the module
        assert "❌ Migration failed: Database locked" in caplog.text

    @patch("app.migrations.command")
    @patch("app.migrations.Config")
    def test_migration_is_idempotent(
        self, mock_config_class, mock_command
    ):
        """Test that running migrations multiple times is safe."""
        # Arrange
        mock_alembic_config = MagicMock()
        mock_config_class.return_value = mock_alembic_config

        # Act - run migrations twice
        run_migrations()
        run_migrations()

        # Assert - both calls should succeed
        assert mock_command.upgrade.call_count == 2
        # Both calls should use "head" revision
        for call in mock_command.upgrade.call_args_list:
            assert call[0][1] == "head"

    @patch("app.migrations.command")
    @patch("app.migrations.Config")
    def test_migration_config_uses_correct_path_resolution(
        self, mock_config_class, mock_command
    ):
        """Test alembic.ini path is resolved correctly."""
        # Arrange
        mock_alembic_config = MagicMock()
        mock_config_class.return_value = mock_alembic_config

        # Act
        run_migrations()

        # Assert - verify path construction logic
        actual_path = mock_config_class.call_args[0][0]
        actual_path_obj = Path(actual_path)

        # Path should be absolute
        assert actual_path_obj.is_absolute()

        # Path should end with backend/alembic.ini
        assert actual_path_obj.name == "alembic.ini"
        assert actual_path_obj.parent.name == "backend"
