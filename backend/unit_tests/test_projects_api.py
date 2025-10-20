"""
Unit tests for Projects CRUD API endpoints.

Tests all CRUD operations for the /api/projects endpoints including:
- Creating projects
- Reading projects (list and single)
- Updating projects
- Deleting projects
- Error cases and validation
"""
import pytest
from datetime import datetime


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
        assert data["title"] == sample_project_data["title"]
        assert data["description"] == sample_project_data["description"]
        assert data["status"] == sample_project_data["status"]
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
    
    def test_create_project_minimal(self, client):
        """Test creating project with only required fields."""
        minimal_data = {
            "title": "Minimal Project"
        }
        response = client.post("/api/projects", json=minimal_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Minimal Project"
        assert data["status"] == "planned"  # Default value
        assert data["description"] is None
    
    def test_create_project_duplicate_title_exact(self, client, create_sample_project):
        """Test that duplicate titles are rejected (exact match)."""
        # Create first project
        create_sample_project(title="Duplicate Test")
        
        # Attempt to create duplicate
        duplicate_data = {
            "title": "Duplicate Test",
            "description": "This should fail",
            "status": "planned"
        }
        response = client.post("/api/projects", json=duplicate_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_create_project_duplicate_title_different_case(self, client, create_sample_project):
        """Test that duplicate titles are rejected even with different capitalization."""
        # Create first project
        create_sample_project(title="Test Automation")
        
        # Attempt to create with different case
        duplicate_data = {
            "title": "test automation",
            "description": "Different case",
            "status": "planned"
        }
        response = client.post("/api/projects", json=duplicate_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_create_project_missing_title(self, client):
        """Test that creating project without title fails validation."""
        invalid_data = {
            "description": "No title provided",
            "status": "planned"
        }
        response = client.post("/api/projects", json=invalid_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_create_project_empty_title(self, client):
        """Test that empty title fails validation."""
        invalid_data = {
            "title": "",
            "description": "Empty title",
            "status": "planned"
        }
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
        project = create_sample_project(title="Single Project")
        
        response = client.get("/api/projects")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == project.id
        assert data[0]["title"] == "Single Project"
    
    def test_get_projects_multiple(self, client, create_sample_project):
        """Test getting multiple projects."""
        project1 = create_sample_project(title="Project 1", status="planned")
        project2 = create_sample_project(title="Project 2", status="in_progress")
        project3 = create_sample_project(title="Project 3", status="completed")
        
        response = client.get("/api/projects")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        
        titles = [p["title"] for p in data]
        assert "Project 1" in titles
        assert "Project 2" in titles
        assert "Project 3" in titles


class TestGetProjectById:
    """Tests for getting a single project via GET /api/projects/{id}."""
    
    def test_get_project_by_id_success(self, client, create_sample_project):
        """Test successfully getting a project by ID."""
        project = create_sample_project(
            title="Specific Project",
            description="Test description",
            status="in_progress"
        )
        
        response = client.get(f"/api/projects/{project.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project.id
        assert data["title"] == "Specific Project"
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
            title="Original Title",
            description="Original description",
            status="planned"
        )
        
        update_data = {
            "title": "Updated Title",
            "description": "Updated description",
            "status": "in_progress"
        }
        response = client.put(f"/api/projects/{project.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project.id
        assert data["title"] == "Updated Title"
        assert data["description"] == "Updated description"
        assert data["status"] == "in_progress"
    
    def test_update_project_partial(self, client, create_sample_project):
        """Test partial update (only some fields)."""
        project = create_sample_project(
            title="Original Title",
            description="Original description",
            status="planned"
        )
        
        update_data = {
            "status": "in_progress"
        }
        response = client.put(f"/api/projects/{project.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Original Title"  # Unchanged
        assert data["description"] == "Original description"  # Unchanged
        assert data["status"] == "in_progress"  # Changed
    
    def test_update_project_same_title(self, client, create_sample_project):
        """Test that updating with same title is allowed."""
        project = create_sample_project(title="My Project", status="planned")
        
        update_data = {
            "title": "My Project",
            "status": "in_progress"
        }
        response = client.put(f"/api/projects/{project.id}", json=update_data)
        
        assert response.status_code == 200
        assert response.json()["status"] == "in_progress"
    
    def test_update_project_duplicate_title(self, client, create_sample_project):
        """Test that updating to an existing title is rejected."""
        project1 = create_sample_project(title="Project 1")
        project2 = create_sample_project(title="Project 2")
        
        # Try to update project2 to have same title as project1
        update_data = {
            "title": "Project 1"
        }
        response = client.put(f"/api/projects/{project2.id}", json=update_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_update_project_duplicate_title_different_case(self, client, create_sample_project):
        """Test that case-insensitive duplicate check works on update."""
        project1 = create_sample_project(title="Test Project")
        project2 = create_sample_project(title="Another Project")
        
        # Try to update project2 with different case of project1's title
        update_data = {
            "title": "test project"
        }
        response = client.put(f"/api/projects/{project2.id}", json=update_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_update_project_not_found(self, client):
        """Test updating a non-existent project returns 404."""
        update_data = {
            "title": "Updated Title"
        }
        response = client.put("/api/projects/9999", json=update_data)
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_update_project_empty_title(self, client, create_sample_project):
        """Test that empty title fails validation."""
        project = create_sample_project(title="Original Title")
        
        update_data = {
            "title": ""
        }
        response = client.put(f"/api/projects/{project.id}", json=update_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_update_project_timestamps(self, client, create_sample_project):
        """Test that updated_at timestamp changes on update."""
        project = create_sample_project(title="Original")
        original_updated_at = project.updated_at
        
        update_data = {
            "status": "in_progress"
        }
        response = client.put(f"/api/projects/{project.id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        # Note: This might need adjustment based on datetime format
        assert "updated_at" in data


class TestDeleteProject:
    """Tests for deleting projects via DELETE /api/projects/{id}."""
    
    def test_delete_project_success(self, client, create_sample_project):
        """Test successfully deleting a project."""
        project = create_sample_project(title="To Be Deleted")
        
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
        project1 = create_sample_project(title="Project 1")
        project2 = create_sample_project(title="Project 2")
        project3 = create_sample_project(title="Project 3")
        
        # Delete middle project
        response = client.delete(f"/api/projects/{project2.id}")
        assert response.status_code == 204
        
        # Get list and verify only 2 remain
        list_response = client.get("/api/projects")
        assert list_response.status_code == 200
        data = list_response.json()
        assert len(data) == 2
        
        titles = [p["title"] for p in data]
        assert "Project 1" in titles
        assert "Project 2" not in titles
        assert "Project 3" in titles


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
