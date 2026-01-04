/**
 * Test helpers for Templates page tests
 * Contains reusable helper functions for common test operations
 */

import { screen, waitFor, fireEvent } from "@testing-library/react";

/**
 * Wait for templates to finish loading
 */
export async function waitForTemplatesLoad() {
  await waitFor(() => {
    expect(screen.getByText("Standard Title Template")).toBeInTheDocument();
  });
}

/**
 * Click a filter button by its label pattern
 */
export function clickFilterButton(pattern: RegExp | string) {
  const button = screen.getByRole("button", { name: pattern });
  fireEvent.click(button);
  return button;
}

/**
 * Check if a template is visible in the list
 */
export function expectTemplateVisible(templateName: string) {
  expect(screen.getByText(templateName)).toBeInTheDocument();
}

/**
 * Check if a template is NOT visible in the list
 */
export function expectTemplateNotVisible(templateName: string) {
  expect(screen.queryByText(templateName)).not.toBeInTheDocument();
}

/**
 * Wait for a specific element to appear
 */
export async function waitForElement(text: string | RegExp) {
  await waitFor(() => {
    expect(screen.getByText(text)).toBeInTheDocument();
  });
}
