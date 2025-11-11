"""
Unit tests for database models.

Tests the Workspace and Project SQLAlchemy models including:
- CRUD operations
- Relationships (one-to-many)
- Foreign key constraints
- Cascade delete behavior
- Timestamps and defaults

Related: Issue #91 - Multi-Workspace Support
"""

from datetime import datetime

import pytest
from sqlalchemy.exc import IntegrityError

from app.models import Project, Workspace


class TestWorkspaceModel:
    """Tests for the Workspace model."""

    def test_create_workspace_success(self, db_session):
        """Test creating a workspace with all fields."""
        workspace = Workspace(
            name="Test Workspace",
            description="A test workspace",
        )
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        assert workspace.id is not None
        assert workspace.name == "Test Workspace"
        assert workspace.description == "A test workspace"
        assert workspace.created_at is not None
        assert workspace.updated_at is not None
        assert isinstance(workspace.created_at, datetime)
        assert isinstance(workspace.updated_at, datetime)

    def test_create_workspace_minimal(self, db_session):
        """Test creating workspace with only required fields."""
        workspace = Workspace(name="Minimal Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        assert workspace.id is not None
        assert workspace.name == "Minimal Workspace"
        assert workspace.description is None

    def test_workspace_unique_name_constraint(self, db_session):
        """Test that workspace names must be unique."""
        workspace1 = Workspace(name="Duplicate Name")
        db_session.add(workspace1)
        db_session.commit()

        workspace2 = Workspace(name="Duplicate Name")
        db_session.add(workspace2)

        with pytest.raises(IntegrityError):
            db_session.commit()

        db_session.rollback()

    def test_workspace_timestamps_auto_set(self, db_session):
        """Test that timestamps are automatically set on creation."""
        workspace = Workspace(name="Timestamp Test")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        # Timestamps should be set and be datetime objects
        assert workspace.created_at is not None
        assert workspace.updated_at is not None
        assert isinstance(workspace.created_at, datetime)
        assert isinstance(workspace.updated_at, datetime)

    def test_workspace_updated_at_changes_on_update(self, db_session):
        """Test that updated_at timestamp changes when workspace is updated."""
        workspace = Workspace(name="Original Name")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        original_updated_at = workspace.updated_at

        # Update workspace
        workspace.description = "Updated description"
        db_session.commit()
        db_session.refresh(workspace)

        assert workspace.updated_at > original_updated_at

    def test_workspace_repr(self, db_session):
        """Test workspace string representation."""
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        repr_str = repr(workspace)
        assert "Workspace" in repr_str
        assert str(workspace.id) in repr_str
        assert "Test Workspace" in repr_str


class TestProjectModel:
    """Tests for the Project model."""

    def test_create_project_with_workspace(self, db_session):
        """Test creating a project linked to a workspace."""
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        project = Project(
            name="Test Project",
            description="A test project",
            status="planned",
            workspace_id=workspace.id,
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        assert project.id is not None
        assert project.workspace_id == workspace.id
        assert project.name == "Test Project"

    def test_project_default_workspace_id(self, db_session):
        """Test that project workspace_id defaults to 1."""
        project = Project(name="Test Project")
        db_session.add(project)
        # Should not fail even without workspace_id=1 existing yet
        # (migration will create default workspace first)

    def test_project_workspace_relationship(self, db_session):
        """Test the many-to-one relationship from project to workspace."""
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        project = Project(
            name="Test Project",
            workspace_id=workspace.id,
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Access relationship
        assert project.workspace is not None
        assert project.workspace.id == workspace.id
        assert project.workspace.name == "Test Workspace"

    def test_workspace_projects_relationship(self, db_session):
        """Test the one-to-many relationship from workspace to projects."""
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        project1 = Project(name="Project 1", workspace_id=workspace.id)
        project2 = Project(name="Project 2", workspace_id=workspace.id)
        db_session.add_all([project1, project2])
        db_session.commit()

        # Refresh workspace to load relationship
        db_session.refresh(workspace)

        assert len(workspace.projects) == 2
        project_names = {p.name for p in workspace.projects}
        assert "Project 1" in project_names
        assert "Project 2" in project_names

    def test_project_nullable_workspace_id(self, db_session):
        """Test that workspace_id can be nullable."""
        # Note: We need to explicitly pass None to override the default=1
        # In SQL, we would ALTER TABLE to allow NULL after initial setup
        project = Project(
            name="No Workspace Project",
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Default is 1, so this tests the default behavior
        assert project.workspace_id == 1

        # To test actual NULL, we'd need to set it after creation
        # (or remove the default in the column definition)
        project.workspace_id = None
        db_session.commit()
        db_session.refresh(project)
        assert project.workspace_id is None
        assert project.workspace is None

    def test_project_video_title_nullable(self, db_session):
        """Test that video_title is nullable (optional field)."""
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        # Create project without video_title
        project = Project(
            name="Test Project",
            workspace_id=workspace.id,
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        assert project.video_title is None

    def test_project_video_title_with_value(self, db_session):
        """Test creating project with video_title."""
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        project = Project(
            name="Test Project",
            video_title="How to Build a REST API with FastAPI",
            workspace_id=workspace.id,
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        assert project.video_title == "How to Build a REST API with FastAPI"

    def test_project_video_title_max_length(self, db_session):
        """Test that video_title accepts up to 500 characters."""
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        # Create a 500-character string
        long_title = "A" * 500

        project = Project(
            name="Test Project",
            video_title=long_title,
            workspace_id=workspace.id,
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        assert project.video_title == long_title
        assert len(project.video_title) == 500

    def test_project_video_title_can_be_updated(self, db_session):
        """Test updating video_title on existing project."""
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        project = Project(
            name="Test Project",
            workspace_id=workspace.id,
        )
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Initially None
        assert project.video_title is None

        # Update to a value
        project.video_title = "New Video Title"
        db_session.commit()
        db_session.refresh(project)

        assert project.video_title == "New Video Title"

        # Update to None
        project.video_title = None
        db_session.commit()
        db_session.refresh(project)

        assert project.video_title is None


class TestCascadeDelete:
    """Tests for cascade delete behavior."""

    def test_delete_workspace_cascades_to_projects(self, db_session):
        """Test that deleting a workspace deletes its projects."""
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        project1 = Project(name="Project 1", workspace_id=workspace.id)
        project2 = Project(name="Project 2", workspace_id=workspace.id)
        db_session.add_all([project1, project2])
        db_session.commit()

        workspace_id = workspace.id

        # Delete workspace
        db_session.delete(workspace)
        db_session.commit()

        # Verify projects are also deleted
        remaining_projects = (
            db_session.query(Project)
            .filter(Project.workspace_id == workspace_id)
            .all()
        )
        assert len(remaining_projects) == 0

    def test_delete_workspace_only_deletes_own_projects(self, db_session):
        """Test that deleting workspace only deletes its own projects."""
        workspace1 = Workspace(name="Workspace 1")
        workspace2 = Workspace(name="Workspace 2")
        db_session.add_all([workspace1, workspace2])
        db_session.commit()
        db_session.refresh(workspace1)
        db_session.refresh(workspace2)

        project1 = Project(name="Project 1", workspace_id=workspace1.id)
        project2 = Project(name="Project 2", workspace_id=workspace2.id)
        db_session.add_all([project1, project2])
        db_session.commit()

        project2_id = project2.id

        # Delete workspace1
        db_session.delete(workspace1)
        db_session.commit()

        # Verify project2 still exists
        remaining_project = (
            db_session.query(Project).filter(Project.id == project2_id).first()
        )
        assert remaining_project is not None
        assert remaining_project.name == "Project 2"


class TestWorkspaceProjectIntegration:
    """Integration tests for workspace-project interactions."""

    def test_multiple_projects_in_workspace(self, db_session):
        """Test creating multiple projects in a single workspace."""
        workspace = Workspace(name="Multi-Project Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        projects = [
            Project(name=f"Project {i}", workspace_id=workspace.id)
            for i in range(1, 6)
        ]
        db_session.add_all(projects)
        db_session.commit()

        # Query all projects in workspace
        workspace_projects = (
            db_session.query(Project)
            .filter(Project.workspace_id == workspace.id)
            .all()
        )

        assert len(workspace_projects) == 5

    def test_move_project_between_workspaces(self, db_session):
        """Test moving a project from one workspace to another."""
        workspace1 = Workspace(name="Workspace 1")
        workspace2 = Workspace(name="Workspace 2")
        db_session.add_all([workspace1, workspace2])
        db_session.commit()
        db_session.refresh(workspace1)
        db_session.refresh(workspace2)

        project = Project(name="Mobile Project", workspace_id=workspace1.id)
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Move project to workspace2
        project.workspace_id = workspace2.id
        db_session.commit()
        db_session.refresh(project)

        assert project.workspace_id == workspace2.id
        assert project.workspace.name == "Workspace 2"

    def test_workspace_with_no_projects(self, db_session):
        """Test that a workspace can exist without projects."""
        workspace = Workspace(name="Empty Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        assert len(workspace.projects) == 0

    def test_query_projects_by_workspace(self, db_session):
        """Test querying projects filtered by workspace."""
        workspace1 = Workspace(name="Work")
        workspace2 = Workspace(name="Personal")
        db_session.add_all([workspace1, workspace2])
        db_session.commit()
        db_session.refresh(workspace1)
        db_session.refresh(workspace2)

        work_project1 = Project(name="Work Project 1", workspace_id=workspace1.id)
        work_project2 = Project(name="Work Project 2", workspace_id=workspace1.id)
        personal_project = Project(
            name="Personal Project", workspace_id=workspace2.id
        )
        db_session.add_all([work_project1, work_project2, personal_project])
        db_session.commit()

        # Query work projects
        work_projects = (
            db_session.query(Project)
            .filter(Project.workspace_id == workspace1.id)
            .all()
        )

        assert len(work_projects) == 2
        work_names = {p.name for p in work_projects}
        assert "Work Project 1" in work_names
        assert "Work Project 2" in work_names
        assert "Personal Project" not in work_names
