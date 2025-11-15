"""
Integration tests for Template API endpoints.

These tests use a real SQLite database file to verify:
- Database persistence across requests
- Database constraints and uniqueness (case-insensitive)
- Transaction handling
- Placeholder validation
- Real-world database behavior

Related: Epic #166 - Title Template Management
"""

import pytest


class TestTemplateCreation:
    """Tests for POST /api/templates"""

    def test_create_template_success(self, client):
        """Test creating template with valid data."""
        response = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "Best Tools Template",
                "content": "Best {{tools}} for Testers in 2025",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "title"
        assert data["name"] == "Best Tools Template"
        assert data["content"] == "Best {{tools}} for Testers in 2025"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_template_with_multiple_placeholders(self, client):
        """Test template with multiple {{placeholders}}."""
        response = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "Multi Placeholder",
                "content": "{{number}} {{topic}} Tips for {{audience}} in {{year}}",
            },
        )

        assert response.status_code == 201
        data = response.json()
        expected = "{{number}} {{topic}} Tips for {{audience}} in {{year}}"
        assert data["content"] == expected

    def test_create_duplicate_template_fails(self, client, create_sample_template):
        """Test case-insensitive duplicate prevention."""
        # Create first template
        create_sample_template(content="Best {{tools}} for Beginners")

        # Attempt exact duplicate
        response = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "Different Name",
                "content": "Best {{tools}} for Beginners",
            },
        )

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"].lower()

    def test_create_template_case_insensitive_duplicate(
        self, client, create_sample_template
    ):
        """Test 'Best {{tools}}' and 'best {{TOOLS}}' are duplicates."""
        # Create first template
        create_sample_template(content="Best {{tools}} for Testing")

        # Attempt with different case
        response = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "Different Name",
                "content": "best {{TOOLS}} for testing",
            },
        )

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"].lower()

    def test_create_template_without_placeholder_fails(self, client):
        """Test validation: must have placeholder."""
        response = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "No Placeholder",
                "content": "This has no placeholder",
            },
        )

        assert response.status_code == 422
        detail = str(response.json()["detail"])
        assert "placeholder" in detail.lower()

    def test_create_template_with_empty_placeholder_fails(self, client):
        """Test validation: no {{}} allowed."""
        response = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "Empty Placeholder",
                "content": "Best {{}} for Testing",
            },
        )

        assert response.status_code == 422
        detail = str(response.json()["detail"])
        assert "empty" in detail.lower() or "placeholder" in detail.lower()

    def test_create_template_too_long_fails(self, client):
        """Test validation: 256 char limit."""
        long_content = "x" * 200 + " {{placeholder}} " + "y" * 100
        response = client.post(
            "/api/templates",
            json={"type": "title", "name": "Too Long", "content": long_content},
        )

        assert response.status_code == 422

    def test_create_template_trims_whitespace(self, client):
        """Test name and content whitespace trimming."""
        response = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "  Trimmed Name  ",
                "content": "  Best {{tools}} for Testing  ",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Trimmed Name"
        assert data["content"] == "Best {{tools}} for Testing"

    def test_create_template_empty_name_fails(self, client):
        """Test that empty name after trimming is rejected."""
        response = client.post(
            "/api/templates",
            json={"type": "title", "name": "   ", "content": "Best {{tools}}"},
        )

        assert response.status_code == 422

    def test_create_template_empty_content_fails(self, client):
        """Test that empty content after trimming is rejected."""
        response = client.post(
            "/api/templates",
            json={"type": "title", "name": "Test", "content": "   "},
        )

        assert response.status_code == 422

    def test_create_template_different_types_same_content(self, client):
        """Test that same content is allowed for different types."""
        # Create title template
        response1 = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "Title Template",
                "content": "Best {{tools}} for Testing",
            },
        )
        assert response1.status_code == 201

        # Create description template with same content - should succeed
        response2 = client.post(
            "/api/templates",
            json={
                "type": "description",
                "name": "Description Template",
                "content": "Best {{tools}} for Testing",
            },
        )
        assert response2.status_code == 201


class TestTemplateRetrieval:
    """Tests for GET /api/templates"""

    def test_list_all_templates(self, client, create_sample_template):
        """Test GET /api/templates returns all templates."""
        # Create multiple templates
        create_sample_template(name="Template 1", content="Best {{tools}} for Testing")
        create_sample_template(name="Template 2", content="Top {{number}} {{topic}}")
        create_sample_template(name="Template 3", content="How to {{action}}")

        response = client.get("/api/templates")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_list_templates_filtered_by_type(self, client, create_sample_template):
        """Test GET /api/templates?type=title filters correctly."""
        # Create templates of different types
        create_sample_template(type="title", content="Best {{tools}} for Testing")
        create_sample_template(type="description", content="Learn about {{topic}}")
        create_sample_template(type="title", content="Top {{number}} {{tools}}")

        response = client.get("/api/templates?type=title")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(template["type"] == "title" for template in data)

    def test_list_templates_empty(self, client):
        """Test empty list when no templates exist."""
        response = client.get("/api/templates")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_templates_ordered_by_created_at(self, client, create_sample_template):
        """Test templates returned in desc created_at order."""
        # Create templates in order
        t1 = create_sample_template(name="First", content="First {{placeholder}}")
        t2 = create_sample_template(name="Second", content="Second {{placeholder}}")
        t3 = create_sample_template(name="Third", content="Third {{placeholder}}")

        response = client.get("/api/templates")

        assert response.status_code == 200
        data = response.json()
        # Should be in reverse order (newest first)
        assert data[0]["id"] == t3["id"]
        assert data[1]["id"] == t2["id"]
        assert data[2]["id"] == t1["id"]

    def test_get_single_template(self, client, create_sample_template):
        """Test GET /api/templates/{id}."""
        template = create_sample_template(
            name="Test Template", content="Best {{tools}}"
        )

        response = client.get(f"/api/templates/{template['id']}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == template["id"]
        assert data["name"] == "Test Template"
        assert data["content"] == "Best {{tools}}"

    def test_get_nonexistent_template_404(self, client):
        """Test 404 for non-existent template."""
        response = client.get("/api/templates/9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestTemplateUpdate:
    """Tests for PUT /api/templates/{id}"""

    def test_update_template_name(self, client, create_sample_template):
        """Test updating only template name."""
        template = create_sample_template(
            name="Original Name", content="Best {{tools}}"
        )

        response = client.put(
            f"/api/templates/{template['id']}", json={"name": "Updated Name"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["content"] == "Best {{tools}}"  # Unchanged

    def test_update_template_content(self, client, create_sample_template):
        """Test updating only template content."""
        template = create_sample_template(
            name="Test Template", content="Best {{tools}}"
        )

        response = client.put(
            f"/api/templates/{template['id']}",
            json={"content": "Top {{number}} {{tools}}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Template"  # Unchanged
        assert data["content"] == "Top {{number}} {{tools}}"

    def test_update_template_all_fields(self, client, create_sample_template):
        """Test updating all fields."""
        template = create_sample_template()

        response = client.put(
            f"/api/templates/{template['id']}",
            json={
                "type": "description",
                "name": "New Name",
                "content": "New {{content}}",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "description"
        assert data["name"] == "New Name"
        assert data["content"] == "New {{content}}"

    def test_update_with_duplicate_content_fails(self, client, create_sample_template):
        """Test duplicate validation on update."""
        # Create two templates
        create_sample_template(name="Template 1", content="Best {{tools}}")
        template2 = create_sample_template(name="Template 2", content="Top {{number}}")

        # Try to update template2 to have template1's content
        response = client.put(
            f"/api/templates/{template2['id']}", json={"content": "Best {{tools}}"}
        )

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"].lower()

    def test_update_nonexistent_template_404(self, client):
        """Test 404 for update on non-existent template."""
        response = client.put(
            "/api/templates/9999", json={"name": "Updated Name"}
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_update_validates_placeholders(self, client, create_sample_template):
        """Test placeholder validation runs on update."""
        template = create_sample_template()

        # Try to update to content without placeholder
        response = client.put(
            f"/api/templates/{template['id']}",
            json={"content": "No placeholder here"},
        )

        assert response.status_code == 422
        detail = str(response.json()["detail"])
        assert "placeholder" in detail.lower()

    def test_update_template_trims_whitespace(self, client, create_sample_template):
        """Test whitespace trimming on update."""
        template = create_sample_template()

        response = client.put(
            f"/api/templates/{template['id']}",
            json={"name": "  Trimmed  ", "content": "  Best {{tools}}  "},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Trimmed"
        assert data["content"] == "Best {{tools}}"

    def test_update_template_empty_placeholder_fails(
        self, client, create_sample_template
    ):
        """Test validation: no {{}} allowed on update."""
        template = create_sample_template()

        response = client.put(
            f"/api/templates/{template['id']}",
            json={"content": "Best {{}} for Testing"},
        )

        assert response.status_code == 422

    def test_update_template_case_insensitive_duplicate(
        self, client, create_sample_template
    ):
        """Test case-insensitive duplicate detection on update."""
        create_sample_template(content="Best {{tools}} for Testing")
        template2 = create_sample_template(content="Top {{number}}")

        # Try to update with different case
        response = client.put(
            f"/api/templates/{template2['id']}",
            json={"content": "best {{TOOLS}} for testing"},
        )

        assert response.status_code == 409


class TestTemplateDeletion:
    """Tests for DELETE /api/templates/{id}"""

    def test_delete_template(self, client, create_sample_template):
        """Test deleting template returns 204."""
        template = create_sample_template()

        response = client.delete(f"/api/templates/{template['id']}")

        assert response.status_code == 204

    def test_delete_nonexistent_template_404(self, client):
        """Test 404 for delete on non-existent template."""
        response = client.delete("/api/templates/9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_delete_template_actually_removes(self, client, create_sample_template):
        """Test template is actually removed from database."""
        template = create_sample_template()

        # Delete the template
        delete_response = client.delete(f"/api/templates/{template['id']}")
        assert delete_response.status_code == 204

        # Verify it's gone
        get_response = client.get(f"/api/templates/{template['id']}")
        assert get_response.status_code == 404

        # Verify not in list
        list_response = client.get("/api/templates")
        assert len(list_response.json()) == 0


class TestTemplateTypeFiltering:
    """Tests for type-based filtering"""

    def test_filter_by_title_type(self, client, create_sample_template):
        """Test GET /api/templates?type=title."""
        # Create templates of different types
        t1 = create_sample_template(type="title", content="Best {{tools}}")
        create_sample_template(type="description", content="Learn {{topic}}")
        t3 = create_sample_template(type="title", content="Top {{number}}")

        response = client.get("/api/templates?type=title")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        ids = [template["id"] for template in data]
        assert t1["id"] in ids
        assert t3["id"] in ids

    def test_multiple_types_isolated(self, client, create_sample_template):
        """Test different types are isolated in queries."""
        # Create same content for different types
        create_sample_template(
            type="title", name="Title", content="Best {{tools}} for Testing"
        )
        create_sample_template(
            type="description", name="Desc", content="Best {{tools}} for Testing"
        )
        create_sample_template(
            type="tag", name="Tag", content="Best {{tools}} for Testing"
        )

        # Filter by each type
        title_response = client.get("/api/templates?type=title")
        desc_response = client.get("/api/templates?type=description")
        tag_response = client.get("/api/templates?type=tag")

        assert len(title_response.json()) == 1
        assert len(desc_response.json()) == 1
        assert len(tag_response.json()) == 1

        # All templates should be returned without filter
        all_response = client.get("/api/templates")
        assert len(all_response.json()) == 3

    def test_filter_nonexistent_type(self, client, create_sample_template):
        """Test filtering by type that doesn't exist returns empty list."""
        create_sample_template(type="title")

        response = client.get("/api/templates?type=nonexistent")

        assert response.status_code == 200
        assert response.json() == []


class TestTemplateWorkflow:
    """End-to-end workflow tests"""

    def test_complete_crud_lifecycle(self, client):
        """Test create → read → update → delete workflow."""
        # 1. Create a template
        create_response = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "Lifecycle Test",
                "content": "Best {{tools}} for Testing",
            },
        )
        assert create_response.status_code == 201
        template_id = create_response.json()["id"]

        # 2. Verify it appears in the list
        list_response = client.get("/api/templates")
        assert len(list_response.json()) == 1

        # 3. Get the specific template
        get_response = client.get(f"/api/templates/{template_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Lifecycle Test"

        # 4. Update the name
        update1_response = client.put(
            f"/api/templates/{template_id}", json={"name": "Updated Name"}
        )
        assert update1_response.status_code == 200
        assert update1_response.json()["name"] == "Updated Name"

        # 5. Update the content
        update2_response = client.put(
            f"/api/templates/{template_id}",
            json={"content": "Top {{number}} {{tools}}"},
        )
        assert update2_response.status_code == 200

        # 6. Update the type
        update3_response = client.put(
            f"/api/templates/{template_id}", json={"type": "description"}
        )
        assert update3_response.status_code == 200
        assert update3_response.json()["type"] == "description"

        # 7. Delete the template
        delete_response = client.delete(f"/api/templates/{template_id}")
        assert delete_response.status_code == 204

        # 8. Verify it's gone
        get_deleted_response = client.get(f"/api/templates/{template_id}")
        assert get_deleted_response.status_code == 404

        # 9. Verify list is empty
        final_list_response = client.get("/api/templates")
        assert len(final_list_response.json()) == 0

    def test_managing_multiple_templates(self, client):
        """Test managing multiple templates simultaneously."""
        # Create multiple templates
        templates = []
        placeholders = ["tools", "topic", "audience", "year", "format"]
        for i in range(5):
            response = client.post(
                "/api/templates",
                json={
                    "type": "title",
                    "name": f"Template {i + 1}",
                    "content": f"Content {{{{{placeholders[i]}}}}}",
                },
            )
            assert response.status_code == 201
            templates.append(response.json())

        # Verify all exist
        list_response = client.get("/api/templates")
        assert len(list_response.json()) == 5

        # Update some templates
        client.put(
            f"/api/templates/{templates[0]['id']}",
            json={"name": "Updated Template 1"},
        )
        client.put(
            f"/api/templates/{templates[1]['id']}",
            json={"type": "description"},
        )

        # Delete one
        client.delete(f"/api/templates/{templates[2]['id']}")

        # Verify final state
        final_list = client.get("/api/templates").json()
        assert len(final_list) == 4

        # Check updates persisted
        updated_template = client.get(f"/api/templates/{templates[0]['id']}").json()
        assert updated_template["name"] == "Updated Template 1"

        type_updated = client.get(f"/api/templates/{templates[1]['id']}").json()
        assert type_updated["type"] == "description"

    def test_template_persistence_across_sessions(self, client, db_file_path):
        """Test that created templates persist in the database file."""
        # Create a template
        template_data = {
            "type": "title",
            "name": "Persistent Template",
            "content": "Best {{tools}} for Testing",
        }
        create_response = client.post("/api/templates", json=template_data)
        assert create_response.status_code == 201
        template_id = create_response.json()["id"]

        # Verify database file exists
        assert db_file_path.exists()

        # Verify we can retrieve it
        get_response = client.get(f"/api/templates/{template_id}")
        assert get_response.status_code == 200
        assert get_response.json()["name"] == "Persistent Template"


class TestDatabaseConstraints:
    """Tests that verify database constraints are enforced"""

    def test_case_insensitive_uniqueness_constraint(
        self, client, create_sample_template
    ):
        """Test that database enforces case-insensitive uniqueness at DB level."""
        # Create first template
        create_sample_template(content="Best {{tools}} for Testing")

        # Attempt exact duplicate
        response = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "Different",
                "content": "Best {{tools}} for Testing",
            },
        )
        assert response.status_code == 409

        # Attempt case variation
        response2 = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "Different",
                "content": "BEST {{TOOLS}} FOR TESTING",
            },
        )
        assert response2.status_code == 409

    def test_database_constraint_direct_enforcement(self, client, db_session):
        """
        Test that database-level case-insensitive UNIQUE constraint is enforced.

        This test verifies the functional index on (type, LOWER(content))
        prevents duplicate content at the database level.

        Related: Epic #166
        """
        from sqlalchemy.exc import IntegrityError

        from app.models import Template

        # Create first template via API
        response = client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "First",
                "content": "Best {{tools}} for Testing",
            },
        )
        assert response.status_code == 201

        # Try to bypass application-level validation by inserting directly
        duplicate = Template(
            type="title",
            name="Bypass Attempt",
            content="best {{tools}} for testing",  # Different case
        )

        db_session.add(duplicate)

        with pytest.raises(IntegrityError) as exc_info:
            db_session.commit()

        # Verify it's the specific unique constraint that failed
        assert "uix_template_type_content_lower" in str(exc_info.value).lower()

        db_session.rollback()


class TestErrorRecovery:
    """Tests that verify the system recovers properly from errors"""

    def test_database_state_after_validation_error(self, client):
        """Test that database remains consistent after validation errors."""
        # Create valid template
        client.post(
            "/api/templates",
            json={
                "type": "title",
                "name": "Valid",
                "content": "Best {{tools}}",
            },
        )

        # Attempt invalid operations
        client.post(
            "/api/templates",
            json={"type": "title", "name": "", "content": "Best {{tools}}"},
        )  # Empty name
        client.post(
            "/api/templates", json={"type": "title", "name": "Test"}
        )  # Missing content
        client.post(
            "/api/templates",
            json={"type": "title", "name": "Test", "content": "No placeholder"},
        )

        # Database should still have only one valid template
        list_response = client.get("/api/templates")
        assert len(list_response.json()) == 1
        assert list_response.json()[0]["name"] == "Valid"

    def test_failed_update_preserves_original(self, client, create_sample_template):
        """Test that failed updates don't modify the database."""
        # Create two templates
        create_sample_template(name="Template 1", content="Best {{tools}}")
        template2 = create_sample_template(name="Template 2", content="Top {{number}}")

        # Attempt to update template2 to have template1's content (should fail)
        response = client.put(
            f"/api/templates/{template2['id']}",
            json={"content": "Best {{tools}}"},
        )
        assert response.status_code == 409

        # Verify template2 unchanged
        get_response = client.get(f"/api/templates/{template2['id']}")
        assert get_response.json()["content"] == "Top {{number}}"
