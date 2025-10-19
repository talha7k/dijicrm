import type { DocumentTemplate } from "$lib/types/document";
import { SYSTEM_VARIABLE_CATALOG } from "$lib/types/templateVariable";
import Handlebars from "handlebars";

/**
 * Adds placeholder SVG images for empty image data
 */
function addPlaceholderImages(data: Record<string, any>): Record<string, any> {
  const enhancedData = { ...data };

  // Company logo placeholder
  if (!enhancedData.companyLogo || enhancedData.companyLogo.trim() === "") {
    enhancedData.companyLogo =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiPkNvbXBhbnkgTG9nbzwvdGV4dD4KPC9zdmc+";
  }

  // Company stamp placeholder
  if (!enhancedData.companyStamp || enhancedData.companyStamp.trim() === "") {
    enhancedData.companyStamp =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiPkNvbXBhbnkgU3RhbXA8L3RleHQ+Cjwvc3ZnPg==";
  }

  // ZATCA QR code placeholder
  if (!enhancedData.zatcaQRCode || enhancedData.zatcaQRCode.trim() === "") {
    enhancedData.zatcaQRCode =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjZDVkN2RiIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8dGV4dCB4PSI1MCIgeT0iNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5YTNhZSI+UVI8L3RleHQ+Cjwvc3ZnPg==";
  }

  return enhancedData;
}

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
    // Prepare data with placeholder images for empty values
    const enhancedData = addPlaceholderImages(data);

    // Register helper functions for Handlebars
    Handlebars.registerHelper("formatCurrency", formatCurrency);
    Handlebars.registerHelper("formatDate", formatDate);
    Handlebars.registerHelper("multiply", (a: number, b: number) => a * b);

    // Compile and render the template with Handlebars
    const compiledTemplate = Handlebars.compile(template.htmlContent);
    const renderedHtml = compiledTemplate(enhancedData);

    // Return rendered HTML as-is without any post-processing
    // Template should handle all conditional logic itself
    return renderedHtml;
  } catch (error) {
    console.error("Error rendering template with Handlebars:", error);
    throw new Error(
      `Template rendering failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Generates preview data using system variables
 */
export function generatePreviewData(): Record<string, any> {
  const previewData: Record<string, any> = {};

  // Add all system variables with sample values
  for (const variable of SYSTEM_VARIABLE_CATALOG) {
    previewData[variable.key] = variable.exampleValue;
  }

  // Add sample order items for {{#each}} loops
  previewData.items = [
    {
      description: "Professional Web Development Services",
      quantity: 1,
      rate: 850.0,
    },
    {
      description: "UI/UX Design Consultation",
      quantity: 2,
      rate: 125.0,
    },
    {
      description: "Project Management & Quality Assurance",
      quantity: 1,
      rate: 175.0,
    },
  ];

  return previewData;
}

/**
 * Formats a number as currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
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
 * Validates that all required data keys are present in the data object
 */
export function validateTemplateData(
  data: Record<string, any>,
  requiredKeys: string[] = [],
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const key of requiredKeys) {
    if (
      !(key in data) ||
      data[key] === undefined ||
      data[key] === null ||
      data[key] === ""
    ) {
      missingFields.push(key);
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
