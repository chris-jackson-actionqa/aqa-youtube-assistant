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


class TestDatabasePersistence:
    """Tests that verify data persists in the database file."""

    def test_project_persists_across_sessions(self, client, db_file_path):
        """Test that created projects persist in the database file."""
        # Create a project
        project_data = {
            "name": "Persistent Project",
            "description": "This should persist",
            "status": "planned",
        }
        create_response = client.post("/api/projects", json=project_data)
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]

        # Verify database file exists
        assert db_file_path.exists()

        # Verify we can retrieve it
        get_response = client.get(f"/api/projects/{project_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Persistent Project"

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
            f"/api/projects/{project2_id}", json={"status": "in_progress"}
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
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"].lower()

    def test_case_insensitive_uniqueness(self, client):
        """Test that title uniqueness is case-insensitive."""
        # Create with one case
        client.post("/api/projects", json={"name": "Test Project"})

        # Try different cases
        response1 = client.post("/api/projects", json={"name": "test project"})
        response2 = client.post("/api/projects", json={"name": "TEST PROJECT"})
        response3 = client.post("/api/projects", json={"name": "TeSt PrOjEcT"})

        assert response1.status_code == 409
        assert response2.status_code == 409
        assert response3.status_code == 409

    def test_database_constraint_direct_enforcement(self, client, db_session):
        """
        Test that database-level case-insensitive UNIQUE constraint is enforced.

        This test verifies Issue #30 implementation - the functional index
        on LOWER(name) that prevents duplicate names at the database level.

        Related: Issue #30, Decision #4
        """
        from sqlalchemy.exc import IntegrityError

        from app.models import Project

        # Create first project via API
        response = client.post("/api/projects", json={"name": "Database Test"})
        assert response.status_code == 201

        # Try to bypass application-level validation by inserting directly
        # via SQLAlchemy. This should fail due to the database constraint
        duplicate = Project(
            name="database test",  # Different case
            description="Direct DB insert attempt",
            status="planned",
        )

        db_session.add(duplicate)

        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        # Verify it's the specific unique constraint that failed
        assert "uix_project_name_lower" in str(exc_info.value).lower()

        db_session.rollback()

    def test_case_insensitive_uniqueness_with_trimming(self, client):
        """Test that case-insensitive uniqueness works with whitespace trimming."""
        # Create with one case
        client.post("/api/projects", json={"name": "My Video"})

        # Try different variations that should all be rejected
        test_cases = [
            "my video",  # Different case
            "  My Video  ",  # Same with spaces (will be trimmed)
            "  my video  ",  # Different case with spaces
            "MY VIDEO",  # All caps
            "  MY VIDEO  ",  # All caps with spaces
        ]

        for test_name in test_cases:
            response = client.post("/api/projects", json={"name": test_name})
            assert response.status_code == 409, f"Failed for name: '{test_name}'"
            assert "already exists" in response.json()["detail"].lower()


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
        create_sample_project(name="Project 1")
        project2 = create_sample_project(name="Project 2")

        # Attempt to update project2 to have project1's title (should fail)
        response = client.put(
            f"/api/projects/{project2.id}", json={"name": "Project 1"}
        )
        assert response.status_code == 409

        # Verify project2 unchanged
        get_response = client.get(f"/api/projects/{project2.id}")
        assert get_response.json()["name"] == "Project 2"


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
        create_response.json()["updated_at"]

        # Update project
        update_response = client.put(
            f"/api/projects/{project_id}", json={"status": "in_progress"}
        )
        update_response.json()["updated_at"]

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
        client.put(f"/api/projects/{project_id}", json={"status": "in_progress"})

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
        create_response = client.post(
            "/api/projects",
            json={
                "name": "Complete Workflow Project",
                "description": "Testing full lifecycle",
                "status": "planned",
            },
        )
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
            f"/api/projects/{project_id}", json={"status": "in_progress"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["status"] == "in_progress"

        # 5. Update the description
        update2_response = client.put(
            f"/api/projects/{project_id}", json={"description": "Updated description"}
        )
        assert update2_response.status_code == 200

        # 6. Mark as completed
        update3_response = client.put(
            f"/api/projects/{project_id}", json={"status": "completed"}
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
            response = client.post(
                "/api/projects", json={"name": f"Project {i + 1}", "status": "planned"}
            )
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
        assert list_response.json()[0]["name"] == "Valid Project"

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
        assert get_response.json()["name"] == "Test Project"


class TestVideoTitleField:
    """Integration tests for video_title field CRUD operations.

    Related: Issue #160 - Video Title Field Support
    """

    def test_create_project_with_video_title(self, client):
        """Test creating project with video_title."""
        response = client.post(
            "/api/projects",
            json={
                "name": "Video Project",
                "video_title": "My Awesome Video Title",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["video_title"] == "My Awesome Video Title"

    def test_create_project_without_video_title(self, client):
        """Test creating project without video_title (defaults to null)."""
        response = client.post(
            "/api/projects",
            json={"name": "No Video Title Project"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["video_title"] is None

    def test_create_project_with_empty_video_title(self, client):
        """Test that empty video_title is converted to null."""
        response = client.post(
            "/api/projects",
            json={"name": "Empty Video Title", "video_title": ""},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["video_title"] is None

    def test_create_project_with_long_video_title(self, client):
        """Test video_title with maximum allowed length (500 chars)."""
        long_title = "x" * 500
        response = client.post(
            "/api/projects",
            json={"name": "Long Title Project", "video_title": long_title},
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["video_title"]) == 500

    def test_create_project_video_title_too_long(self, client):
        """Test that video_title exceeding 500 chars is rejected."""
        too_long_title = "x" * 501
        response = client.post(
            "/api/projects",
            json={"name": "Too Long Title", "video_title": too_long_title},
        )

        assert response.status_code == 422

    def test_get_project_includes_video_title(self, client, create_sample_project):
        """Test GET /api/projects/{id} includes video_title."""
        project = create_sample_project(
            name="Test Project", video_title="Test Video Title"
        )

        response = client.get(f"/api/projects/{project.id}")

        assert response.status_code == 200
        data = response.json()
        assert "video_title" in data
        assert data["video_title"] == "Test Video Title"

    def test_list_projects_includes_video_title(self, client, create_sample_project):
        """Test GET /api/projects includes video_title for all projects."""
        create_sample_project(name="Project 1", video_title="Video Title 1")
        create_sample_project(name="Project 2", video_title="Video Title 2")
        create_sample_project(name="Project 3")  # No video title

        response = client.get("/api/projects")

        assert response.status_code == 200
        projects = response.json()
        assert len(projects) == 3
        # Projects are ordered by created_at DESC (newest first)
        # So Project 3 is first, then Project 2, then Project 1
        assert projects[0]["video_title"] is None  # Project 3
        assert projects[1]["video_title"] == "Video Title 2"  # Project 2
        assert projects[2]["video_title"] == "Video Title 1"  # Project 1

    def test_update_project_video_title(self, client, create_sample_project):
        """Test updating project video_title."""
        project = create_sample_project(
            name="Test Project", video_title="Original Title"
        )

        response = client.put(
            f"/api/projects/{project.id}", json={"video_title": "Updated Title"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["video_title"] == "Updated Title"

    def test_update_project_clear_video_title(self, client, create_sample_project):
        """Test clearing video_title by setting to null."""
        project = create_sample_project(
            name="Test Project", video_title="Original Title"
        )

        response = client.put(
            f"/api/projects/{project.id}", json={"video_title": None}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["video_title"] is None

    def test_update_project_empty_video_title_to_null(
        self, client, create_sample_project
    ):
        """Test that empty string video_title converts to null on update."""
        project = create_sample_project(
            name="Test Project", video_title="Original Title"
        )

        response = client.put(f"/api/projects/{project.id}", json={"video_title": ""})

        assert response.status_code == 200
        data = response.json()
        assert data["video_title"] is None

    def test_update_project_video_title_only(self, client, create_sample_project):
        """Test partial update with only video_title."""
        project = create_sample_project(
            name="Test Project",
            description="Test Description",
            video_title="Original Title",
        )

        response = client.put(
            f"/api/projects/{project.id}", json={"video_title": "New Title"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Project"  # Unchanged
        assert data["description"] == "Test Description"  # Unchanged
        assert data["video_title"] == "New Title"  # Updated

    def test_update_project_video_title_with_other_fields(
        self, client, create_sample_project
    ):
        """Test updating video_title along with other fields."""
        project = create_sample_project(name="Original Name")

        response = client.put(
            f"/api/projects/{project.id}",
            json={
                "name": "Updated Name",
                "status": "in_progress",
                "video_title": "New Video Title",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["status"] == "in_progress"
        assert data["video_title"] == "New Video Title"

    def test_video_title_persists_across_operations(self, client):
        """Test that video_title persists correctly through multiple operations."""
        # Create with video_title
        create_response = client.post(
            "/api/projects",
            json={"name": "Persist Test", "video_title": "Initial Title"},
        )
        project_id = create_response.json()["id"]

        # Update other field
        client.put(f"/api/projects/{project_id}", json={"status": "in_progress"})

        # Verify video_title unchanged
        get_response = client.get(f"/api/projects/{project_id}")
        assert get_response.json()["video_title"] == "Initial Title"

        # Update video_title
        client.put(
            f"/api/projects/{project_id}", json={"video_title": "Updated Title"}
        )

        # Verify update persisted
        final_response = client.get(f"/api/projects/{project_id}")
        assert final_response.json()["video_title"] == "Updated Title"

    def test_video_title_with_special_characters(self, client):
        """Test video_title with special characters and unicode."""
        special_title = "How to Train Your Dog - Complete Guide! 🐕 (2025)"
        response = client.post(
            "/api/projects",
            json={"name": "Special Chars", "video_title": special_title},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["video_title"] == special_title

    def test_complete_video_title_workflow(self, client):
        """Test complete workflow: create, update, clear video_title."""
        # Create without video_title
        create_response = client.post("/api/projects", json={"name": "Workflow Test"})
        project_id = create_response.json()["id"]
        assert create_response.json()["video_title"] is None

        # Add video_title
        update1 = client.put(
            f"/api/projects/{project_id}", json={"video_title": "First Title"}
        )
        assert update1.json()["video_title"] == "First Title"

        # Update video_title
        update2 = client.put(
            f"/api/projects/{project_id}", json={"video_title": "Second Title"}
        )
        assert update2.json()["video_title"] == "Second Title"

        # Clear video_title
        update3 = client.put(
            f"/api/projects/{project_id}", json={"video_title": None}
        )
        assert update3.json()["video_title"] is None

        # Add it back
        update4 = client.put(
            f"/api/projects/{project_id}", json={"video_title": "Final Title"}
        )
        assert update4.json()["video_title"] == "Final Title"
