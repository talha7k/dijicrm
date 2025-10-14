import type {
  DocumentTemplate,
  TemplatePlaceholder,
} from "$lib/types/document";
import { processTemplateSyntax } from "./template-processing";
import { brandingService } from "$lib/services/brandingService";
import { generateZATCAQRCode } from "./zatca";
import { userProfile } from "$lib/stores/user";
import { get } from "svelte/store";
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

export async function generatePreviewData(
  template: DocumentTemplate,
): Promise<Record<string, any>> {
  const previewData: Record<string, any> = {};

  // Get current user to load company branding
  const userStore = get(userProfile);
  let branding = null;

  if (userStore.data?.role === "company") {
    try {
      const brandingResult = await brandingService.loadBranding(
        userStore.data.uid,
      );
      if (brandingResult.success && brandingResult.branding) {
        branding = brandingResult.branding;
      }
    } catch (error) {
      console.warn("Could not load branding for preview:", error);
    }
  }

  // Generate sample data based on template type
  if (template.type === "invoice") {
    previewData.items = [
      { description: "Web Development Services", quantity: 40, rate: 125.0 },
      { description: "UI/UX Design Consultation", quantity: 20, rate: 150.0 },
      { description: "Project Management", quantity: 10, rate: 100.0 },
    ];
    previewData.subtotal = 8750.0;
    previewData.taxRate = 15;
    previewData.taxAmount = 1312.5;
    previewData.total = 10062.5;

    // Generate ZATCA QR code if branding has required data
    if (branding?.companyName && branding?.vatNumber) {
      try {
        const zatcaData = {
          sellerName: branding.companyName,
          vatNumber: branding.vatNumber,
          invoiceDate: new Date().toISOString(),
          totalAmount: previewData.total,
          vatAmount: previewData.taxAmount,
        };
        const qrCodeData = generateZATCAQRCode(zatcaData);
        previewData.zatcaQRCode = await generateQRCodeImage(qrCodeData);
      } catch (error) {
        console.warn("Could not generate ZATCA QR code:", error);
        previewData.zatcaQRCode = getSampleValue({
          key: "zatcaQRCode",
          type: "image",
          label: "ZATCA QR Code",
          required: false,
        });
      }
    }
  }

  // Generate individual placeholder values
  for (const placeholder of template.placeholders) {
    if (!previewData[placeholder.key]) {
      previewData[placeholder.key] = await getSampleValue(
        placeholder,
        branding,
      );
    }
  }

  return previewData;
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
