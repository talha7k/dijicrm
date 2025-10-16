import type {
  DocumentTemplate,
  TemplatePlaceholder,
} from "$lib/types/document";
import type { CompanyBranding } from "$lib/types/branding";
import Handlebars from "handlebars";

/**
 * Fetches an image from a URL and converts it to a base64 data URL
 */
export async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch image from ${url}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      console.warn(
        `URL does not point to an image: ${url}, content-type: ${contentType}`,
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn(`Error fetching image from ${url}:`, error);
    return null;
  }
}

/**
 * Renders a document template by replacing placeholders with actual data
 */
export function renderTemplate(
  template: DocumentTemplate,
  data: Record<string, any>,
): string {
  try {
    // Register helper functions for Handlebars
    Handlebars.registerHelper("formatCurrency", formatCurrency);
    Handlebars.registerHelper("formatDate", formatDate);
    Handlebars.registerHelper("multiply", (a: number, b: number) => a * b);

    // Compile and render the template with Handlebars
    const compiledTemplate = Handlebars.compile(template.htmlContent);
    return compiledTemplate(data);
  } catch (error) {
    console.error("Error rendering template with Handlebars:", error);
    // Fallback to simple replacement if Handlebars fails
    return fallbackRenderTemplate(template, data);
  }
}

/**
 * Fallback template rendering using simple regex replacement
 */
function fallbackRenderTemplate(
  template: DocumentTemplate,
  data: Record<string, any>,
): string {
  let html = template.htmlContent;

  // Replace all placeholders in the format {{placeholderKey}}
  for (const placeholder of template.placeholders) {
    if (!placeholder || typeof placeholder.key !== "string") {
      console.error(
        `Invalid placeholder found in template ${template.id}:`,
        placeholder,
      );
      continue;
    }
    const placeholderRegex = new RegExp(`{{${placeholder.key}}}`, "g");
    const value = getPlaceholderValue(placeholder, data);
    html = html.replace(placeholderRegex, value);
  }

  return html;
}

/**
 * Injects company branding into rendered HTML
 */
export function injectBrandingIntoHtml(
  html: string,
  branding: CompanyBranding,
): string {
  let brandedHtml = html;

  // Only inject logo if it's not already in the template
  if (branding.logoUrl && !brandedHtml.includes("{{companyLogo}}")) {
    // Add logo to the top of the document
    const logoHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${branding.logoUrl}" alt="Company Logo" style="max-width: 200px; max-height: 100px;" />
      </div>
    `;

    // Insert logo after the opening body tag or at the beginning
    if (brandedHtml.includes("<body>")) {
      brandedHtml = brandedHtml.replace(/(<body[^>]*>)/, `$1${logoHtml}`);
    } else {
      brandedHtml = logoHtml + brandedHtml;
    }
  }

  // Inject stamp image if available and not already in template
  if (branding.stampImageUrl && !brandedHtml.includes("{{companyStamp}}")) {
    const stampPosition = branding.stampPosition || "bottom-right";

    // Position styles based on stamp position
    let positionStyles = "";
    switch (stampPosition) {
      case "top-left":
        positionStyles = "position: absolute; top: 20px; left: 20px;";
        break;
      case "top-right":
        positionStyles = "position: absolute; top: 20px; right: 20px;";
        break;
      case "bottom-left":
        positionStyles = "position: absolute; bottom: 20px; left: 20px;";
        break;
      case "bottom-right":
      default:
        positionStyles = "position: absolute; bottom: 20px; right: 20px;";
        break;
    }

    const stampHtml = `
      <img src="${branding.stampImageUrl}" alt="Company Stamp" style="${positionStyles} max-width: 150px; max-height: 150px; opacity: 0.8; transform: rotate(-15deg); pointer-events: none;" />
    `;

    // Wrap content in relative positioned container and add stamp
    brandedHtml = `
      <div style="position: relative; min-height: 100vh;">
        ${brandedHtml}
        ${stampHtml}
      </div>
    `;
  }

  // Apply brand colors if specified
  if (branding.primaryColor || branding.secondaryColor) {
    // Add CSS custom properties for brand colors
    const colorVars = `
      <style>
        :root {
          --brand-primary: ${branding.primaryColor || "#007bff"};
          --brand-secondary: ${branding.secondaryColor || "#6c757d"};
        }
      </style>
    `;

    // Insert color variables in head or at the beginning
    if (brandedHtml.includes("<head>")) {
      brandedHtml = brandedHtml.replace(/(<head[^>]*>)/, `$1${colorVars}`);
    } else {
      brandedHtml = colorVars + brandedHtml;
    }
  }

  return brandedHtml;
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
        // For image fields, allow empty/placeholder values
        if (placeholder.type !== "image") {
          missingFields.push(placeholder.label);
        }
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
