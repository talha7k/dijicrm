import type {
  DocumentTemplate,
  TemplatePlaceholder,
} from "$lib/types/document";
import { processTemplateSyntax } from "./template-processing";
import { brandingService } from "$lib/services/brandingService";
import { generateZATCAQRCode } from "./zatca";
import { userProfile } from "$lib/stores/user";
import { companyContext } from "$lib/stores/companyContext";
import { get } from "svelte/store";
import { generatePreviewData } from "./template-rendering";
import QRCode from "qrcode";

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
    !["order", "legal", "business", "custom"].includes(template.type)
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

/**
 * Extract used placeholders from HTML content with context awareness
 * Handles Handlebars syntax like {{#each}} loops properly
 */
function extractUsedPlaceholders(htmlContent: string): string[] {
  const usedPlaceholders: string[] = [];
  const loopStack: string[] = []; // Track nested loops

  // Split content by Handlebars patterns to process contextually
  const parts = htmlContent.split(/(\{\{[#/][^}]+\}\})/);

  for (const part of parts) {
    if (part.startsWith("{{#each ")) {
      // Extract array name from {{#each items}}
      const match = part.match(/\{\{#each\s+(\w+)\}\}/);
      if (match) {
        loopStack.push(match[1]); // Push array name to stack
      }
    } else if (part.startsWith("{{/each}}")) {
      loopStack.pop(); // Pop from stack when exiting loop
    } else if (
      part.match(/\{\{([^}]+)\}\}/) &&
      !part.startsWith("{{#") &&
      !part.startsWith("{{/")
    ) {
      // This is a {{...}} pattern that's not a control structure
      const content = part.slice(2, -2).trim();

      // Skip helper function calls (contain spaces and are not simple variables)
      if (content.includes(" ") && !content.match(/^\w+$/)) {
        continue; // Skip {{formatCurrency value}}, {{multiply a b}}, etc.
      }

      // If we're inside a loop, this might be a loop item property, not a top-level placeholder
      if (loopStack.length > 0) {
        // For now, we'll be conservative and only validate obvious top-level placeholders
        // Loop item properties like {{description}}, {{quantity}} will be skipped
        // This is a heuristic - we could enhance this to be more precise
        continue;
      }

      // This is a top-level placeholder
      if (!usedPlaceholders.includes(content)) {
        usedPlaceholders.push(content);
      }
    }
  }

  return usedPlaceholders;
}

function validatePlaceholders(template: DocumentTemplate): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const htmlContent = template.htmlContent;
  const placeholders = template.placeholders;

  // Check for undefined placeholders in HTML with context awareness
  const topLevelPlaceholders = extractUsedPlaceholders(htmlContent);

  const definedKeys = new Set(placeholders.map((p) => p.key));

  topLevelPlaceholders.forEach((key: string) => {
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
      !["text", "number", "date", "currency", "boolean", "image"].includes(
        placeholder.type,
      )
    ) {
      errors.push(`Placeholder "${placeholder.key}" has invalid type`);
    }

    // Special validation for image placeholders
    if (placeholder.type === "image") {
      const key = placeholder.key.toLowerCase();
      if (key.includes("qrcode") || key.includes("qr")) {
        // QR code placeholders should be marked as not required since they're auto-generated
        if (placeholder.required) {
          warnings.push(
            `QR code placeholder "${placeholder.key}" should not be required as it's auto-generated`,
          );
        }
      }
    }

    // Check for duplicate keys
    const duplicateKeys = placeholders.filter((p) => p.key === placeholder.key);
    if (duplicateKeys.length > 1) {
      errors.push(`Duplicate placeholder key: "${placeholder.key}"`);
    }
  });

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Generate a QR code image from text data
 * Uses the qrcode library to generate a data URL
 */
async function generateQRCodeImage(data: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 100,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.warn("QR code generation failed:", error);
    // Fallback to a simple placeholder
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  }
}

async function getSampleValue(
  placeholder: TemplatePlaceholder,
  branding?: any,
): Promise<any> {
  const key = placeholder.key.toLowerCase();

  switch (placeholder.type) {
    case "text":
      if (key.includes("companyname") || key === "companyname") {
        return branding?.companyName || "Acme Corporation";
      }
      if (key.includes("clientname") || key === "clientname") {
        return "TechStart Solutions LLC";
      }
      if (key.includes("clientemail") || key === "clientemail") {
        return "billing@techstart.com";
      }
      if (key.includes("address")) {
        return "123 Innovation Drive, Tech City, TC 12345";
      }
      if (key.includes("invoicenumber") || key === "invoicenumber") {
        return "INV-2024-001";
      }
      if (key.includes("paymentterms") || key === "paymentterms") {
        return "Net 30 days";
      }
      if (key.includes("name")) {
        return key.includes("company")
          ? branding?.companyName || "Acme Corporation"
          : "John Doe";
      }
      if (key.includes("email")) {
        return "john.doe@example.com";
      }
      return "Sample Text Value";

    case "number":
      if (key.includes("taxrate") || key === "taxrate") {
        return 15;
      }
      return 42;

    case "currency":
      return "$1,250.00";

    case "date":
      if (key.includes("duedate") || key === "duedate") {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        return dueDate.toLocaleDateString();
      }
      return new Date().toLocaleDateString();

    case "boolean":
      return true;

    case "image":
      if (key.includes("companylogo") || key === "companylogo") {
        return (
          branding?.logoUrl ||
          "data:image/svg+xml;base64," +
            btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
            <rect width="200" height="100" fill="#f3f4f6"/>
            <text x="100" y="35" text-anchor="middle" font-size="16" fill="#6b7280">Company Logo</text>
            <text x="100" y="55" text-anchor="middle" font-size="12" fill="#9ca3af">${branding?.companyName || "Your Company"}</text>
          </svg>
        `)
        );
      }
      if (key.includes("companystamp") || key === "companystamp") {
        return (
          branding?.stampImageUrl ||
          "data:image/svg+xml;base64," +
            btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="70" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/>
            <circle cx="75" cy="75" r="60" fill="none" stroke="#6b7280" stroke-width="1"/>
            <text x="75" y="70" text-anchor="middle" font-size="12" fill="#374151">COMPANY</text>
            <text x="75" y="85" text-anchor="middle" font-size="12" fill="#374151">STAMP</text>
            <text x="75" y="100" text-anchor="middle" font-size="8" fill="#6b7280">${branding?.companyName || "Your Company"}</text>
          </svg>
        `)
        );
      }
      if (key.includes("zatcaqrcode") || key === "zatcaqrcode") {
        // This will be handled separately in generatePreviewData
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      }
      // Return a data URL for a small placeholder image
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    default:
      return "Sample Value";
  }
}

export function renderTemplate(
  template: DocumentTemplate,
  data: Record<string, any>,
): string {
  let html = template.htmlContent;

  // First, handle complex template syntax (Handlebars-like)
  html = processTemplateSyntax(html, data);

  // Then handle simple placeholder replacement
  template.placeholders.forEach((placeholder) => {
    const value = data[placeholder.key] || "Sample Value";
    const placeholderRegex = new RegExp(`{{${placeholder.key}}}`, "g");
    html = html.replace(placeholderRegex, String(value));
  });

  return html;
}
