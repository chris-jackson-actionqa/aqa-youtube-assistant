import {
  normalizeTemplateType,
  NormalizedTemplate,
  Template,
  TemplateType,
} from "@/app/types/template";

/**
 * Normalize a template from the API response format
 * Converts the template type to the normalized format
 */
export function normalizeTemplateFromApi(
  template: Template
): NormalizedTemplate {
  return {
    ...template,
    type: normalizeTemplateType(template.type),
  };
}

/**
 * Calculate count of templates by type
 * Returns counts for all templates, title templates, and description templates
 */
export function calculateTemplateCounts(templates: NormalizedTemplate[]) {
  return templates.reduce(
    (counts, template) => {
      counts.all += 1;
      if (template.type === "title") counts.title += 1;
      if (template.type === "description") counts.description += 1;
      return counts;
    },
    { all: 0, title: 0, description: 0 }
  );
}

/**
 * Filter templates by type
 * If selectedType is "all", returns all templates
 * Otherwise returns only templates matching the selected type
 */
export function filterTemplatesByType(
  templates: NormalizedTemplate[],
  selectedType: TemplateType | "all"
) {
  if (selectedType === "all") return templates;
  return templates.filter((template) => template.type === selectedType);
}

/**
 * Format ISO date string to readable format
 * Returns date in format: "Month Day, Year" (e.g., "January 3, 2026")
 * Dates are formatted in UTC to avoid timezone-dependent shifts
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
