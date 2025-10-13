import type {
  DocumentTemplate,
  TemplatePlaceholder,
} from "$lib/types/document";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTemplate(template: DocumentTemplate): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!template.name || template.name.trim().length === 0) {
    errors.push("Template name is required");
  }

  if (!template.htmlContent || template.htmlContent.trim().length === 0) {
    errors.push("HTML content is required");
  }

  if (
    !template.type ||
    !["invoice", "legal", "business", "custom"].includes(template.type)
  ) {
    errors.push("Invalid template type");
  }

  // HTML validation
  if (template.htmlContent) {
    const htmlValidation = validateHtmlContent(template.htmlContent);
    errors.push(...htmlValidation.errors);
    warnings.push(...htmlValidation.warnings);
  }

  // Placeholder validation
  if (template.placeholders && template.placeholders.length > 0) {
    const placeholderValidation = validatePlaceholders(template);
    errors.push(...placeholderValidation.errors);
    warnings.push(...placeholderValidation.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateHtmlContent(htmlContent: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for basic HTML structure
  if (!htmlContent.includes("<") || !htmlContent.includes(">")) {
    warnings.push("HTML content does not appear to contain HTML tags");
  }

  // Check for unclosed tags (basic check)
  const openTags = htmlContent.match(/<[^/][^>]*>/g) || [];
  const closeTags = htmlContent.match(/<\/[^>]+>/g) || [];

  if (openTags.length !== closeTags.length) {
    warnings.push("HTML may have unclosed tags");
  }

  // Check for dangerous content
  const dangerousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  dangerousPatterns.forEach((pattern) => {
    if (pattern.test(htmlContent)) {
      errors.push(
        "HTML contains potentially dangerous content (scripts or event handlers)",
      );
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

function validatePlaceholders(template: DocumentTemplate): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const htmlContent = template.htmlContent;
  const placeholders = template.placeholders;

  // Check if all placeholders are used in HTML
  placeholders.forEach((placeholder) => {
    const placeholderRegex = new RegExp(`{{${placeholder.key}}}`, "g");
    if (!placeholderRegex.test(htmlContent)) {
      warnings.push(
        `Placeholder "${placeholder.key}" is defined but not used in HTML`,
      );
    }
  });

  // Check for undefined placeholders in HTML
  const usedPlaceholders = htmlContent.match(/\{\{([^}]+)\}\}/g) || [];
  const definedKeys = new Set(placeholders.map((p) => p.key));

  usedPlaceholders.forEach((match) => {
    const key = match.slice(2, -2); // Remove {{ and }}
    if (!definedKeys.has(key)) {
      errors.push(`Placeholder "${key}" is used in HTML but not defined`);
    }
  });

  // Validate placeholder definitions
  placeholders.forEach((placeholder, index) => {
    if (!placeholder.key || placeholder.key.trim().length === 0) {
      errors.push(`Placeholder at index ${index} has no key`);
    }

    if (!placeholder.label || placeholder.label.trim().length === 0) {
      errors.push(`Placeholder "${placeholder.key}" has no label`);
    }

    if (
      !["text", "number", "date", "currency", "boolean"].includes(
        placeholder.type,
      )
    ) {
      errors.push(`Placeholder "${placeholder.key}" has invalid type`);
    }

    // Check for duplicate keys
    const duplicateKeys = placeholders.filter((p) => p.key === placeholder.key);
    if (duplicateKeys.length > 1) {
      errors.push(`Duplicate placeholder key: "${placeholder.key}"`);
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

export function generatePreviewData(
  template: DocumentTemplate,
): Record<string, any> {
  const previewData: Record<string, any> = {};

  template.placeholders.forEach((placeholder) => {
    previewData[placeholder.key] = getSampleValue(placeholder);
  });

  return previewData;
}

function getSampleValue(placeholder: TemplatePlaceholder): any {
  switch (placeholder.type) {
    case "text":
      if (placeholder.key.toLowerCase().includes("name")) {
        return placeholder.key.toLowerCase().includes("company")
          ? "Acme Corporation"
          : "John Doe";
      }
      if (placeholder.key.toLowerCase().includes("email")) {
        return "john.doe@example.com";
      }
      if (placeholder.key.toLowerCase().includes("address")) {
        return "123 Main Street, City, State 12345";
      }
      return "Sample Text Value";

    case "number":
      return 42;

    case "currency":
      return "$1,250.00";

    case "date":
      return new Date().toLocaleDateString();

    case "boolean":
      return true;

    default:
      return "Sample Value";
  }
}

export function renderTemplate(
  template: DocumentTemplate,
  data: Record<string, any>,
): string {
  let html = template.htmlContent;

  template.placeholders.forEach((placeholder) => {
    const value = data[placeholder.key] || getSampleValue(placeholder);
    const placeholderRegex = new RegExp(`{{${placeholder.key}}}`, "g");
    html = html.replace(placeholderRegex, String(value));
  });

  return html;
}
