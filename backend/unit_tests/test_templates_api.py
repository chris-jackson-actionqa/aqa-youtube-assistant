"""
Unit tests for Templates CRUD API endpoints.

Tests all CRUD operations for the /api/templates endpoints including:
- Creating templates
- Reading templates (list and single)
- Updating templates
- Deleting templates
- Error cases and validation
- Case-insensitive duplicate checking

Related: Epic #166, Issue #169
"""

import pytest


@pytest.fixture
def sample_template_data():
    """Sample template data for testing."""
    return {
        "type": "title",
        "name": "Test Template",
        "content": "How to {{topic}} in {{year}}",
    }


@pytest.fixture
def create_sample_template(client):
    """Fixture to create a template and return its data."""

    def _create_template(**kwargs):
        data = {
            "type": kwargs.get("type", "title"),
            "name": kwargs.get("name", "Test Template"),
            "content": kwargs.get("content", "How to {{topic}} in {{year}}"),
        }
        response = client.post("/api/templates", json=data)
        return response.json()

    return _create_template


class TestCreateTemplate:
    """Tests for creating templates via POST /api/templates."""

    def test_create_template_success(self, client, sample_template_data):
        """Test successful template creation."""
        response = client.post("/api/templates", json=sample_template_data)

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == sample_template_data["type"]
        assert data["name"] == sample_template_data["name"]
        assert data["content"] == sample_template_data["content"]
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_template_all_fields(self, client):
        """Test creating template with all fields specified."""
        template_data = {
            "type": "description",
            "name": "Description Template",
            "content": "Learn {{skill}} with {{instructor}}",
        }
        response = client.post("/api/templates", json=template_data)

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "description"
        assert data["name"] == "Description Template"
        assert data["content"] == "Learn {{skill}} with {{instructor}}"

    def test_create_template_duplicate_exact_match(
        self, client, create_sample_template
    ):
        """Test that duplicate content is rejected (exact match, same type)."""
        # Create first template
        create_sample_template(
            type="title", name="First", content="How to {{topic}} in {{year}}"
        )

        # Attempt to create duplicate
        duplicate_data = {
            "type": "title",
            "name": "Second",
            "content": "How to {{topic}} in {{year}}",
        }
        response = client.post("/api/templates", json=duplicate_data)

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_create_template_duplicate_different_case(
        self, client, create_sample_template
    ):
        """Test that duplicate content is rejected even with different case."""
        # Create first template
        create_sample_template(
            type="title", name="First", content="How to {{topic}} in {{year}}"
        )

        # Attempt to create with different case
        duplicate_data = {
            "type": "title",
            "name": "Second",
            "content": "HOW TO {{TOPIC}} IN {{YEAR}}",
        }
        response = client.post("/api/templates", json=duplicate_data)

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_create_template_same_content_different_type(
        self, client, create_sample_template
    ):
        """Test that same content is allowed for different types."""
        # Create first template with type 'title'
        create_sample_template(
            type="title", name="Title Template", content="Best {{topic}} tutorial"
        )

        # Create second template with same content but type 'description'
        duplicate_data = {
            "type": "description",
            "name": "Description Template",
            "content": "Best {{topic}} tutorial",
        }
        response = client.post("/api/templates", json=duplicate_data)

        # Should succeed because type is different
        assert response.status_code == 201

    def test_create_template_missing_type(self, client):
        """Test that creating template without type fails validation."""
        invalid_data = {"name": "Test", "content": "{{placeholder}}"}
        response = client.post("/api/templates", json=invalid_data)

        assert response.status_code == 422  # Validation error

    def test_create_template_missing_name(self, client):
        """Test that creating template without name fails validation."""
        invalid_data = {"type": "title", "content": "{{placeholder}}"}
        response = client.post("/api/templates", json=invalid_data)

        assert response.status_code == 422

    def test_create_template_missing_content(self, client):
        """Test that creating template without content fails validation."""
        invalid_data = {"type": "title", "name": "Test"}
        response = client.post("/api/templates", json=invalid_data)

        assert response.status_code == 422

    def test_create_template_empty_type(self, client):
        """Test that empty type fails validation."""
        invalid_data = {"type": "", "name": "Test", "content": "{{placeholder}}"}
        response = client.post("/api/templates", json=invalid_data)

        assert response.status_code == 422

    def test_create_template_empty_name(self, client):
        """Test that empty name fails validation."""
        invalid_data = {"type": "title", "name": "", "content": "{{placeholder}}"}
        response = client.post("/api/templates", json=invalid_data)

        assert response.status_code == 422

    def test_create_template_empty_content(self, client):
        """Test that empty content fails validation."""
        invalid_data = {"type": "title", "name": "Test", "content": ""}
        response = client.post("/api/templates", json=invalid_data)

        assert response.status_code == 422

    def test_create_template_no_placeholder(self, client):
        """Test that content without placeholder fails validation."""
        invalid_data = {
            "type": "title",
            "name": "Test",
            "content": "No placeholder here",
        }
        response = client.post("/api/templates", json=invalid_data)

        assert response.status_code == 422
        assert "must contain at least one" in str(response.json()["detail"]).lower()

    def test_create_template_empty_placeholder(self, client):
        """Test that content with empty placeholder fails validation."""
        invalid_data = {
            "type": "title",
            "name": "Test",
            "content": "Empty placeholder {{}} test",
        }
        response = client.post("/api/templates", json=invalid_data)

        assert response.status_code == 422
        # The validation checks for valid placeholders first, so empty {{}}
        # results in "must contain at least one" error
        assert "must contain at least one" in str(response.json()["detail"]).lower()

    def test_create_template_whitespace_trimmed(self, client):
        """Test that whitespace is trimmed from name and content."""
        data = {
            "type": "title",
            "name": "  Trimmed Name  ",
            "content": "  {{placeholder}}  ",
        }
        response = client.post("/api/templates", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["name"] == "Trimmed Name"
        assert result["content"] == "{{placeholder}}"

    def test_create_template_multiple_placeholders(self, client):
        """Test creating template with multiple placeholders."""
        data = {
            "type": "title",
            "name": "Multi Placeholder",
            "content": "{{first}} and {{second}} and {{third}}",
        }
        response = client.post("/api/templates", json=data)

        assert response.status_code == 201
        assert response.json()["content"] == "{{first}} and {{second}} and {{third}}"

    def test_create_template_max_length_content(self, client):
        """Test creating template with maximum allowed content length (256 chars)."""
        # Create content that's exactly 256 characters with placeholder
        placeholder = "{{topic}}"
        filler = "a" * (256 - len(placeholder))
        max_content = filler + placeholder

        data = {"type": "title", "name": "Max Length", "content": max_content}
        response = client.post("/api/templates", json=data)

        assert response.status_code == 201

    def test_create_template_exceeds_max_length_content(self, client):
        """Test that content exceeding 256 chars fails validation."""
        # Create content that exceeds 256 characters
        placeholder = "{{topic}}"
        filler = "a" * (257 - len(placeholder))
        long_content = filler + placeholder

        data = {"type": "title", "name": "Too Long", "content": long_content}
        response = client.post("/api/templates", json=data)

        assert response.status_code == 422


class TestListTemplates:
    """Tests for listing templates via GET /api/templates."""

    def test_list_templates_empty(self, client):
        """Test listing templates when none exist."""
        response = client.get("/api/templates")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_templates_multiple(self, client, create_sample_template):
        """Test listing multiple templates."""
        # Create multiple templates
        create_sample_template(type="title", name="First", content="{{a}}")
        create_sample_template(type="description", name="Second", content="{{b}}")
        create_sample_template(type="title", name="Third", content="{{c}}")

        response = client.get("/api/templates")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_list_templates_ordered_by_created_desc(
        self, client, create_sample_template
    ):
        """Test that templates are ordered by created_at descending (newest first)."""
        # Create templates in sequence
        first = create_sample_template(type="title", name="First", content="{{a}}")
        second = create_sample_template(type="title", name="Second", content="{{b}}")
        third = create_sample_template(type="title", name="Third", content="{{c}}")

        response = client.get("/api/templates")

        assert response.status_code == 200
        data = response.json()
        # Newest first (reversed order of creation)
        assert data[0]["id"] == third["id"]
        assert data[1]["id"] == second["id"]
        assert data[2]["id"] == first["id"]

    def test_list_templates_filter_by_type(self, client, create_sample_template):
        """Test filtering templates by type."""
        # Create templates of different types
        create_sample_template(type="title", name="Title 1", content="{{a}}")
        create_sample_template(type="description", name="Desc 1", content="{{b}}")
        create_sample_template(type="title", name="Title 2", content="{{c}}")
        create_sample_template(type="description", name="Desc 2", content="{{d}}")

        # Filter by 'title'
        response = client.get("/api/templates?type=title")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(t["type"] == "title" for t in data)

    def test_list_templates_filter_by_type_no_matches(
        self, client, create_sample_template
    ):
        """Test filtering by type that has no templates."""
        create_sample_template(type="title", name="Test", content="{{a}}")

        response = client.get("/api/templates?type=nonexistent")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_templates_filter_preserves_order(
        self, client, create_sample_template
    ):
        """Test that type filtering preserves created_at desc order."""
        first = create_sample_template(type="title", name="First", content="{{a}}")
        create_sample_template(type="description", name="Desc", content="{{b}}")
        second = create_sample_template(type="title", name="Second", content="{{c}}")

        response = client.get("/api/templates?type=title")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        # Newest first
        assert data[0]["id"] == second["id"]
        assert data[1]["id"] == first["id"]


class TestGetTemplate:
    """Tests for getting a single template via GET /api/templates/{id}."""

    def test_get_template_success(self, client, create_sample_template):
        """Test successfully retrieving a template by ID."""
        template = create_sample_template(
            type="title", name="Test", content="{{placeholder}}"
        )

        response = client.get(f"/api/templates/{template['id']}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == template["id"]
        assert data["type"] == "title"
        assert data["name"] == "Test"
        assert data["content"] == "{{placeholder}}"

    def test_get_template_not_found(self, client):
        """Test getting a non-existent template returns 404."""
        response = client.get("/api/templates/999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_get_template_invalid_id_type(self, client):
        """Test that invalid ID type returns 422."""
        response = client.get("/api/templates/invalid")

        assert response.status_code == 422


class TestUpdateTemplate:
    """Tests for updating templates via PUT /api/templates/{id}."""

    def test_update_template_name_only(self, client, create_sample_template):
        """Test updating only the name field."""
        template = create_sample_template(
            type="title", name="Original", content="{{placeholder}}"
        )

        update_data = {"name": "Updated Name"}
        response = client.put(f"/api/templates/{template['id']}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["type"] == "title"  # Unchanged
        assert data["content"] == "{{placeholder}}"  # Unchanged

    def test_update_template_content_only(self, client, create_sample_template):
        """Test updating only the content field."""
        template = create_sample_template(
            type="title", name="Test", content="{{old}}"
        )

        update_data = {"content": "{{new}} content"}
        response = client.put(f"/api/templates/{template['id']}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["content"] == "{{new}} content"
        assert data["name"] == "Test"  # Unchanged
        assert data["type"] == "title"  # Unchanged

    def test_update_template_type_only(self, client, create_sample_template):
        """Test updating only the type field."""
        template = create_sample_template(
            type="title", name="Test", content="{{placeholder}}"
        )

        update_data = {"type": "description"}
        response = client.put(f"/api/templates/{template['id']}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "description"
        assert data["name"] == "Test"  # Unchanged
        assert data["content"] == "{{placeholder}}"  # Unchanged

    def test_update_template_all_fields(self, client, create_sample_template):
        """Test updating all fields at once."""
        template = create_sample_template(
            type="title", name="Original", content="{{old}}"
        )

        update_data = {
            "type": "description",
            "name": "Updated",
            "content": "{{new}} and {{better}}",
        }
        response = client.put(f"/api/templates/{template['id']}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "description"
        assert data["name"] == "Updated"
        assert data["content"] == "{{new}} and {{better}}"

    def test_update_template_not_found(self, client):
        """Test updating a non-existent template returns 404."""
        update_data = {"name": "Test"}
        response = client.put("/api/templates/999", json=update_data)

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_update_template_duplicate_content_same_type(
        self, client, create_sample_template
    ):
        """Test that updating to duplicate content fails (same type)."""
        # Create two templates
        template1 = create_sample_template(
            type="title", name="First", content="{{unique1}}"
        )
        create_sample_template(type="title", name="Second", content="{{unique2}}")

        # Try to update first to match second
        update_data = {"content": "{{unique2}}"}
        response = client.put(f"/api/templates/{template1['id']}", json=update_data)

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_update_template_duplicate_content_different_case(
        self, client, create_sample_template
    ):
        """Test that updating to duplicate content fails even with different case."""
        template1 = create_sample_template(
            type="title", name="First", content="{{unique1}}"
        )
        create_sample_template(type="title", name="Second", content="{{unique2}}")

        # Try to update with different case
        update_data = {"content": "{{UNIQUE2}}"}
        response = client.put(f"/api/templates/{template1['id']}", json=update_data)

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_update_template_type_only_creates_duplicate(
        self, client, create_sample_template
    ):
        """Test that updating type alone can create a duplicate and is detected."""
        # Template A: type="title", content="{{test}}"
        template_a = create_sample_template(
            type="title", name="Template A", content="{{test}}"
        )
        # Template B: type="description", content="{{test}}"
        create_sample_template(
            type="description", name="Template B", content="{{test}}"
        )

        # Try to update Template A's type to "description" - should fail (duplicate)
        update_data = {"type": "description"}
        response = client.put(f"/api/templates/{template_a['id']}", json=update_data)

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_update_template_to_same_content_succeeds(
        self, client, create_sample_template
    ):
        """Test that updating template to its own content succeeds."""
        template = create_sample_template(
            type="title", name="Test", content="{{placeholder}}"
        )

        # Update to same content (should succeed)
        update_data = {"content": "{{placeholder}}"}
        response = client.put(f"/api/templates/{template['id']}", json=update_data)

        assert response.status_code == 200

    def test_update_template_content_no_placeholder(
        self, client, create_sample_template
    ):
        """Test that updating content to invalid value (no placeholder) fails."""
        template = create_sample_template(
            type="title", name="Test", content="{{placeholder}}"
        )

        update_data = {"content": "No placeholder"}
        response = client.put(f"/api/templates/{template['id']}", json=update_data)

        assert response.status_code == 422
        assert "must contain at least one" in str(response.json()["detail"]).lower()

    def test_update_template_content_empty_placeholder(
        self, client, create_sample_template
    ):
        """Test that updating content with empty placeholder fails."""
        template = create_sample_template(
            type="title", name="Test", content="{{placeholder}}"
        )

        update_data = {"content": "Empty {{}} here"}
        response = client.put(f"/api/templates/{template['id']}", json=update_data)

        assert response.status_code == 422
        # The validation checks for valid placeholders first, so empty {{}}
        # results in "must contain at least one" error
        assert "must contain at least one" in str(response.json()["detail"]).lower()

    def test_update_template_empty_name(self, client, create_sample_template):
        """Test that updating to empty name fails validation."""
        template = create_sample_template(
            type="title", name="Test", content="{{placeholder}}"
        )

        update_data = {"name": ""}
        response = client.put(f"/api/templates/{template['id']}", json=update_data)

        assert response.status_code == 422

    def test_update_template_whitespace_trimmed(self, client, create_sample_template):
        """Test that whitespace is trimmed when updating."""
        template = create_sample_template(
            type="title", name="Original", content="{{placeholder}}"
        )

        update_data = {"name": "  Trimmed  ", "content": "  {{trimmed}}  "}
        response = client.put(f"/api/templates/{template['id']}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Trimmed"
        assert data["content"] == "{{trimmed}}"

    def test_update_template_change_type_with_duplicate_content(
        self, client, create_sample_template
    ):
        """Test updating type to one where content is duplicate."""
        # Create template with type='title' and content='{{test}}'
        template1 = create_sample_template(
            type="title", name="Title", content="{{test}}"
        )
        # Create template with type='description' and content='{{other}}'
        create_sample_template(
            type="description", name="Desc", content="{{other}}"
        )

        # Try to update template1's type to 'description' and content to
        # '{{other}}'. This should fail because there's already a description
        # template with that content
        update_data = {"type": "description", "content": "{{other}}"}
        response = client.put(f"/api/templates/{template1['id']}", json=update_data)

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]


class TestDeleteTemplate:
    """Tests for deleting templates via DELETE /api/templates/{id}."""

    def test_delete_template_success(self, client, create_sample_template):
        """Test successfully deleting a template."""
        template = create_sample_template(
            type="title", name="Test", content="{{placeholder}}"
        )

        response = client.delete(f"/api/templates/{template['id']}")

        assert response.status_code == 204
        assert response.content == b""

        # Verify it's deleted
        get_response = client.get(f"/api/templates/{template['id']}")
        assert get_response.status_code == 404

    def test_delete_template_not_found(self, client):
        """Test deleting a non-existent template returns 404."""
        response = client.delete("/api/templates/999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_delete_template_invalid_id_type(self, client):
        """Test that invalid ID type returns 422."""
        response = client.delete("/api/templates/invalid")

        assert response.status_code == 422

    def test_delete_template_allows_recreate(self, client, create_sample_template):
        """Test that deleting a template allows creating one with same content."""
        # Create template
        template = create_sample_template(
            type="title", name="Test", content="{{placeholder}}"
        )

        # Delete it
        response = client.delete(f"/api/templates/{template['id']}")
        assert response.status_code == 204

        # Create new template with same content
        new_data = {"type": "title", "name": "New", "content": "{{placeholder}}"}
        response = client.post("/api/templates", json=new_data)

        assert response.status_code == 201


class TestTemplateWorkspaceScoping:
    """Tests for workspace scoping of templates (Issue #91)."""

    @pytest.fixture(autouse=True)
    def setup_workspaces(self, db_session):
        """Create additional test workspaces."""
        from app.models import Workspace

        # Workspace 1 is already created by conftest
        # Create workspaces 2 and 3 for testing
        ws2 = Workspace(id=2, name="Workspace 2", description="Test workspace 2")
        ws3 = Workspace(id=3, name="Workspace 3", description="Test workspace 3")
        db_session.add(ws2)
        db_session.add(ws3)
        db_session.commit()

    def test_create_template_uses_workspace_id_from_header(self, client):
        """Test that template creation uses workspace_id from X-Workspace-Id header."""
        data = {"type": "title", "name": "Workspace Test", "content": "{{topic}}"}

        # Create with workspace_id=1 (default)
        response = client.post(
            "/api/templates", json=data, headers={"X-Workspace-Id": "1"}
        )

        assert response.status_code == 201
        result = response.json()
        assert result["workspace_id"] == 1

    def test_create_template_defaults_to_workspace_id_1(self, client):
        """Test template creation defaults to workspace_id=1 if header absent."""
        data = {"type": "title", "name": "Default Workspace", "content": "{{topic}}"}

        # Create without header
        response = client.post("/api/templates", json=data)

        assert response.status_code == 201
        result = response.json()
        assert result["workspace_id"] == 1

    def test_create_template_with_custom_workspace_id(self, client):
        """Test creating template in custom workspace."""
        data = {"type": "title", "name": "Custom Workspace", "content": "{{topic}}"}

        response = client.post(
            "/api/templates", json=data, headers={"X-Workspace-Id": "2"}
        )

        assert response.status_code == 201
        result = response.json()
        assert result["workspace_id"] == 2

    def test_list_templates_filters_by_workspace_id(self, client):
        """Test that list templates only returns templates from current workspace."""
        # Create template in workspace 1
        data1 = {"type": "title", "name": "WS1 Template", "content": "{{a}}"}
        response1 = client.post(
            "/api/templates", json=data1, headers={"X-Workspace-Id": "1"}
        )
        assert response1.status_code == 201

        # Create template in workspace 2
        data2 = {"type": "title", "name": "WS2 Template", "content": "{{b}}"}
        response2 = client.post(
            "/api/templates", json=data2, headers={"X-Workspace-Id": "2"}
        )
        assert response2.status_code == 201

        # List templates in workspace 1 (default)
        list_response = client.get("/api/templates", headers={"X-Workspace-Id": "1"})
        assert list_response.status_code == 200
        templates = list_response.json()
        assert len(templates) == 1
        assert templates[0]["name"] == "WS1 Template"
        assert templates[0]["workspace_id"] == 1

        # List templates in workspace 2
        list_response = client.get("/api/templates", headers={"X-Workspace-Id": "2"})
        assert list_response.status_code == 200
        templates = list_response.json()
        assert len(templates) == 1
        assert templates[0]["name"] == "WS2 Template"
        assert templates[0]["workspace_id"] == 2

    def test_list_templates_with_filter_and_workspace_scoping(self, client):
        """Test that type filter respects workspace scoping."""
        # Create title template in workspace 1
        client.post(
            "/api/templates",
            json={"type": "title", "name": "Title WS1", "content": "{{a}}"},
            headers={"X-Workspace-Id": "1"},
        )

        # Create description template in workspace 1
        client.post(
            "/api/templates",
            json={"type": "description", "name": "Desc WS1", "content": "{{b}}"},
            headers={"X-Workspace-Id": "1"},
        )

        # Create title template in workspace 2
        client.post(
            "/api/templates",
            json={"type": "title", "name": "Title WS2", "content": "{{c}}"},
            headers={"X-Workspace-Id": "2"},
        )

        # List title templates in workspace 1
        response = client.get(
            "/api/templates?type=title", headers={"X-Workspace-Id": "1"}
        )
        assert response.status_code == 200
        templates = list(response.json())
        assert len(templates) == 1
        assert templates[0]["name"] == "Title WS1"

        # List title templates in workspace 2
        response = client.get(
            "/api/templates?type=title", headers={"X-Workspace-Id": "2"}
        )
        assert response.status_code == 200
        templates = response.json()
        assert len(templates) == 1
        assert templates[0]["name"] == "Title WS2"

    def test_get_template_filters_by_workspace_id(self, client):
        """Test that getting a template checks workspace_id match."""
        # Create template in workspace 1
        response1 = client.post(
            "/api/templates",
            json={"type": "title", "name": "WS1", "content": "{{a}}"},
            headers={"X-Workspace-Id": "1"},
        )
        template_id = response1.json()["id"]

        # Get template as workspace 1 - should succeed
        get_response = client.get(
            f"/api/templates/{template_id}", headers={"X-Workspace-Id": "1"}
        )
        assert get_response.status_code == 200

        # Get template as workspace 2 - should return 404 (not found in workspace 2)
        get_response = client.get(
            f"/api/templates/{template_id}", headers={"X-Workspace-Id": "2"}
        )
        assert get_response.status_code == 404

    def test_update_template_filters_by_workspace_id(self, client):
        """Test that updating a template checks workspace_id match."""
        # Create template in workspace 1
        response1 = client.post(
            "/api/templates",
            json={"type": "title", "name": "Original", "content": "{{a}}"},
            headers={"X-Workspace-Id": "1"},
        )
        template_id = response1.json()["id"]

        # Update as workspace 1 - should succeed
        update_response = client.put(
            f"/api/templates/{template_id}",
            json={"name": "Updated"},
            headers={"X-Workspace-Id": "1"},
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated"

        # Update as workspace 2 - should return 404
        update_response = client.put(
            f"/api/templates/{template_id}",
            json={"name": "Hacked"},
            headers={"X-Workspace-Id": "2"},
        )
        assert update_response.status_code == 404

    def test_delete_template_filters_by_workspace_id(self, client):
        """Test that deleting a template checks workspace_id match."""
        # Create template in workspace 1
        response1 = client.post(
            "/api/templates",
            json={"type": "title", "name": "Delete Test", "content": "{{a}}"},
            headers={"X-Workspace-Id": "1"},
        )
        template_id = response1.json()["id"]

        # Delete as workspace 2 - should return 404
        delete_response = client.delete(
            f"/api/templates/{template_id}", headers={"X-Workspace-Id": "2"}
        )
        assert delete_response.status_code == 404

        # Verify template still exists in workspace 1
        get_response = client.get(
            f"/api/templates/{template_id}", headers={"X-Workspace-Id": "1"}
        )
        assert get_response.status_code == 200

        # Delete as workspace 1 - should succeed
        delete_response = client.delete(
            f"/api/templates/{template_id}", headers={"X-Workspace-Id": "1"}
        )
        assert delete_response.status_code == 204

    def test_duplicate_check_scoped_by_workspace(self, client):
        """Test that duplicate content check is scoped by workspace."""
        # Create template in workspace 1
        client.post(
            "/api/templates",
            json={"type": "title", "name": "WS1", "content": "{{same}}"},
            headers={"X-Workspace-Id": "1"},
        )

        # Same content in workspace 2 should be allowed (different workspace)
        response = client.post(
            "/api/templates",
            json={"type": "title", "name": "WS2", "content": "{{same}}"},
            headers={"X-Workspace-Id": "2"},
        )
        assert response.status_code == 201

        # Same content in workspace 1 should fail (same workspace)
        response = client.post(
            "/api/templates",
            json={"type": "title", "name": "WS1 Dup", "content": "{{same}}"},
            headers={"X-Workspace-Id": "1"},
        )
        assert response.status_code == 409

    def test_template_response_includes_workspace_id(self, client):
        """Test that template response includes workspace_id field."""
        response = client.post(
            "/api/templates",
            json={"type": "title", "name": "Test", "content": "{{a}}"},
            headers={"X-Workspace-Id": "3"},
        )

        assert response.status_code == 201
        result = response.json()
        assert "workspace_id" in result
        assert result["workspace_id"] == 3

    def test_invalid_workspace_id_header_defaults_to_1(self, client):
        """Test that invalid/null workspace_id header defaults to 1."""
        response = client.post(
            "/api/templates",
            json={"type": "title", "name": "Test", "content": "{{a}}"},
            headers={"X-Workspace-Id": "0"},  # Zero or empty treated as invalid
        )

        # Should default to 1 or accept valid workspace_id
        assert response.status_code == 201
        # When X-Workspace-Id is not a valid workspace, it should default to 1
        assert response.json()["workspace_id"] == 1

    def test_create_template_with_nonexistent_workspace_returns_404(self, client):
        """Test that creating template with non-existent workspace returns 404."""
        response = client.post(
            "/api/templates",
            json={"type": "title", "name": "Test", "content": "{{a}}"},
            headers={"X-Workspace-Id": "9999"},  # Non-existent workspace
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
