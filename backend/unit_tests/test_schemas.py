"""
Unit tests for Pydantic schemas.

Tests validation rules for workspace and project schemas including:
- Field validation (required, optional, max_length)
- Whitespace trimming
- Empty string to null conversion
- Type validation
- Workspace schemas (WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse)
- Updated ProjectResponse schema

Related: Issue #91 - Multi-Workspace Support
"""

import pytest
from pydantic import ValidationError

from app.schemas import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceUpdate,
)


class TestWorkspaceCreateSchema:
    """Tests for WorkspaceCreate schema validation."""

    def test_create_workspace_valid_full(self):
        """Test creating workspace with all valid fields."""
        data = {
            "name": "Test Workspace",
            "description": "A test workspace",
        }
        workspace = WorkspaceCreate(**data)

        assert workspace.name == "Test Workspace"
        assert workspace.description == "A test workspace"

    def test_create_workspace_valid_minimal(self):
        """Test creating workspace with only required fields."""
        data = {"name": "Minimal Workspace"}
        workspace = WorkspaceCreate(**data)

        assert workspace.name == "Minimal Workspace"
        assert workspace.description is None

    def test_create_workspace_name_required(self):
        """Test that name is required."""
        data = {"description": "No name provided"}

        with pytest.raises(ValidationError) as exc_info:
            WorkspaceCreate(**data)

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("name",) for error in errors)

    def test_create_workspace_name_too_long(self):
        """Test that name exceeding 100 chars is rejected."""
        data = {"name": "x" * 101}

        with pytest.raises(ValidationError) as exc_info:
            WorkspaceCreate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("name",) and "100" in str(error)
            for error in errors
        )

    def test_create_workspace_name_trim_whitespace(self):
        """Test that leading/trailing whitespace is trimmed from name."""
        data = {"name": "  Test Workspace  "}
        workspace = WorkspaceCreate(**data)

        assert workspace.name == "Test Workspace"

    def test_create_workspace_name_empty_after_trim(self):
        """Test that name with only whitespace fails validation."""
        data = {"name": "   "}

        with pytest.raises(ValidationError) as exc_info:
            WorkspaceCreate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("name",)
            and ("empty" in str(error).lower() or "whitespace" in str(error).lower())
            for error in errors
        )

    def test_create_workspace_description_max_length_valid(self):
        """Test that description with exactly 500 chars is accepted."""
        data = {"name": "Test", "description": "x" * 500}
        workspace = WorkspaceCreate(**data)

        assert len(workspace.description) == 500

    def test_create_workspace_description_too_long(self):
        """Test that description exceeding 500 chars is rejected."""
        data = {"name": "Test", "description": "x" * 501}

        with pytest.raises(ValidationError) as exc_info:
            WorkspaceCreate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("description",) and "500" in str(error)
            for error in errors
        )

    def test_create_workspace_empty_description_to_null(self):
        """Test that empty string description is converted to None."""
        data = {"name": "Test Workspace", "description": ""}
        workspace = WorkspaceCreate(**data)

        assert workspace.description is None

    def test_create_workspace_none_description(self):
        """Test that None description is accepted."""
        data = {"name": "Test Workspace", "description": None}
        workspace = WorkspaceCreate(**data)

        assert workspace.description is None


class TestWorkspaceUpdateSchema:
    """Tests for WorkspaceUpdate schema validation."""

    def test_update_workspace_all_fields(self):
        """Test updating all fields."""
        data = {
            "name": "Updated Name",
            "description": "Updated description",
        }
        workspace = WorkspaceUpdate(**data)

        assert workspace.name == "Updated Name"
        assert workspace.description == "Updated description"

    def test_update_workspace_partial_name_only(self):
        """Test partial update with only name."""
        data = {"name": "Updated Name"}
        workspace = WorkspaceUpdate(**data)

        assert workspace.name == "Updated Name"
        assert workspace.description is None

    def test_update_workspace_partial_description_only(self):
        """Test partial update with only description."""
        data = {"description": "Updated description"}
        workspace = WorkspaceUpdate(**data)

        assert workspace.name is None
        assert workspace.description == "Updated description"

    def test_update_workspace_empty_dict(self):
        """Test that empty update is valid (all fields optional)."""
        data = {}
        workspace = WorkspaceUpdate(**data)

        assert workspace.name is None
        assert workspace.description is None

    def test_update_workspace_name_trim_whitespace(self):
        """Test that leading/trailing whitespace is trimmed from name."""
        data = {"name": "  Updated Name  "}
        workspace = WorkspaceUpdate(**data)

        assert workspace.name == "Updated Name"

    def test_update_workspace_name_empty_after_trim(self):
        """Test that name with only whitespace fails validation."""
        data = {"name": "   "}

        with pytest.raises(ValidationError) as exc_info:
            WorkspaceUpdate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("name",)
            and ("empty" in str(error).lower() or "whitespace" in str(error).lower())
            for error in errors
        )

    def test_update_workspace_empty_description_to_null(self):
        """Test that empty string description is converted to None."""
        data = {"description": ""}
        workspace = WorkspaceUpdate(**data)

        assert workspace.description is None

    def test_update_workspace_name_too_long(self):
        """Test that name exceeding 100 chars is rejected."""
        data = {"name": "x" * 101}

        with pytest.raises(ValidationError) as exc_info:
            WorkspaceUpdate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("name",) and "100" in str(error)
            for error in errors
        )

    def test_update_workspace_description_too_long(self):
        """Test that description exceeding 500 chars is rejected."""
        data = {"description": "x" * 501}

        with pytest.raises(ValidationError) as exc_info:
            WorkspaceUpdate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("description",) and "500" in str(error)
            for error in errors
        )


class TestWorkspaceResponseSchema:
    """Tests for WorkspaceResponse schema."""

    def test_workspace_response_full(self):
        """Test workspace response with all fields."""
        from datetime import datetime

        data = {
            "id": 1,
            "name": "Test Workspace",
            "description": "A test workspace",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "project_count": 5,
        }
        workspace = WorkspaceResponse(**data)

        assert workspace.id == 1
        assert workspace.name == "Test Workspace"
        assert workspace.description == "A test workspace"
        assert workspace.project_count == 5

    def test_workspace_response_default_project_count(self):
        """Test that project_count defaults to 0."""
        from datetime import datetime

        data = {
            "id": 1,
            "name": "Test Workspace",
            "description": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        workspace = WorkspaceResponse(**data)

        assert workspace.project_count == 0

    def test_workspace_response_from_orm(self):
        """Test creating response from ORM model."""
        from datetime import datetime

        class MockWorkspace:
            """Mock workspace ORM model."""

            id = 1
            name = "Test Workspace"
            description = "A test description"
            created_at = datetime.now()
            updated_at = datetime.now()
            project_count = 3

        mock_workspace = MockWorkspace()
        workspace = WorkspaceResponse.model_validate(mock_workspace)

        assert workspace.id == 1
        assert workspace.name == "Test Workspace"


class TestProjectResponseSchema:
    """Tests for updated ProjectResponse schema."""

    def test_project_response_with_workspace_fields(self):
        """Test project response with workspace fields."""
        from datetime import datetime

        data = {
            "id": 1,
            "name": "Test Project",
            "description": "A test project",
            "status": "planned",
            "workspace_id": 1,
            "workspace_name": "Test Workspace",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        project = ProjectResponse(**data)

        assert project.id == 1
        assert project.name == "Test Project"
        assert project.workspace_id == 1
        assert project.workspace_name == "Test Workspace"

    def test_project_response_without_workspace(self):
        """Test project response without workspace fields."""
        from datetime import datetime

        data = {
            "id": 1,
            "name": "Test Project",
            "description": "A test project",
            "status": "planned",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        project = ProjectResponse(**data)

        assert project.id == 1
        assert project.name == "Test Project"
        assert project.workspace_id is None
        assert project.workspace_name is None

    def test_project_response_workspace_id_only(self):
        """Test project response with workspace_id but no workspace_name."""
        from datetime import datetime

        data = {
            "id": 1,
            "name": "Test Project",
            "description": "A test project",
            "status": "planned",
            "workspace_id": 1,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        project = ProjectResponse(**data)

        assert project.workspace_id == 1
        assert project.workspace_name is None


class TestSchemaValidationEdgeCases:
    """Tests for edge cases and boundary conditions."""

    def test_workspace_name_exactly_100_chars(self):
        """Test workspace name with exactly 100 characters."""
        data = {"name": "x" * 100}
        workspace = WorkspaceCreate(**data)

        assert len(workspace.name) == 100

    def test_workspace_description_exactly_500_chars(self):
        """Test workspace description with exactly 500 characters."""
        data = {"name": "Test", "description": "x" * 500}
        workspace = WorkspaceCreate(**data)

        assert len(workspace.description) == 500

    def test_workspace_name_with_special_characters(self):
        """Test workspace name with special characters."""
        data = {"name": "Test-Workspace_123!@#"}
        workspace = WorkspaceCreate(**data)

        assert workspace.name == "Test-Workspace_123!@#"

    def test_workspace_name_with_unicode(self):
        """Test workspace name with unicode characters."""
        data = {"name": "Test Workspace 日本語 🚀"}
        workspace = WorkspaceCreate(**data)

        assert workspace.name == "Test Workspace 日本語 🚀"

    def test_workspace_description_with_newlines(self):
        """Test workspace description with newlines."""
        data = {"name": "Test", "description": "Line 1\nLine 2\nLine 3"}
        workspace = WorkspaceCreate(**data)

        assert "\n" in workspace.description
        assert workspace.description == "Line 1\nLine 2\nLine 3"


class TestProjectCreateSchema:
    """Tests for ProjectCreate schema validation with video_title field."""

    def test_create_project_with_video_title(self):
        """Test creating project with video_title."""
        data = {
            "name": "Test Project",
            "description": "Test description",
            "video_title": "My Awesome Video Title",
        }
        project = ProjectCreate(**data)

        assert project.name == "Test Project"
        assert project.description == "Test description"
        assert project.video_title == "My Awesome Video Title"

    def test_create_project_video_title_optional(self):
        """Test that video_title is optional."""
        data = {"name": "Test Project"}
        project = ProjectCreate(**data)

        assert project.name == "Test Project"
        assert project.video_title is None

    def test_create_project_empty_video_title_to_null(self):
        """Test that empty video_title converts to None."""
        data = {
            "name": "Test Project",
            "video_title": "",
        }
        project = ProjectCreate(**data)

        assert project.video_title is None

    def test_create_project_video_title_max_length_valid(self):
        """Test that video_title with exactly 500 chars is accepted."""
        data = {"name": "Test Project", "video_title": "x" * 500}
        project = ProjectCreate(**data)

        assert len(project.video_title) == 500

    def test_create_project_video_title_too_long(self):
        """Test that video_title exceeding 500 chars is rejected."""
        data = {"name": "Test Project", "video_title": "x" * 501}

        with pytest.raises(ValidationError) as exc_info:
            ProjectCreate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("video_title",) and "500" in str(error) for error in errors
        )

    def test_create_project_video_title_with_special_chars(self):
        """Test video_title with special characters."""
        data = {
            "name": "Test Project",
            "video_title": "How to Train Your Dog - Complete Guide! 🐕",
        }
        project = ProjectCreate(**data)

        assert project.video_title == "How to Train Your Dog - Complete Guide! 🐕"

    def test_create_project_video_title_none(self):
        """Test that None video_title is accepted."""
        data = {"name": "Test Project", "video_title": None}
        project = ProjectCreate(**data)

        assert project.video_title is None


class TestProjectUpdateSchema:
    """Tests for ProjectUpdate schema validation with video_title field."""

    def test_update_project_video_title(self):
        """Test updating video_title."""
        data = {"video_title": "Updated Video Title"}
        project = ProjectUpdate(**data)

        assert project.video_title == "Updated Video Title"

    def test_update_project_video_title_to_null(self):
        """Test updating video_title to None (clearing it)."""
        data = {"video_title": None}
        project = ProjectUpdate(**data)

        assert project.video_title is None

    def test_update_project_empty_video_title_to_null(self):
        """Test that empty string video_title converts to None."""
        data = {"video_title": ""}
        project = ProjectUpdate(**data)

        assert project.video_title is None

    def test_update_project_video_title_max_length_valid(self):
        """Test that video_title with exactly 500 chars is accepted."""
        data = {"video_title": "x" * 500}
        project = ProjectUpdate(**data)

        assert len(project.video_title) == 500

    def test_update_project_video_title_too_long(self):
        """Test that video_title exceeding 500 chars is rejected."""
        data = {"video_title": "x" * 501}

        with pytest.raises(ValidationError) as exc_info:
            ProjectUpdate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("video_title",) and "500" in str(error) for error in errors
        )

    def test_update_project_partial_fields_with_video_title(self):
        """Test partial update including video_title."""
        data = {"name": "Updated Name", "video_title": "New Video Title"}
        project = ProjectUpdate(**data)

        assert project.name == "Updated Name"
        assert project.video_title == "New Video Title"
        assert project.description is None
        assert project.status is None

    def test_update_project_all_fields_none(self):
        """Test that empty update is valid (all fields optional)."""
        data = {}
        project = ProjectUpdate(**data)

        assert project.name is None
        assert project.description is None
        assert project.status is None
        assert project.video_title is None
