import type {
  DocumentTemplate,
  TemplatePlaceholder,
} from "$lib/types/document";
import type { CompanyBranding } from "$lib/types/branding";
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

  // No post-processing - return HTML as-is

  return html;
}

/**
 * Injects company branding into rendered HTML
 * Note: All branding (logo, stamp, colors) is handled by the template itself via placeholders
 * This function returns the HTML unchanged to respect template design
 */
export function injectBrandingIntoHtml(
  html: string,
  branding: CompanyBranding,
): string {
  // Return HTML unchanged - template handles all styling and branding via placeholders
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
 * Generates preview data for template placeholders and system variables
 */
export function generatePreviewData(
  template: DocumentTemplate,
): Record<string, any> {
  const previewData: Record<string, any> = {};

  // Add system variables commonly used in templates
  const systemVariables = {
    // Date/Time variables
    currentDate: new Date().toLocaleDateString(),
    currentTime: new Date().toLocaleTimeString(),
    currentDateTime: new Date().toLocaleString(),

    // Document/Order variables
    orderNumber: "INV-2024-001",
    documentId: "DOC-123456",
    documentType: "Invoice",
    subtotal: 1275.0,
    totalAmount: 1466.25,
    discountAmount: 0.0,
    currency: "SAR",
    itemCount: 3,
    orderDate: new Date().toLocaleDateString(),
    dueDate: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toLocaleDateString(),
    paymentStatus: "Pending",
    orderStatus: "Processing",

    // Company variables
    companyName: "Your Company Name",
    companyEmail: "info@yourcompany.com",
    companyPhone: "+966 11 123 4567",
    companyAddress: "123 Business St, Riyadh, Saudi Arabia",
    companyLogo:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvbXBhbnkgTG9nbzwvdGV4dD48L3N2Zz4=",
    companyStamp:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNvbXBhbnkgU3RhbXA8L3RleHQ+PC9zdmc+",
    taxRate: 15,
    paymentTerms: "Net 30 days",
    taxAmount: 150.0,
    total: 1150.0,

    // Client variables
    clientName: "Ahmed Al-Rashid",
    clientEmail: "ahmed.alrashid@clientcompany.com",
    clientPhone: "+966 50 123 4567",
    clientAddress:
      "456 King Fahd Road, Al Olaya District, Riyadh 12345, Saudi Arabia",
    clientVatNumber: "123456789012345",
    clientCompanyName: "Client Company Ltd",

    // Order items for {{#each}} loops
    items: [
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
    ],

    // ZATCA QR Code (placeholder)
    zatcaQRCode:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldBVENBIFE8L3RleHQ+PC9zdmc+",
  };

  // Add all system variables
  Object.assign(previewData, systemVariables);

  // Add template-specific placeholders
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
