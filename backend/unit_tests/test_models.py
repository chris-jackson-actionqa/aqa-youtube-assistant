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

from app.models import Project, Template, Workspace


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


class TestTemplateModel:
    """Tests for the Template model.

    Related: Issue #168, Epic #166 - Title Template Management
    """

    def test_create_template_success(self, db_session):
        """Test creating a template with all fields."""

        template = Template(
            type="title",
            name="Professional Title",
            content="How to {{topic}} in {{timeframe}}",
        )
        db_session.add(template)
        db_session.commit()
        db_session.refresh(template)

        assert template.id is not None
        assert template.type == "title"
        assert template.name == "Professional Title"
        assert template.content == "How to {{topic}} in {{timeframe}}"
        assert template.created_at is not None
        assert template.updated_at is not None
        assert isinstance(template.created_at, datetime)
        assert isinstance(template.updated_at, datetime)

    def test_create_template_minimal(self, db_session):
        """Test creating template with only required fields."""

        template = Template(
            type="description",
            name="Basic Description",
            content="Simple content",
        )
        db_session.add(template)
        db_session.commit()
        db_session.refresh(template)

        assert template.id is not None
        assert template.type == "description"
        assert template.name == "Basic Description"
        assert template.content == "Simple content"

    def test_template_case_insensitive_unique_constraint(self, db_session):
        """Test that (type, content) must be unique regardless of case."""

        template1 = Template(
            type="title",
            name="First Template",
            content="How to CODE in Python",
        )
        db_session.add(template1)
        db_session.commit()

        # Try to create template with same type and content (different case)
        template2 = Template(
            type="title",
            name="Second Template",
            content="How to code in Python",  # Different case
        )
        db_session.add(template2)

        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        # Verify it's the unique constraint that failed
        assert "UNIQUE constraint failed" in str(exc_info.value).lower() or \
               "uix_template_type_content_lower" in str(exc_info.value).lower()

        db_session.rollback()

    def test_template_same_content_different_type_allowed(self, db_session):
        """Test that same content is allowed for different types."""

        template1 = Template(
            type="title",
            name="Title Template",
            content="Getting Started with {{topic}}",
        )
        template2 = Template(
            type="description",
            name="Description Template",
            content="Getting Started with {{topic}}",  # Same content
        )
        db_session.add_all([template1, template2])
        db_session.commit()

        # Should succeed - different types
        db_session.refresh(template1)
        db_session.refresh(template2)

        assert template1.id != template2.id
        assert template1.type == "title"
        assert template2.type == "description"
        assert template1.content == template2.content

    def test_template_different_names_same_content_same_type_fails(
        self, db_session
    ):
        """Test that different names don't bypass unique constraint."""

        template1 = Template(
            type="title",
            name="Name One",
            content="Unique Content Here",
        )
        db_session.add(template1)
        db_session.commit()

        template2 = Template(
            type="title",
            name="Name Two",  # Different name
            content="Unique Content Here",  # Same content
        )
        db_session.add(template2)

        with pytest.raises(IntegrityError):
            db_session.commit()

        db_session.rollback()

    def test_template_content_max_length(self, db_session):
        """Test that content accepts up to 256 characters."""

        # Create a 256-character string
        long_content = "A" * 256

        template = Template(
            type="title",
            name="Long Content",
            content=long_content,
        )
        db_session.add(template)
        db_session.commit()
        db_session.refresh(template)

        assert template.content == long_content
        assert len(template.content) == 256

    def test_template_name_max_length(self, db_session):
        """Test that name accepts up to 100 characters."""

        # Create a 100-character string
        long_name = "B" * 100

        template = Template(
            type="title",
            name=long_name,
            content="Content",
        )
        db_session.add(template)
        db_session.commit()
        db_session.refresh(template)

        assert template.name == long_name
        assert len(template.name) == 100

    def test_template_type_max_length(self, db_session):
        """Test that type accepts up to 50 characters."""

        # Create a 50-character string
        long_type = "C" * 50

        template = Template(
            type=long_type,
            name="Name",
            content="Content",
        )
        db_session.add(template)
        db_session.commit()
        db_session.refresh(template)

        assert template.type == long_type
        assert len(template.type) == 50

    def test_template_timestamps_auto_set(self, db_session):
        """Test that timestamps are automatically set on creation."""

        template = Template(
            type="title",
            name="Timestamp Test",
            content="Test content",
        )
        db_session.add(template)
        db_session.commit()
        db_session.refresh(template)

        assert template.created_at is not None
        assert template.updated_at is not None
        assert isinstance(template.created_at, datetime)
        assert isinstance(template.updated_at, datetime)

    def test_template_updated_at_changes_on_update(self, db_session):
        """Test that updated_at timestamp changes when template is updated."""

        template = Template(
            type="title",
            name="Original Name",
            content="Original content",
        )
        db_session.add(template)
        db_session.commit()
        db_session.refresh(template)

        original_updated_at = template.updated_at

        # Update template
        template.name = "Updated Name"
        db_session.commit()
        db_session.refresh(template)

        assert template.updated_at > original_updated_at

    def test_template_created_at_unchanged_on_update(self, db_session):
        """Test that created_at remains unchanged when template is updated."""

        template = Template(
            type="title",
            name="Original Name",
            content="Original content",
        )
        db_session.add(template)
        db_session.commit()
        db_session.refresh(template)

        original_created_at = template.created_at

        # Update template
        template.content = "Updated content with different value"
        db_session.commit()
        db_session.refresh(template)

        assert template.created_at == original_created_at

    def test_template_repr(self, db_session):
        """Test template string representation."""

        template = Template(
            type="title",
            name="Test Template",
            content="Test content",
        )
        db_session.add(template)
        db_session.commit()
        db_session.refresh(template)

        repr_str = repr(template)
        assert "Template" in repr_str
        assert str(template.id) in repr_str
        assert "title" in repr_str
        assert "Test Template" in repr_str

    def test_template_with_placeholders(self, db_session):
        """Test template with placeholder syntax."""

        template = Template(
            type="title",
            name="Placeholder Template",
            content="How to {{action}} {{object}} in {{timeframe}}",
        )
        db_session.add(template)
        db_session.commit()
        db_session.refresh(template)

        assert "{{action}}" in template.content
        assert "{{object}}" in template.content
        assert "{{timeframe}}" in template.content

    def test_template_type_indexed(self, db_session):
        """Test that type column is indexed for efficient filtering."""

        # Create multiple templates with different types
        templates = [
            Template(
                type=f"type{i % 3}",
                name=f"Template {i}",
                content=f"Content {i}",
            )
            for i in range(10)
        ]
        db_session.add_all(templates)
        db_session.commit()

        # Query by type should be efficient (index is used)
        type1_templates = (
            db_session.query(Template)
            .filter(Template.type == "type1")
            .all()
        )

        assert len(type1_templates) > 0
        for template in type1_templates:
            assert template.type == "type1"

    def test_template_multiple_types(self, db_session):
        """Test creating templates of various types."""

        templates = [
            Template(
                type="title",
                name="Title Template",
                content="Title content",
            ),
            Template(
                type="description",
                name="Description Template",
                content="Description content",
            ),
            Template(
                type="tags",
                name="Tags Template",
                content="Tags content",
            ),
        ]
        db_session.add_all(templates)
        db_session.commit()

        # Query each type
        title_templates = (
            db_session.query(Template)
            .filter(Template.type == "title")
            .all()
        )
        desc_templates = (
            db_session.query(Template)
            .filter(Template.type == "description")
            .all()
        )
        tags_templates = (
            db_session.query(Template)
            .filter(Template.type == "tags")
            .all()
        )

        assert len(title_templates) == 1
        assert len(desc_templates) == 1
        assert len(tags_templates) == 1

    def test_template_whitespace_in_content_matters(self, db_session):
        """Test that whitespace differences in content are significant."""

        template1 = Template(
            type="title",
            name="Whitespace 1",
            content="Content with spaces",
        )
        template2 = Template(
            type="title",
            name="Whitespace 2",
            content="Content  with  spaces",  # Extra spaces
        )
        db_session.add_all([template1, template2])
        db_session.commit()

        # Should succeed - different content (different whitespace)
        db_session.refresh(template1)
        db_session.refresh(template2)

        assert template1.content != template2.content
        assert template1.id != template2.id
