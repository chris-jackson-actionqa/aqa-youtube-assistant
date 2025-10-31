"""
Unit tests for Workspaces CRUD API endpoints.

Tests all CRUD operations for the /api/workspaces endpoints including:
- Creating workspaces
- Reading workspaces (list and single)
- Updating workspaces
- Deleting workspaces
- Error cases and validation
- Business rules (default workspace protection, project constraints)

Related: Issue #92
"""

from app.models import Project, Workspace


class TestCreateWorkspace:
    """Tests for creating workspaces via POST /api/workspaces."""

    def test_create_workspace_success(self, client):
        """Test successful workspace creation."""
        workspace_data = {
            "name": "Test Workspace",
            "description": "A test workspace",
        }
        response = client.post("/api/workspaces", json=workspace_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Workspace"
        assert data["description"] == "A test workspace"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert data["project_count"] == 0

    def test_create_workspace_minimal(self, client):
        """Test creating workspace with only required fields."""
        minimal_data = {"name": "Minimal Workspace"}
        response = client.post("/api/workspaces", json=minimal_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Minimal Workspace"
        assert data["description"] is None
        assert data["project_count"] == 0

    def test_create_workspace_duplicate_name(self, client, db_session):
        """Test that duplicate workspace names are rejected."""
        # Create first workspace
        workspace = Workspace(name="Duplicate Test", description="First")
        db_session.add(workspace)
        db_session.commit()

        # Try to create workspace with same name
        duplicate_data = {"name": "Duplicate Test", "description": "Second"}
        response = client.post("/api/workspaces", json=duplicate_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_create_workspace_empty_name_rejected(self, client):
        """Test that empty workspace name is rejected."""
        empty_data = {"name": "", "description": "Test"}
        response = client.post("/api/workspaces", json=empty_data)

        assert response.status_code == 422  # Validation error

    def test_create_workspace_whitespace_name_rejected(self, client):
        """Test that whitespace-only workspace name is rejected."""
        whitespace_data = {"name": "   ", "description": "Test"}
        response = client.post("/api/workspaces", json=whitespace_data)

        assert response.status_code == 422  # Validation error

    def test_create_workspace_name_trimmed(self, client):
        """Test that workspace name is trimmed of whitespace."""
        padded_data = {"name": "  Padded Name  ", "description": "Test"}
        response = client.post("/api/workspaces", json=padded_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Padded Name"

    def test_create_workspace_empty_description_converted_to_null(self, client):
        """Test that empty description is converted to null."""
        data = {"name": "Test Workspace", "description": ""}
        response = client.post("/api/workspaces", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["description"] is None

    def test_create_workspace_name_too_long(self, client):
        """Test that workspace name exceeding max length is rejected."""
        long_name = "A" * 101  # Max is 100
        data = {"name": long_name, "description": "Test"}
        response = client.post("/api/workspaces", json=data)

        assert response.status_code == 422  # Validation error

    def test_create_workspace_description_too_long(self, client):
        """Test that description exceeding max length is rejected."""
        long_desc = "A" * 501  # Max is 500
        data = {"name": "Test Workspace", "description": long_desc}
        response = client.post("/api/workspaces", json=data)

        assert response.status_code == 422  # Validation error


class TestListWorkspaces:
    """Tests for listing workspaces via GET /api/workspaces."""

    def test_list_workspaces_empty(self, client, db_session):
        """Test listing workspaces when only default workspace exists."""
        response = client.get("/api/workspaces")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1  # Only default workspace
        assert data[0]["name"] == "Default Workspace"
        assert data[0]["id"] == 1

    def test_list_workspaces_multiple(self, client, db_session):
        """Test listing multiple workspaces."""
        # Create additional workspaces
        workspace1 = Workspace(name="Workspace 1", description="First")
        workspace2 = Workspace(name="Workspace 2", description="Second")
        db_session.add(workspace1)
        db_session.add(workspace2)
        db_session.commit()

        response = client.get("/api/workspaces")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3  # Default + 2 new workspaces
        # Should be ordered by created_at desc (newest first)
        assert data[0]["name"] == "Workspace 2"
        assert data[1]["name"] == "Workspace 1"
        assert data[2]["name"] == "Default Workspace"

    def test_list_workspaces_includes_project_count(self, client, db_session):
        """Test that workspace list includes project count."""
        # Create workspace with projects
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        # Add projects to workspace
        project1 = Project(
            name="Project 1", workspace_id=workspace.id, description="Test"
        )
        project2 = Project(
            name="Project 2", workspace_id=workspace.id, description="Test"
        )
        db_session.add(project1)
        db_session.add(project2)
        db_session.commit()

        response = client.get("/api/workspaces")

        assert response.status_code == 200
        data = response.json()
        test_workspace = next(w for w in data if w["name"] == "Test Workspace")
        assert test_workspace["project_count"] == 2


class TestGetWorkspace:
    """Tests for getting a single workspace via GET /api/workspaces/{id}."""

    def test_get_workspace_success(self, client, db_session):
        """Test successful retrieval of workspace by ID."""
        workspace = Workspace(name="Test Workspace", description="Test description")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        response = client.get(f"/api/workspaces/{workspace.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == workspace.id
        assert data["name"] == "Test Workspace"
        assert data["description"] == "Test description"
        assert data["project_count"] == 0

    def test_get_workspace_with_projects(self, client, db_session):
        """Test that workspace includes project count."""
        workspace = Workspace(name="Test Workspace")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        # Add projects
        project = Project(name="Test Project", workspace_id=workspace.id)
        db_session.add(project)
        db_session.commit()

        response = client.get(f"/api/workspaces/{workspace.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["project_count"] == 1

    def test_get_workspace_not_found(self, client):
        """Test 404 when workspace doesn't exist."""
        response = client.get("/api/workspaces/999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_default_workspace(self, client):
        """Test retrieving default workspace."""
        response = client.get("/api/workspaces/1")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["name"] == "Default Workspace"


class TestUpdateWorkspace:
    """Tests for updating workspaces via PUT /api/workspaces/{id}."""

    def test_update_workspace_name(self, client, db_session):
        """Test updating workspace name."""
        workspace = Workspace(name="Original Name", description="Original desc")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        update_data = {"name": "Updated Name"}
        response = client.put(f"/api/workspaces/{workspace.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["description"] == "Original desc"  # Unchanged

    def test_update_workspace_description(self, client, db_session):
        """Test updating workspace description."""
        workspace = Workspace(name="Test Workspace", description="Original")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        update_data = {"description": "Updated description"}
        response = client.put(f"/api/workspaces/{workspace.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Workspace"  # Unchanged
        assert data["description"] == "Updated description"

    def test_update_workspace_both_fields(self, client, db_session):
        """Test updating both name and description."""
        workspace = Workspace(name="Original Name", description="Original desc")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        update_data = {"name": "New Name", "description": "New description"}
        response = client.put(f"/api/workspaces/{workspace.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["description"] == "New description"

    def test_update_workspace_not_found(self, client):
        """Test 404 when updating non-existent workspace."""
        update_data = {"name": "New Name"}
        response = client.put("/api/workspaces/999", json=update_data)

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_update_workspace_duplicate_name(self, client, db_session):
        """Test that updating to duplicate name is rejected."""
        workspace1 = Workspace(name="Workspace 1")
        workspace2 = Workspace(name="Workspace 2")
        db_session.add(workspace1)
        db_session.add(workspace2)
        db_session.commit()
        db_session.refresh(workspace2)

        # Try to rename workspace2 to workspace1's name
        update_data = {"name": "Workspace 1"}
        response = client.put(f"/api/workspaces/{workspace2.id}", json=update_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_update_workspace_name_trimmed(self, client, db_session):
        """Test that updated name is trimmed of whitespace."""
        workspace = Workspace(name="Original Name")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        update_data = {"name": "  Updated Name  "}
        response = client.put(f"/api/workspaces/{workspace.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    def test_update_workspace_empty_description_to_null(self, client, db_session):
        """Test that empty description is converted to null."""
        workspace = Workspace(name="Test Workspace", description="Original")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        update_data = {"description": ""}
        response = client.put(f"/api/workspaces/{workspace.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["description"] is None

    def test_update_default_workspace_name_forbidden(self, client):
        """Test that default workspace (id=1) cannot be renamed."""
        update_data = {"name": "New Default Name"}
        response = client.put("/api/workspaces/1", json=update_data)

        assert response.status_code == 403
        assert "default workspace" in response.json()["detail"].lower()

    def test_update_default_workspace_description_allowed(self, client):
        """Test that default workspace description can be updated."""
        update_data = {"description": "Updated default description"}
        response = client.put("/api/workspaces/1", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Default Workspace"  # Name unchanged
        assert data["description"] == "Updated default description"


class TestDeleteWorkspace:
    """Tests for deleting workspaces via DELETE /api/workspaces/{id}."""

    def test_delete_workspace_success(self, client, db_session):
        """Test successful deletion of empty workspace."""
        workspace = Workspace(name="To Delete", description="Will be deleted")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)
        workspace_id = workspace.id

        response = client.delete(f"/api/workspaces/{workspace_id}")

        assert response.status_code == 204

        # Verify workspace is deleted
        response = client.get(f"/api/workspaces/{workspace_id}")
        assert response.status_code == 404

    def test_delete_workspace_not_found(self, client):
        """Test 404 when deleting non-existent workspace."""
        response = client.delete("/api/workspaces/999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_delete_default_workspace_forbidden(self, client):
        """Test that default workspace (id=1) cannot be deleted."""
        response = client.delete("/api/workspaces/1")

        assert response.status_code == 403
        assert "default workspace" in response.json()["detail"].lower()

    def test_delete_workspace_with_projects_rejected(self, client, db_session):
        """Test that workspace with projects cannot be deleted."""
        workspace = Workspace(name="Has Projects")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        # Add project to workspace
        project = Project(name="Test Project", workspace_id=workspace.id)
        db_session.add(project)
        db_session.commit()

        response = client.delete(f"/api/workspaces/{workspace.id}")

        assert response.status_code == 400
        assert "project" in response.json()["detail"].lower()

    def test_delete_workspace_with_multiple_projects(self, client, db_session):
        """Test deletion rejection with multiple projects."""
        workspace = Workspace(name="Has Many Projects")
        db_session.add(workspace)
        db_session.commit()
        db_session.refresh(workspace)

        # Add multiple projects
        project1 = Project(name="Project 1", workspace_id=workspace.id)
        project2 = Project(name="Project 2", workspace_id=workspace.id)
        db_session.add(project1)
        db_session.add(project2)
        db_session.commit()

        response = client.delete(f"/api/workspaces/{workspace.id}")

        assert response.status_code == 400
        detail = response.json()["detail"].lower()
        assert "project" in detail
        assert "2" in detail  # Should mention count
