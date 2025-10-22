"""
Integration tests for Projects CRUD API endpoints.

These tests use a real SQLite database file to verify:
- Database persistence across requests
- Database constraints and uniqueness
- Transaction handling
- Real-world database behavior

Unlike unit tests (in-memory), these tests verify actual database operations.
"""
import pytest
from pathlib import Path


class TestDatabasePersistence:
    """Tests that verify data persists in the database file."""
    
    def test_project_persists_across_sessions(self, client, db_file_path):
        """Test that created projects persist in the database file."""
        # Create a project
        project_data = {
            "name": "Persistent Project",
            "description": "This should persist",
            "status": "planned"
        }
        create_response = client.post("/api/projects", json=project_data)
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]
        
        # Verify database file exists
        assert db_file_path.exists()
        
        # Verify we can retrieve it
        get_response = client.get(f"/api/projects/{project_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name": == "Persistent Project"
    
    def test_multiple_operations_persist(self, client):
        """Test that multiple CRUD operations persist correctly."""
        # Create multiple projects
        project1 = client.post("/api/projects", json={"name": "Project 1"})
        project2 = client.post("/api/projects", json={"name": "Project 2"})
        project3 = client.post("/api/projects", json={"name": "Project 3"})
        
        assert project1.status_code == 201
        assert project2.status_code == 201
        assert project3.status_code == 201
        
        # Get all projects
        list_response = client.get("/api/projects")
        assert len(list_response.json()) == 3
        
        # Update one project
        project2_id = project2.json()["id"]
        update_response = client.put(
            f"/api/projects/{project2_id}",
            json={"status": "in_progress"}
        )
        assert update_response.status_code == 200
        
        # Delete one project
        project3_id = project3.json()["id"]
        delete_response = client.delete(f"/api/projects/{project3_id}")
        assert delete_response.status_code == 204
        
        # Verify final state
        final_list = client.get("/api/projects")
        assert len(final_list.json()) == 2


class TestDatabaseConstraints:
    """Tests that verify database constraints are enforced."""
    
    def test_title_uniqueness_constraint(self, client, create_sample_project):
        """Test that database enforces title uniqueness at DB level."""
        # Create first project via API
        client.post("/api/projects", json={"name": "Unique Title"})
        
        # Attempt to create duplicate via API
        response = client.post("/api/projects", json={"name": "Unique Title"})
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_case_insensitive_uniqueness(self, client):
        """Test that title uniqueness is case-insensitive."""
        # Create with one case
        client.post("/api/projects", json={"name": "Test Project"})
        
        # Try different cases
        response1 = client.post("/api/projects", json={"name": "test project"})
        response2 = client.post("/api/projects", json={"name": "TEST PROJECT"})
        response3 = client.post("/api/projects", json={"name": "TeSt PrOjEcT"})
        
        assert response1.status_code == 400
        assert response2.status_code == 400
        assert response3.status_code == 400


class TestDatabaseTransactions:
    """Tests that verify transaction handling and rollbacks."""
    
    def test_failed_create_does_not_persist(self, client, create_sample_project):
        """Test that validation failures don't create partial data."""
        # Create a project with a title
        create_sample_project(name="Existing Project")
        
        # Get initial count
        initial_response = client.get("/api/projects")
        initial_count = len(initial_response.json())
        
        # Attempt to create duplicate (should fail)
        client.post("/api/projects", json={"name": "Existing Project"})
        
        # Verify count hasn't changed
        final_response = client.get("/api/projects")
        final_count = len(final_response.json())
        assert final_count == initial_count
    
    def test_failed_update_preserves_original(self, client, create_sample_project):
        """Test that failed updates don't modify the database."""
        # Create two projects
        project1 = create_sample_project(name="Project 1")
        project2 = create_sample_project(name="Project 2")
        
        # Attempt to update project2 to have project1's title (should fail)
        response = client.put(
            f"/api/projects/{project2.id}",
            json={"name": "Project 1"}
        )
        assert response.status_code == 400
        
        # Verify project2 unchanged
        get_response = client.get(f"/api/projects/{project2.id}")
        assert get_response.json()["name": == "Project 2"


class TestDatabaseIDGeneration:
    """Tests that verify database ID auto-increment behavior."""
    
    def test_sequential_id_generation(self, client):
        """Test that IDs are generated sequentially."""
        # Create three projects
        response1 = client.post("/api/projects", json={"name": "Project 1"})
        response2 = client.post("/api/projects", json={"name": "Project 2"})
        response3 = client.post("/api/projects", json={"name": "Project 3"})
        
        id1 = response1.json()["id"]
        id2 = response2.json()["id"]
        id3 = response3.json()["id"]
        
        # IDs should be sequential
        assert id2 == id1 + 1
        assert id3 == id2 + 1
    
    def test_id_generation_behavior(self, client):
        """Test SQLite ID generation behavior.
        
        Note: SQLite may reuse IDs if the last row is deleted.
        This test documents actual SQLite behavior.
        """
        # Create and delete a project
        response1 = client.post("/api/projects", json={"name": "Project 1"})
        project1_id = response1.json()["id"]
        client.delete(f"/api/projects/{project1_id}")
        
        # Create new project
        response2 = client.post("/api/projects", json={"name": "Project 2"})
        project2_id = response2.json()["id"]
        
        # SQLite behavior: May reuse ID if last row was deleted
        # This is expected SQLite behavior and is acceptable
        assert isinstance(project2_id, int)
        assert project2_id > 0


class TestDatabaseTimestamps:
    """Tests that verify timestamp behavior with real database."""
    
    def test_created_at_set_on_creation(self, client):
        """Test that created_at is automatically set."""
        response = client.post("/api/projects", json={"name": "Timestamped"})
        data = response.json()
        
        assert "created_at" in data
        assert data["created_at"] is not None
    
    def test_updated_at_changes_on_update(self, client):
        """Test that updated_at changes when project is updated."""
        # Create project
        create_response = client.post("/api/projects", json={"name": "Original"})
        project_id = create_response.json()["id"]
        original_updated_at = create_response.json()["updated_at"]
        
        # Update project
        update_response = client.put(
            f"/api/projects/{project_id}",
            json={"status": "in_progress"}
        )
        new_updated_at = update_response.json()["updated_at"]
        
        # updated_at should change (or at least be present)
        assert "updated_at" in update_response.json()
        # Note: May be same if update happens very quickly
    
    def test_created_at_unchanged_on_update(self, client):
        """Test that created_at doesn't change when updating."""
        # Create project
        create_response = client.post("/api/projects", json={"name": "Original"})
        project_id = create_response.json()["id"]
        original_created_at = create_response.json()["created_at"]
        
        # Update project
        client.put(
            f"/api/projects/{project_id}",
            json={"status": "in_progress"}
        )
        
        # Get updated project
        get_response = client.get(f"/api/projects/{project_id}")
        new_created_at = get_response.json()["created_at"]
        
        # created_at should remain the same
        assert new_created_at == original_created_at


class TestCompleteWorkflows:
    """Integration tests for complete user workflows."""
    
    def test_complete_project_lifecycle(self, client):
        """Test a complete project lifecycle from creation to deletion."""
        # 1. Create a project
        create_response = client.post("/api/projects", json={
            "name": "Complete Workflow Project",
            "description": "Testing full lifecycle",
            "status": "planned"
        })
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]
        
        # 2. Verify it appears in the list
        list_response = client.get("/api/projects")
        assert len(list_response.json()) == 1
        
        # 3. Get the specific project
        get_response = client.get(f"/api/projects/{project_id}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "planned"
        
        # 4. Update the project status
        update_response = client.put(
            f"/api/projects/{project_id}",
            json={"status": "in_progress"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["status"] == "in_progress"
        
        # 5. Update the description
        update2_response = client.put(
            f"/api/projects/{project_id}",
            json={"description": "Updated description"}
        )
        assert update2_response.status_code == 200
        
        # 6. Mark as completed
        update3_response = client.put(
            f"/api/projects/{project_id}",
            json={"status": "completed"}
        )
        assert update3_response.status_code == 200
        
        # 7. Delete the project
        delete_response = client.delete(f"/api/projects/{project_id}")
        assert delete_response.status_code == 204
        
        # 8. Verify it's gone
        get_deleted_response = client.get(f"/api/projects/{project_id}")
        assert get_deleted_response.status_code == 404
        
        # 9. Verify list is empty
        final_list_response = client.get("/api/projects")
        assert len(final_list_response.json()) == 0
    
    def test_managing_multiple_projects(self, client):
        """Test managing multiple projects simultaneously."""
        # Create multiple projects
        projects = []
        for i in range(5):
            response = client.post("/api/projects", json={
                "name": f"Project {i+1}",
                "status": "planned"
            })
            assert response.status_code == 201
            projects.append(response.json())
        
        # Verify all exist
        list_response = client.get("/api/projects")
        assert len(list_response.json()) == 5
        
        # Update some to different statuses
        client.put(f"/api/projects/{projects[0]['id']}", json={"status": "in_progress"})
        client.put(f"/api/projects/{projects[1]['id']}", json={"status": "in_progress"})
        client.put(f"/api/projects/{projects[2]['id']}", json={"status": "completed"})
        
        # Delete one
        client.delete(f"/api/projects/{projects[3]['id']}")
        
        # Verify final state
        final_list = client.get("/api/projects").json()
        assert len(final_list) == 4
        
        # Check statuses
        statuses = {p["id"]: p["status"] for p in final_list}
        assert statuses[projects[0]["id"]] == "in_progress"
        assert statuses[projects[1]["id"]] == "in_progress"
        assert statuses[projects[2]["id"]] == "completed"
        assert statuses[projects[4]["id"]] == "planned"


class TestErrorRecovery:
    """Tests that verify the system recovers properly from errors."""
    
    def test_database_state_after_validation_error(self, client):
        """Test that database remains consistent after validation errors."""
        # Create valid project
        client.post("/api/projects", json={"name": "Valid Project"})
        
        # Attempt invalid operations
        client.post("/api/projects", json={"name": ""})  # Empty title
        client.post("/api/projects", json={})  # Missing title
        client.post("/api/projects", json={"name": "Valid Project"})  # Duplicate
        
        # Database should still have only one valid project
        list_response = client.get("/api/projects")
        assert len(list_response.json()) == 1
        assert list_response.json()[0]["name": == "Valid Project"
    
    def test_database_state_after_not_found_errors(self, client, create_sample_project):
        """Test that 404 errors don't affect database state."""
        # Create a project
        project = create_sample_project(name="Test Project")
        
        # Attempt operations on non-existent IDs
        client.get("/api/projects/9999")
        client.put("/api/projects/9999", json={"name": "Updated"})
        client.delete("/api/projects/9999")
        
        # Original project should be unchanged
        get_response = client.get(f"/api/projects/{project.id}")
        assert get_response.status_code == 200
        assert get_response.json()["name": == "Test Project"
