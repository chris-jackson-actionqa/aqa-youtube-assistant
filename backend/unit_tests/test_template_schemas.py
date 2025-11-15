"""
Unit tests for Template Pydantic schemas.

Tests validation rules for template schemas including:
- Field validation (required, optional, max_length)
- Whitespace trimming
- Placeholder validation (at least one, no empty placeholders)
- Type validation

Related: Issue #167, Epic #166 - Title Template Management
"""

import pytest
from pydantic import ValidationError

from app.schemas import (
    TemplateBase,
    TemplateCreate,
    TemplateResponse,
    TemplateUpdate,
)


class TestTemplateBaseSchema:
    """Tests for TemplateBase schema."""

    def test_template_base_valid_full(self):
        """Test creating template base with all valid fields."""
        data = {
            "type": "title",
            "name": "Test Template",
            "content": "{{topic}} in {{year}}",
        }
        template = TemplateBase(**data)

        assert template.type == "title"
        assert template.name == "Test Template"
        assert template.content == "{{topic}} in {{year}}"

    def test_template_base_all_fields_required(self):
        """Test that all fields are required."""
        # Missing type
        with pytest.raises(ValidationError) as exc_info:
            TemplateBase(name="Test", content="{{test}}")
        errors = exc_info.value.errors()
        assert any(error["loc"] == ("type",) for error in errors)

        # Missing name
        with pytest.raises(ValidationError) as exc_info:
            TemplateBase(type="title", content="{{test}}")
        errors = exc_info.value.errors()
        assert any(error["loc"] == ("name",) for error in errors)

        # Missing content
        with pytest.raises(ValidationError) as exc_info:
            TemplateBase(type="title", name="Test")
        errors = exc_info.value.errors()
        assert any(error["loc"] == ("content",) for error in errors)

    def test_template_base_type_max_length(self):
        """Test that type field respects 50 char limit."""
        data = {
            "type": "x" * 51,
            "name": "Test",
            "content": "{{test}}",
        }
        with pytest.raises(ValidationError) as exc_info:
            TemplateBase(**data)
        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("type",) and "50" in str(error) for error in errors
        )

    def test_template_base_name_max_length(self):
        """Test that name field respects 100 char limit."""
        data = {
            "type": "title",
            "name": "x" * 101,
            "content": "{{test}}",
        }
        with pytest.raises(ValidationError) as exc_info:
            TemplateBase(**data)
        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("name",) and "100" in str(error) for error in errors
        )

    def test_template_base_content_max_length(self):
        """Test that content field respects 256 char limit."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "x" * 256 + "{{test}}",  # 256 + placeholder
        }
        with pytest.raises(ValidationError) as exc_info:
            TemplateBase(**data)
        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("content",) and "256" in str(error) for error in errors
        )


class TestTemplateCreateSchema:
    """Tests for TemplateCreate schema validation."""

    def test_create_template_valid_full(self):
        """Test creating template with all valid fields."""
        data = {
            "type": "title",
            "name": "How-To Template",
            "content": "How to {{action}} in {{year}}",
        }
        template = TemplateCreate(**data)

        assert template.type == "title"
        assert template.name == "How-To Template"
        assert template.content == "How to {{action}} in {{year}}"

    def test_create_template_name_trim_whitespace(self):
        """Test that leading/trailing whitespace is trimmed from name."""
        data = {
            "type": "title",
            "name": "  Test Template  ",
            "content": "{{test}}",
        }
        template = TemplateCreate(**data)

        assert template.name == "Test Template"

    def test_create_template_content_trim_whitespace(self):
        """Test that leading/trailing whitespace is trimmed from content."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "  {{test}} content  ",
        }
        template = TemplateCreate(**data)

        assert template.content == "{{test}} content"

    def test_create_template_name_empty_after_trim(self):
        """Test that name with only whitespace fails validation."""
        data = {
            "type": "title",
            "name": "   ",
            "content": "{{test}}",
        }
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("name",)
            and ("empty" in str(error).lower() or "whitespace" in str(error).lower())
            for error in errors
        )

    def test_create_template_content_empty_after_trim(self):
        """Test that content with only whitespace fails validation."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "   ",
        }
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("content",)
            and ("empty" in str(error).lower() or "whitespace" in str(error).lower())
            for error in errors
        )

    def test_create_template_placeholder_validation_success(self):
        """Test that content with valid placeholders passes."""
        test_cases = [
            "{{topic}}",
            "{{topic}} in {{year}}",
            "How to {{action}} - {{year}} Guide",
            "{{a}} {{b}} {{c}}",
            "Text {{placeholder}} more text",
        ]

        for content in test_cases:
            data = {
                "type": "title",
                "name": "Test",
                "content": content,
            }
            template = TemplateCreate(**data)
            assert template.content == content

    def test_create_template_no_placeholders_fails(self):
        """Test that content without placeholders fails validation."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "No placeholders here",
        }
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("content",)
            and "placeholder" in str(error).lower()
            for error in errors
        )

    def test_create_template_empty_placeholder_fails(self):
        """Test that empty placeholders {{}} are rejected."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "Test {{}} content",
        }
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(**data)

        errors = exc_info.value.errors()
        # Check that error is about placeholders
        assert any(
            error["loc"] == ("content",) and "placeholder" in str(error).lower()
            for error in errors
        )

    def test_create_template_whitespace_only_placeholder_fails(self):
        """Test that placeholders with only whitespace are rejected."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "Test {{   }} content",
        }
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("content",)
            and "empty" in str(error).lower()
            for error in errors
        )

    def test_create_template_multiple_placeholders_one_empty_fails(self):
        """Test that one empty placeholder among valid ones fails."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "{{valid}} and {{}} and {{another}}",
        }
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("content",)
            and "empty" in str(error).lower()
            for error in errors
        )

    def test_create_template_partial_placeholder_syntax(self):
        """Test that incomplete placeholder syntax doesn't count as valid."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "Test {placeholder} or {{incomplete",
        }
        with pytest.raises(ValidationError) as exc_info:
            TemplateCreate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("content",)
            and "placeholder" in str(error).lower()
            for error in errors
        )

    def test_create_template_special_characters_in_placeholder(self):
        """Test that placeholders can contain special characters."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "{{topic_name}} and {{year-2024}} and {{action/verb}}",
        }
        template = TemplateCreate(**data)
        expected = "{{topic_name}} and {{year-2024}} and {{action/verb}}"
        assert template.content == expected


class TestTemplateUpdateSchema:
    """Tests for TemplateUpdate schema validation."""

    def test_update_template_all_fields_optional(self):
        """Test that all fields are optional for updates."""
        # Empty update is valid
        template = TemplateUpdate()
        assert template.type is None
        assert template.name is None
        assert template.content is None

    def test_update_template_partial_type_only(self):
        """Test updating only type field."""
        data = {"type": "description"}
        template = TemplateUpdate(**data)

        assert template.type == "description"
        assert template.name is None
        assert template.content is None

    def test_update_template_partial_name_only(self):
        """Test updating only name field."""
        data = {"name": "Updated Name"}
        template = TemplateUpdate(**data)

        assert template.type is None
        assert template.name == "Updated Name"
        assert template.content is None

    def test_update_template_partial_content_only(self):
        """Test updating only content field."""
        data = {"content": "{{updated}} content"}
        template = TemplateUpdate(**data)

        assert template.type is None
        assert template.name is None
        assert template.content == "{{updated}} content"

    def test_update_template_name_trim_whitespace(self):
        """Test that whitespace is trimmed when updating name."""
        data = {"name": "  Updated  "}
        template = TemplateUpdate(**data)

        assert template.name == "Updated"

    def test_update_template_content_trim_whitespace(self):
        """Test that whitespace is trimmed when updating content."""
        data = {"content": "  {{test}} updated  "}
        template = TemplateUpdate(**data)

        assert template.content == "{{test}} updated"

    def test_update_template_name_empty_after_trim_fails(self):
        """Test that empty name after trim is rejected."""
        data = {"name": "   "}

        with pytest.raises(ValidationError) as exc_info:
            TemplateUpdate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("name",)
            and ("empty" in str(error).lower() or "whitespace" in str(error).lower())
            for error in errors
        )

    def test_update_template_content_empty_after_trim_fails(self):
        """Test that empty content after trim is rejected."""
        data = {"content": "   "}

        with pytest.raises(ValidationError) as exc_info:
            TemplateUpdate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("content",)
            and ("empty" in str(error).lower() or "whitespace" in str(error).lower())
            for error in errors
        )

    def test_update_template_content_placeholder_validation(self):
        """Test that content placeholder validation runs on update."""
        data = {"content": "No placeholders"}

        with pytest.raises(ValidationError) as exc_info:
            TemplateUpdate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("content",)
            and "placeholder" in str(error).lower()
            for error in errors
        )

    def test_update_template_content_empty_placeholder_fails(self):
        """Test that empty placeholders are rejected on update."""
        data = {"content": "{{valid}} and {{}}"}

        with pytest.raises(ValidationError) as exc_info:
            TemplateUpdate(**data)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("content",)
            and "empty" in str(error).lower()
            for error in errors
        )

    def test_update_template_content_none_skips_validation(self):
        """Test that None content doesn't trigger placeholder validation."""
        data = {"name": "Updated Name"}
        template = TemplateUpdate(**data)

        # Should succeed without content validation
        assert template.content is None

    def test_update_template_multiple_fields(self):
        """Test updating multiple fields at once."""
        data = {
            "type": "description",
            "name": "New Name",
            "content": "{{new}} {{content}}",
        }
        template = TemplateUpdate(**data)

        assert template.type == "description"
        assert template.name == "New Name"
        assert template.content == "{{new}} {{content}}"

    def test_update_template_field_length_limits(self):
        """Test that field length limits are enforced on update."""
        # Type too long
        with pytest.raises(ValidationError):
            TemplateUpdate(type="x" * 51)

        # Name too long
        with pytest.raises(ValidationError):
            TemplateUpdate(name="x" * 101)

        # Content too long
        with pytest.raises(ValidationError):
            TemplateUpdate(content="x" * 257)


class TestTemplateResponseSchema:
    """Tests for TemplateResponse schema."""

    def test_template_response_full(self):
        """Test template response with all fields."""
        from datetime import UTC, datetime

        now = datetime.now(UTC)
        data = {
            "id": 1,
            "type": "title",
            "name": "Test Template",
            "content": "{{topic}} in {{year}}",
            "created_at": now,
            "updated_at": now,
        }
        template = TemplateResponse(**data)

        assert template.id == 1
        assert template.type == "title"
        assert template.name == "Test Template"
        assert template.content == "{{topic}} in {{year}}"
        assert template.created_at == now
        assert template.updated_at == now

    def test_template_response_from_orm(self):
        """Test that TemplateResponse can be created from ORM model."""
        from datetime import UTC, datetime

        # Simulate ORM model with attributes
        class MockTemplate:
            id = 1
            type = "title"
            name = "ORM Template"
            content = "{{test}}"
            created_at = datetime.now(UTC)
            updated_at = datetime.now(UTC)

        mock_template = MockTemplate()
        template = TemplateResponse.model_validate(mock_template)

        assert template.id == 1
        assert template.type == "title"
        assert template.name == "ORM Template"
        assert template.content == "{{test}}"
        assert template.created_at == mock_template.created_at
        assert template.updated_at == mock_template.updated_at


class TestTemplateSchemaEdgeCases:
    """Edge case tests for template schemas."""

    def test_template_type_exactly_50_chars(self):
        """Test that type with exactly 50 chars is accepted."""
        data = {
            "type": "x" * 50,
            "name": "Test",
            "content": "{{test}}",
        }
        template = TemplateCreate(**data)
        assert len(template.type) == 50

    def test_template_name_exactly_100_chars(self):
        """Test that name with exactly 100 chars is accepted."""
        data = {
            "type": "title",
            "name": "x" * 100,
            "content": "{{test}}",
        }
        template = TemplateCreate(**data)
        assert len(template.name) == 100

    def test_template_content_exactly_256_chars(self):
        """Test that content with exactly 256 chars is accepted."""
        # Create content that's exactly 256 chars including placeholder
        content = "x" * 248 + "{{test}}"  # 248 + 8 = 256
        data = {
            "type": "title",
            "name": "Test",
            "content": content,
        }
        template = TemplateCreate(**data)
        assert len(template.content) == 256

    def test_template_content_with_unicode(self):
        """Test that content can contain unicode characters."""
        data = {
            "type": "title",
            "name": "Unicode Test",
            "content": "{{topic}} 在 {{year}} 年 🚀",
        }
        template = TemplateCreate(**data)
        assert "🚀" in template.content
        assert "年" in template.content

    def test_template_content_with_newlines(self):
        """Test that content can contain newlines."""
        data = {
            "type": "description",
            "name": "Multiline",
            "content": "{{topic}} is great\n\nLearn more about {{topic}}",
        }
        template = TemplateCreate(**data)
        assert "\n\n" in template.content

    def test_template_name_with_special_characters(self):
        """Test that name can contain special characters."""
        data = {
            "type": "title",
            "name": "Test-Template_123 (v2.0)",
            "content": "{{test}}",
        }
        template = TemplateCreate(**data)
        assert template.name == "Test-Template_123 (v2.0)"

    def test_template_multiple_same_placeholder(self):
        """Test that content can have the same placeholder multiple times."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "{{topic}} - Learn {{topic}} in {{year}} - {{topic}} Guide",
        }
        template = TemplateCreate(**data)
        assert template.content.count("{{topic}}") == 3

    def test_template_nested_braces_not_placeholders(self):
        """Test that nested braces are handled correctly."""
        data = {
            "type": "title",
            "name": "Test",
            "content": "{{topic}} with {nested} {{year}}",
        }
        template = TemplateCreate(**data)
        # Should pass because {{topic}} and {{year}} are valid
        assert template.content == "{{topic}} with {nested} {{year}}"
