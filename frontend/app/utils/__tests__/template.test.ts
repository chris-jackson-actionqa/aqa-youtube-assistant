import {
  normalizeTemplateFromApi,
  calculateTemplateCounts,
  filterTemplatesByType,
  formatDate,
} from "../template";
import { Template, NormalizedTemplate } from "@/app/types/template";

describe("normalizeTemplateFromApi", () => {
  it("normalizes a title template from API format", () => {
    const apiTemplate: Template = {
      id: 1,
      name: "Title Template",
      type: "title",
      content: "Test content",
      workspace_id: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const result = normalizeTemplateFromApi(apiTemplate);

    expect(result).toEqual({
      id: 1,
      name: "Title Template",
      type: "title",
      content: "Test content",
      workspace_id: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    expect(result.type).toBe("title");
  });

  it("normalizes a description template from API format", () => {
    const apiTemplate: Template = {
      id: 2,
      name: "Description Template",
      type: "description",
      content: "Test content",
      workspace_id: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const result = normalizeTemplateFromApi(apiTemplate);

    expect(result).toEqual({
      id: 2,
      name: "Description Template",
      type: "description",
      content: "Test content",
      workspace_id: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    expect(result.type).toBe("description");
  });

  it("normalizes Title (capitalized) to title", () => {
    const apiTemplate: Template = {
      id: 3,
      name: "Test",
      type: "Title" as unknown as Template["type"],
      content: "Content",
      workspace_id: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const result = normalizeTemplateFromApi(apiTemplate);

    expect(result.type).toBe("title");
  });

  it("normalizes Description (capitalized) to description", () => {
    const apiTemplate: Template = {
      id: 4,
      name: "Test",
      type: "Description" as unknown as Template["type"],
      content: "Content",
      workspace_id: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const result = normalizeTemplateFromApi(apiTemplate);

    expect(result.type).toBe("description");
  });
});

describe("calculateTemplateCounts", () => {
  it("returns zero counts for empty array", () => {
    const result = calculateTemplateCounts([]);

    expect(result).toEqual({
      all: 0,
      title: 0,
      description: 0,
    });
  });

  it("counts single title template", () => {
    const templates: NormalizedTemplate[] = [
      {
        id: 1,
        name: "Title Template",
        type: "title",
        content: "Content",
        workspace_id: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    const result = calculateTemplateCounts(templates);

    expect(result).toEqual({
      all: 1,
      title: 1,
      description: 0,
    });
  });

  it("counts single description template", () => {
    const templates: NormalizedTemplate[] = [
      {
        id: 2,
        name: "Description Template",
        type: "description",
        content: "Content",
        workspace_id: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    const result = calculateTemplateCounts(templates);

    expect(result).toEqual({
      all: 1,
      title: 0,
      description: 1,
    });
  });

  it("counts multiple templates of mixed types", () => {
    const templates: NormalizedTemplate[] = [
      {
        id: 1,
        name: "Title 1",
        type: "title",
        content: "Content",
        workspace_id: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 2,
        name: "Description 1",
        type: "description",
        content: "Content",
        workspace_id: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 3,
        name: "Title 2",
        type: "title",
        content: "Content",
        workspace_id: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 4,
        name: "Description 2",
        type: "description",
        content: "Content",
        workspace_id: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 5,
        name: "Description 3",
        type: "description",
        content: "Content",
        workspace_id: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    const result = calculateTemplateCounts(templates);

    expect(result).toEqual({
      all: 5,
      title: 2,
      description: 3,
    });
  });
});

describe("filterTemplatesByType", () => {
  const mockTemplates: NormalizedTemplate[] = [
    {
      id: 1,
      name: "Title Template",
      type: "title",
      content: "Title content",
      workspace_id: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Description Template",
      type: "description",
      content: "Description content",
      workspace_id: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: 3,
      name: "Another Title",
      type: "title",
      content: "More title content",
      workspace_id: 1,
      created_at: "2026-01-02T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    },
  ];

  it('returns all templates when type is "all"', () => {
    const result = filterTemplatesByType(mockTemplates, "all");

    expect(result).toHaveLength(3);
    expect(result).toEqual(mockTemplates);
  });

  it("returns only title templates when type is title", () => {
    const result = filterTemplatesByType(mockTemplates, "title");

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("title");
    expect(result[1].type).toBe("title");
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(3);
  });

  it("returns only description templates when type is description", () => {
    const result = filterTemplatesByType(mockTemplates, "description");

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("description");
    expect(result[0].id).toBe(2);
  });

  it("returns empty array when no templates match type", () => {
    const titleOnlyTemplates: NormalizedTemplate[] = [
      {
        id: 1,
        name: "Title",
        type: "title",
        content: "Content",
        workspace_id: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    const result = filterTemplatesByType(titleOnlyTemplates, "description");

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("returns empty array when filtering empty array", () => {
    const result = filterTemplatesByType([], "title");

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });
});

describe("formatDate", () => {
  it("formats ISO date string to readable format", () => {
    const result = formatDate("2026-01-03T12:34:56Z");

    expect(result).toBe("January 3, 2026");
  });

  it("formats date at start of year", () => {
    const result = formatDate("2026-01-01T12:00:00Z");

    expect(result).toBe("January 1, 2026");
  });

  it("formats date at end of year", () => {
    const result = formatDate("2025-12-31T12:00:00Z");

    expect(result).toBe("December 31, 2025");
  });

  it("formats date with different month", () => {
    const result = formatDate("2026-06-15T14:22:33Z");

    expect(result).toBe("June 15, 2026");
  });

  it("handles date without time component", () => {
    const result = formatDate("2026-03-20T12:00:00Z");

    expect(result).toBe("March 20, 2026");
  });
});
