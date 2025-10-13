import type {
  DocumentTemplate,
  TemplatePlaceholder,
} from "$lib/types/document";

/**
 * Renders a document template by replacing placeholders with actual data
 */
export function renderTemplate(
  template: DocumentTemplate,
  data: Record<string, any>,
): string {
  let html = template.htmlContent;

  // Replace all placeholders in the format {{placeholderKey}}
  for (const placeholder of template.placeholders) {
    const placeholderRegex = new RegExp(`{{${placeholder.key}}}`, "g");
    const value = getPlaceholderValue(placeholder, data);
    html = html.replace(placeholderRegex, value);
  }

  return html;
}

/**
 * Gets the value for a placeholder from the provided data
 */
function getPlaceholderValue(
  placeholder: TemplatePlaceholder,
  data: Record<string, any>,
): string {
  const value = data[placeholder.key];

  if (value === undefined || value === null) {
    // Return default value or empty string
    return placeholder.defaultValue || "";
  }

  // Format the value based on placeholder type
  switch (placeholder.type) {
    case "currency":
      return formatCurrency(value);
    case "date":
      return formatDate(value);
    case "boolean":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}

/**
 * Generates preview data for template placeholders
 */
export function generatePreviewData(
  template: DocumentTemplate,
): Record<string, any> {
  const previewData: Record<string, any> = {};

  for (const placeholder of template.placeholders) {
    previewData[placeholder.key] = getPreviewValue(placeholder);
  }

  return previewData;
}

/**
 * Gets a preview value for a placeholder
 */
function getPreviewValue(placeholder: TemplatePlaceholder): any {
  switch (placeholder.type) {
    case "text":
      return `Sample ${placeholder.label}`;
    case "number":
      return 123.45;
    case "currency":
      return 999.99;
    case "date":
      return new Date().toISOString().split("T")[0];
    case "boolean":
      return true;
    default:
      return `Sample ${placeholder.label}`;
  }
}

/**
 * Formats a number as currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Formats a date string
 */
function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Validates that all required placeholders have values in the data
 */
export function validateTemplateData(
  template: DocumentTemplate,
  data: Record<string, any>,
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const placeholder of template.placeholders) {
    if (placeholder.required) {
      const value = data[placeholder.key];
      if (value === undefined || value === null || value === "") {
        missingFields.push(placeholder.label);
      }
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Extracts all placeholder keys from template HTML
 */
export function extractPlaceholdersFromHtml(html: string): string[] {
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const placeholders: string[] = [];
  let match;

  while ((match = placeholderRegex.exec(html)) !== null) {
    const placeholderKey = match[1];
    if (!placeholders.includes(placeholderKey)) {
      placeholders.push(placeholderKey);
    }
  }

  return placeholders;
}

/**
 * Validates template HTML and returns any issues
 */
export function validateTemplateHtml(
  html: string,
  definedPlaceholders: TemplatePlaceholder[],
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const usedPlaceholders = extractPlaceholdersFromHtml(html);
  const definedKeys = definedPlaceholders.map((p) => p.key);

  // Check for undefined placeholders
  for (const usedPlaceholder of usedPlaceholders) {
    if (!definedKeys.includes(usedPlaceholder)) {
      issues.push(`Undefined placeholder: {{${usedPlaceholder}}}`);
    }
  }

  // Check for unused defined placeholders (warning, not error)
  for (const definedPlaceholder of definedKeys) {
    if (!usedPlaceholders.includes(definedPlaceholder)) {
      issues.push(
        `Unused placeholder: {{${definedPlaceholder}}} (consider removing from definition)`,
      );
    }
  }

  // Basic HTML validation
  if (!html.trim()) {
    issues.push("Template HTML cannot be empty");
  }

  return {
    isValid:
      issues.filter((issue) => !issue.includes("consider removing")).length ===
      0,
    issues,
  };
}
