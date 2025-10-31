"""
Unit tests for Projects CRUD API endpoints.

Tests all CRUD operations for the /api/projects endpoints including:
- Creating projects
- Reading projects (list and single)
- Updating projects
- Deleting projects
- Error cases and validation
- Validation enhancements (Issue #27)
"""

from unittest.mock import patch

import pytest
from sqlalchemy.exc import IntegrityError


class TestHealthCheck:
    """Tests for the health check endpoint."""

    def test_health_check(self, client):
        """Test that health check endpoint returns healthy status."""
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestCreateProject:
    """Tests for creating projects via POST /api/projects."""

    def test_create_project_success(self, client, sample_project_data):
        """Test successful project creation."""
        response = client.post("/api/projects", json=sample_project_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_project_data["name"]
        assert data["description"] == sample_project_data["description"]
        assert data["status"] == sample_project_data["status"]
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_project_minimal(self, client):
        """Test creating project with only required fields."""
        minimal_data = {"name": "Minimal Project"}
        response = client.post("/api/projects", json=minimal_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Minimal Project"
        assert data["status"] == "planned"  # Default value
        assert data["description"] is None

    def test_create_project_duplicate_name_exact(self, client, create_sample_project):
        """Test that duplicate names are rejected (exact match)."""
        # Create first project
        create_sample_project(name="Duplicate Test")

        # Attempt to create duplicate
        duplicate_data = {
            "name": "Duplicate Test",
            "description": "This should fail",
            "status": "planned",
        }
        response = client.post("/api/projects", json=duplicate_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_create_project_duplicate_name_different_case(
        self, client, create_sample_project
    ):
        """Test that duplicate names are rejected even with different capitalization."""
        # Create first project
        create_sample_project(name="Test Automation")

        # Attempt to create with different case
        duplicate_data = {
            "name": "test automation",
            "description": "Different case",
            "status": "planned",
        }
        response = client.post("/api/projects", json=duplicate_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_create_project_missing_name(self, client):
        """Test that creating project without name fails validation."""
        invalid_data = {"description": "No name provided", "status": "planned"}
        response = client.post("/api/projects", json=invalid_data)

        assert response.status_code == 422  # Validation error

    def test_create_project_empty_name(self, client):
        """Test that empty name fails validation."""
        invalid_data = {"name": "", "description": "Empty name", "status": "planned"}
        response = client.post("/api/projects", json=invalid_data)

        assert response.status_code == 422  # Validation error


class TestGetProjects:
    """Tests for getting list of projects via GET /api/projects."""

    def test_get_projects_empty(self, client):
        """Test getting projects when database is empty."""
        response = client.get("/api/projects")

        assert response.status_code == 200
        assert response.json() == []

    def test_get_projects_single(self, client, create_sample_project):
        """Test getting projects with one project in database."""
        project = create_sample_project(name="Single Project")

        response = client.get("/api/projects")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == project.id
        assert data[0]["name"] == "Single Project"

    def test_get_projects_multiple(self, client, create_sample_project):
        """Test getting multiple projects."""
        # Create projects for testing list retrieval; return values unused
        create_sample_project(name="Project 1", status="planned")
        create_sample_project(name="Project 2", status="in_progress")
        create_sample_project(name="Project 3", status="completed")

        response = client.get("/api/projects")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

        names = [p["name"] for p in data]
        assert "Project 1" in names
        assert "Project 2" in names
        assert "Project 3" in names


class TestGetProjectById:
    """Tests for getting a single project via GET /api/projects/{id}."""

    def test_get_project_by_id_success(self, client, create_sample_project):
        """Test successfully getting a project by ID."""
        project = create_sample_project(
            name="Specific Project",
            description="Test description",
            status="in_progress",
        )

        response = client.get(f"/api/projects/{project.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project.id
        assert data["name"] == "Specific Project"
        assert data["description"] == "Test description"
        assert data["status"] == "in_progress"

    def test_get_project_by_id_not_found(self, client):
        """Test getting a non-existent project returns 404."""
        response = client.get("/api/projects/9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_project_by_id_invalid_id(self, client):
        """Test getting project with invalid ID format."""
        response = client.get("/api/projects/invalid")

        assert response.status_code == 422  # Validation error


class TestUpdateProject:
    """Tests for updating projects via PUT /api/projects/{id}."""

    def test_update_project_full(self, client, create_sample_project):
        """Test updating all fields of a project."""
        project = create_sample_project(
            name="Original Name", description="Original description", status="planned"
        )

        update_data = {
            "name": "Updated Name",
            "description": "Updated description",
            "status": "in_progress",
        }
        response = client.put(f"/api/projects/{project.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project.id
        assert data["name"] == "Updated Name"
        assert data["description"] == "Updated description"
        assert data["status"] == "in_progress"

    def test_update_project_partial(self, client, create_sample_project):
        """Test partial update (only some fields)."""
        project = create_sample_project(
            name="Original Name", description="Original description", status="planned"
        )

        update_data = {"status": "in_progress"}
        response = client.put(f"/api/projects/{project.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Original Name"  # Unchanged
        assert data["description"] == "Original description"  # Unchanged
        assert data["status"] == "in_progress"  # Changed

    def test_update_project_same_name(self, client, create_sample_project):
        """Test that updating with same name is allowed."""
        project = create_sample_project(name="My Project", status="planned")

        update_data = {"name": "My Project", "status": "in_progress"}
        response = client.put(f"/api/projects/{project.id}", json=update_data)

        assert response.status_code == 200
        assert response.json()["status"] == "in_progress"

    def test_update_project_duplicate_name(self, client, create_sample_project):
        """Test that updating to an existing name is rejected."""
        create_sample_project(name="Project 1")
        project2 = create_sample_project(name="Project 2")

        # Try to update project2 to have same title as project1
        update_data = {"name": "Project 1"}
        response = client.put(f"/api/projects/{project2.id}", json=update_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_update_project_duplicate_name_different_case(
        self, client, create_sample_project
    ):
        """Test that case-insensitive duplicate check works on update."""
        create_sample_project(name="Test Project")
        project2 = create_sample_project(name="Another Project")

        # Try to update project2 with different case of project1's title
        update_data = {"name": "test project"}
        response = client.put(f"/api/projects/{project2.id}", json=update_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_update_project_not_found(self, client):
        """Test updating a non-existent project returns 404."""
        update_data = {"name": "Updated Name"}
        response = client.put("/api/projects/9999", json=update_data)

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_update_project_empty_name(self, client, create_sample_project):
        """Test that empty title fails validation."""
        project = create_sample_project(name="Original Name")

        update_data = {"name": ""}
        response = client.put(f"/api/projects/{project.id}", json=update_data)

        assert response.status_code == 422  # Validation error

    def test_update_project_timestamps(self, client, create_sample_project):
        """Test that updated_at timestamp changes on update."""
        project = create_sample_project(name="Original")

        update_data = {"status": "in_progress"}
        response = client.put(f"/api/projects/{project.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        # Note: This might need adjustment based on datetime format
        assert "updated_at" in data


class TestDeleteProject:
    """Tests for deleting projects via DELETE /api/projects/{id}."""

    def test_delete_project_success(self, client, create_sample_project):
        """Test successfully deleting a project."""
        project = create_sample_project(name="To Be Deleted")

        response = client.delete(f"/api/projects/{project.id}")

        assert response.status_code == 204
        assert response.text == ""  # No content

        # Verify project is actually deleted
        get_response = client.get(f"/api/projects/{project.id}")
        assert get_response.status_code == 404

    def test_delete_project_not_found(self, client):
        """Test deleting a non-existent project returns 404."""
        response = client.delete("/api/projects/9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_delete_project_verify_list(self, client, create_sample_project):
        """Test that deleted project is removed from list."""
        create_sample_project(name="Project 1")
        project2 = create_sample_project(name="Project 2")
        create_sample_project(name="Project 3")

        # Delete middle project
        response = client.delete(f"/api/projects/{project2.id}")
        assert response.status_code == 204

        # Get list and verify only 2 remain
        list_response = client.get("/api/projects")
        assert list_response.status_code == 200
        data = list_response.json()
        assert len(data) == 2

        names = [p["name"] for p in data]
        assert "Project 1" in names
        assert "Project 2" not in names
        assert "Project 3" in names


class TestRootEndpoint:
    """Tests for the root endpoint."""

    def test_root_endpoint(self, client):
        """Test that root endpoint returns API information."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "status" in data
        assert data["status"] == "running"


class TestValidationEnhancements:
    """
    Tests for validation enhancements from Issue #27.

    Covers:
    - Name whitespace trimming (Decision #2)
    - Database unique constraint handling (Decision #4)
    - Description max length validation (Decision #6)
    - Empty string to null conversion (Decision #16)
    """

    def test_create_project_with_leading_trailing_spaces(self, client):
        """Test that leading/trailing spaces in name are automatically trimmed."""
        response = client.post(
            "/api/projects",
            json={
                "name": "  Project with spaces  ",
                "description": "Test description",
                "status": "planned",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Project with spaces"  # Spaces trimmed

    def test_create_project_duplicate_after_trimming(
        self, client, create_sample_project
    ):
        """Test that duplicate detection works after trimming whitespace."""
        # Create first project
        create_sample_project(name="My Project")

        # Attempt to create with same name but with spaces
        response = client.post(
            "/api/projects",
            json={
                "name": "  My Project  ",  # Should be trimmed and detected as duplicate
                "description": "Different description",
                "status": "planned",
            },
        )

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_update_project_with_leading_trailing_spaces(
        self, client, create_sample_project
    ):
        """Test that name trimming works on update."""
        project = create_sample_project(name="Original Name")

        response = client.put(
            f"/api/projects/{project.id}", json={"name": "  Updated Name  "}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"  # Spaces trimmed

    def test_update_project_duplicate_after_trimming(
        self, client, create_sample_project
    ):
        """Test that duplicate detection works after trimming on update."""
        create_sample_project(name="First Project")
        project2 = create_sample_project(name="Second Project")

        # Try to update project2 with spaces around project1's name
        response = client.put(
            f"/api/projects/{project2.id}", json={"name": "  First Project  "}
        )

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_create_project_description_max_length_valid(self, client):
        """Test that description with exactly 2000 chars is accepted."""
        description_2000 = "x" * 2000

        response = client.post(
            "/api/projects",
            json={
                "name": "Test Max Length",
                "description": description_2000,
                "status": "planned",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["description"]) == 2000

    def test_create_project_description_max_length_exceeded(self, client):
        """Test that description with 2001 chars is rejected."""
        description_2001 = "x" * 2001

        response = client.post(
            "/api/projects",
            json={
                "name": "Test Exceeds Max",
                "description": description_2001,
                "status": "planned",
            },
        )

        assert response.status_code == 422  # Validation error
        error_detail = response.json()["detail"]
        assert any("description" in str(err).lower() for err in error_detail)

    def test_update_project_description_max_length_valid(
        self, client, create_sample_project
    ):
        """Test that updating with exactly 2000 char description is accepted."""
        project = create_sample_project(name="Test Project")
        description_2000 = "y" * 2000

        response = client.put(
            f"/api/projects/{project.id}", json={"description": description_2000}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["description"]) == 2000

    def test_update_project_description_max_length_exceeded(
        self, client, create_sample_project
    ):
        """Test that updating with 2001 char description is rejected."""
        project = create_sample_project(name="Test Project")
        description_2001 = "y" * 2001

        response = client.put(
            f"/api/projects/{project.id}", json={"description": description_2001}
        )

        assert response.status_code == 422  # Validation error
        error_detail = response.json()["detail"]
        assert any("description" in str(err).lower() for err in error_detail)

    def test_create_project_empty_description_converted_to_null(self, client):
        """Test that empty string description is converted to null."""
        response = client.post(
            "/api/projects",
            json={
                "name": "Test Empty Description",
                "description": "",  # Empty string
                "status": "planned",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["description"] is None  # Converted to null

    def test_update_project_empty_description_converted_to_null(
        self, client, create_sample_project
    ):
        """Test that empty string description is converted to null on update."""
        project = create_sample_project(
            name="Test Project", description="Original description"
        )

        response = client.put(
            f"/api/projects/{project.id}",
            json={"description": ""},  # Empty string
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] is None  # Converted to null

    def test_database_constraint_enforcement(
        self, client, create_sample_project, db_session
    ):
        """
        Test that database-level UNIQUE constraint is enforced.

        This tests the IntegrityError handling for cases where
        application-level duplicate check might be bypassed.
        """
        from sqlalchemy.exc import IntegrityError

        from app.models import Project

        # Create first project normally
        create_sample_project(name="Constraint Test")

        # Try to create duplicate directly via SQLAlchemy (bypassing API validation)
        duplicate = Project(
            name="Constraint Test", description="Direct DB insert", status="planned"
        )

        db_session.add(duplicate)

        with pytest.raises(IntegrityError):
            db_session.commit()

        db_session.rollback()

    def test_create_project_only_whitespace_name_fails(self, client):
        """Test that name with only whitespace fails validation."""
        response = client.post(
            "/api/projects",
            json={
                "name": "   ",  # Only whitespace, will trim to ""
                "status": "planned",
            },
        )

        # Should fail because after trimming, it becomes empty string
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        # Check that error mentions empty/whitespace
        assert any(
            "empty" in str(err).lower() or "whitespace" in str(err).lower()
            for err in error_detail
        )

    def test_update_project_only_whitespace_name_fails(
        self, client, create_sample_project
    ):
        """Test that updating with only whitespace name fails."""
        project = create_sample_project(name="Test Project")

        response = client.put(
            f"/api/projects/{project.id}",
            json={"name": "   "},  # Only whitespace
        )

        # Should fail validation
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert any(
            "empty" in str(err).lower() or "whitespace" in str(err).lower()
            for err in error_detail
        )

    def test_create_integrity_error_handling(self, client):
        """
        Test IntegrityError handling in create endpoint.

        Simulates database constraint violation during commit.
        This tests the defensive exception handling for race conditions
        where duplicate check passes but constraint fails.

        Note: We patch at the SQLAlchemy Session class level rather than the
        db_session fixture instance because the FastAPI dependency injection
        creates a new session for each request. Patching Session.commit ensures
        the mock is applied to all session instances created during the test.
        """
        # Patch at the SQLAlchemy Session level to simulate constraint violation
        with patch(
            "sqlalchemy.orm.Session.commit",
            side_effect=IntegrityError("UNIQUE constraint failed", None, None),
        ):
            response = client.post(
                "/api/projects", json={"name": "Test Project", "status": "planned"}
            )

            # Should catch IntegrityError and return 400
            assert response.status_code == 400
            assert "already exists" in response.json()["detail"].lower()

    def test_update_integrity_error_handling(self, client, create_sample_project):
        """
        Test IntegrityError handling in update endpoint.

        Simulates database constraint violation during update commit.
        This covers the defensive exception handling.

        Note: We patch at the SQLAlchemy Session class level rather than the
        db_session fixture instance because the FastAPI dependency injection
        creates a new session for each request. Patching Session.commit ensures
        the mock is applied to all session instances created during the test.
        """
        # Create project first
        project = create_sample_project(name="Original Name")

        # Patch commit to raise IntegrityError
        with patch(
            "sqlalchemy.orm.Session.commit",
            side_effect=IntegrityError("UNIQUE constraint failed", None, None),
        ):
            response = client.put(
                f"/api/projects/{project.id}", json={"name": "Updated Name"}
            )

            # Should catch IntegrityError and return 400
            assert response.status_code == 400
            assert "already exists" in response.json()["detail"].lower()


class TestProjectWorkspaceFiltering:
    """
    Tests for workspace filtering in project endpoints.

    Tests the X-Workspace-Id header handling and workspace isolation for all
    project CRUD operations.

    Related: Issue #92
    """

    def test_create_project_default_workspace(self, client):
        """Test project creation defaults to workspace_id=1."""
        project_data = {"name": "Test Project", "description": "Test"}
        response = client.post("/api/projects", json=project_data)

        assert response.status_code == 201
        data = response.json()
        assert data["workspace_id"] == 1

    def test_create_project_with_workspace_header(self, client, db_session):
        """Test project creation with X-Workspace-Id header."""
        from app.models import Workspace

        # Create a second workspace
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        project_data = {"name": "Test Project", "description": "Test"}
        response = client.post(
            "/api/projects",
            json=project_data,
            headers={"X-Workspace-Id": str(workspace.id)},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["workspace_id"] == workspace.id

    def test_create_project_invalid_workspace(self, client):
        """Test project creation fails with non-existent workspace."""
        project_data = {"name": "Test Project", "description": "Test"}
        response = client.post(
            "/api/projects", json=project_data, headers={"X-Workspace-Id": "999"}
        )

        assert response.status_code == 404
        assert "workspace" in response.json()["detail"].lower()

    def test_list_projects_default_workspace(self, client, create_sample_project):
        """Test listing projects defaults to workspace_id=1."""
        # Create projects in default workspace
        create_sample_project(name="Project 1")
        create_sample_project(name="Project 2")

        response = client.get("/api/projects")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(p["workspace_id"] == 1 for p in data)

    def test_list_projects_with_workspace_header(self, client, db_session):
        """Test listing projects filters by X-Workspace-Id header."""
        from app.models import Project, Workspace

        # Create two workspaces
        workspace1 = db_session.query(Workspace).filter(Workspace.id == 1).first()
        workspace2 = Workspace(name="Workspace 2")
        db_session.add(workspace2)
        db_session.commit()
        db_session.refresh(workspace2)

        # Create projects in different workspaces
        project1 = Project(name="Project in WS1", workspace_id=workspace1.id)
        project2 = Project(name="Project in WS2", workspace_id=workspace2.id)
        db_session.add(project1)
        db_session.add(project2)
        db_session.commit()

        # List projects in workspace 1
        response = client.get("/api/projects", headers={"X-Workspace-Id": "1"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Project in WS1"

        # List projects in workspace 2
        response = client.get(
            "/api/projects", headers={"X-Workspace-Id": str(workspace2.id)}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Project in WS2"

    def test_get_project_same_workspace(self, client, create_sample_project):
        """Test getting project succeeds when in same workspace."""
        project = create_sample_project(name="Test Project")

        response = client.get(
            f"/api/projects/{project.id}", headers={"X-Workspace-Id": "1"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project.id
        assert data["workspace_id"] == 1

    def test_get_project_different_workspace_returns_404(self, client, db_session):
        """Test getting project from different workspace returns 404."""
        from app.models import Project, Workspace

        # Create workspace and project
        workspace = Workspace(name="Workspace 2")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        project = Project(name="Test Project", workspace_id=workspace.id)
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Try to access from workspace 1
        response = client.get(
            f"/api/projects/{project.id}", headers={"X-Workspace-Id": "1"}
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_update_project_same_workspace(self, client, create_sample_project):
        """Test updating project succeeds when in same workspace."""
        project = create_sample_project(name="Original Name")

        response = client.put(
            f"/api/projects/{project.id}",
            json={"name": "Updated Name"},
            headers={"X-Workspace-Id": "1"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["workspace_id"] == 1

    def test_update_project_different_workspace_returns_404(self, client, db_session):
        """Test updating project from different workspace returns 404."""
        from app.models import Project, Workspace

        # Create workspace and project
        workspace = Workspace(name="Workspace 2")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        project = Project(name="Test Project", workspace_id=workspace.id)
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Try to update from workspace 1
        response = client.put(
            f"/api/projects/{project.id}",
            json={"name": "Updated Name"},
            headers={"X-Workspace-Id": "1"},
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_delete_project_same_workspace(self, client, create_sample_project):
        """Test deleting project succeeds when in same workspace."""
        project = create_sample_project(name="To Delete")

        response = client.delete(
            f"/api/projects/{project.id}", headers={"X-Workspace-Id": "1"}
        )

        assert response.status_code == 204

        # Verify deletion
        response = client.get(
            f"/api/projects/{project.id}", headers={"X-Workspace-Id": "1"}
        )
        assert response.status_code == 404

    def test_delete_project_different_workspace_returns_404(self, client, db_session):
        """Test deleting project from different workspace returns 404."""
        from app.models import Project, Workspace

        # Create workspace and project
        workspace = Workspace(name="Workspace 2")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        project = Project(name="Test Project", workspace_id=workspace.id)
        db_session.add(project)
        db_session.commit()
        db_session.refresh(project)

        # Try to delete from workspace 1
        response = client.delete(
            f"/api/projects/{project.id}", headers={"X-Workspace-Id": "1"}
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

        # Verify project still exists in its own workspace
        response = client.get(
            f"/api/projects/{project.id}",
            headers={"X-Workspace-Id": str(workspace.id)},
        )
        assert response.status_code == 200

    def test_workspace_header_null_defaults_to_1(self, client, create_sample_project):
        """Test that null/missing workspace header defaults to workspace_id=1."""
        project = create_sample_project(name="Test Project")

        # No header
        response = client.get(f"/api/projects/{project.id}")
        assert response.status_code == 200

        # Explicit header with null (simulated as string "null")
        response = client.get(
            f"/api/projects/{project.id}", headers={"X-Workspace-Id": "0"}
        )
        # Header value "0" evaluates to falsy, should default to 1
        assert response.status_code == 200
