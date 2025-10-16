/**
 * ZATCA QR Code Generation Utilities
 * Implements TLV (Tag-Length-Value) encoding for Saudi e-invoicing compliance
 */

import QRCode from "qrcode";

export interface ZATCAInvoiceData {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO 8601 timestamp (e.g., 2022-04-25T15:30:00Z)
  totalAmount: number;
  vatAmount: number;
}

export interface ZATCAQROptions {
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  width?: number;
}

/**
 * Encodes string to UTF-8 and returns as hex string
 */
function stringToHex(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates TLV (Tag-Length-Value) hex string for ZATCA QR code
 * Tag: 1 byte (hex)
 * Length: 1 byte (hex)
 * Value: UTF-8 encoded string (hex)
 */
function createTLVHex(tag: number, value: string): string {
  const valueBytes = new TextEncoder().encode(value);

  if (valueBytes.length > 255) {
    throw new Error(
      `Value for tag ${tag} exceeds maximum length of 255 characters`,
    );
  }

  const hexTag = tag.toString(16).padStart(2, "0");
  const hexLength = valueBytes.length.toString(16).padStart(2, "0");
  const hexValue = stringToHex(value);

  return hexTag + hexLength + hexValue;
}

/**
 * Generates ZATCA-compliant TLV hex data
 * Tags 1-5 as specified by ZATCA requirements
 */
export function generateZATCATLV(data: ZATCAInvoiceData): string {
  // Validate required fields
  if (!data.sellerName) throw new Error("Seller name is required");
  if (!data.vatNumber) throw new Error("VAT number is required");
  if (!data.timestamp) throw new Error("Timestamp is required");
  if (data.totalAmount < 0)
    throw new Error("Total amount must be non-negative");
  if (data.vatAmount < 0) throw new Error("VAT amount must be non-negative");

  // Validate timestamp format (ISO 8601)
  if (!isValidISO8601(data.timestamp)) {
    throw new Error(
      "Timestamp must be in ISO 8601 format (e.g., 2022-04-25T15:30:00Z)",
    );
  }

  // Create TLV hex structures for each tag
  const tlvParts = [
    createTLVHex(1, data.sellerName),
    createTLVHex(2, data.vatNumber),
    createTLVHex(3, data.timestamp),
    createTLVHex(4, data.totalAmount.toFixed(2)),
    createTLVHex(5, data.vatAmount.toFixed(2)),
  ];

  return tlvParts.join("");
}

/**
 * Validates ISO 8601 timestamp format
 */
function isValidISO8601(timestamp: string): boolean {
  const iso8601Regex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;
  return iso8601Regex.test(timestamp);
}

/**
 * Generates ZATCA-compliant QR code as base64 data URL
 */
export async function generateZATCAQRCode(
  data: ZATCAInvoiceData,
  options: ZATCAQROptions = {},
): Promise<string> {
  try {
    // Generate TLV hex data
    const tlvHex = generateZATCATLV(data);

    // Generate QR code using the hex string with proper options
    const qrCodeDataUrl = await QRCode.toDataURL(tlvHex, {
      errorCorrectionLevel: options.errorCorrectionLevel || "M",
      type: "image/png",
      margin: options.margin || 1,
      color: options.color || {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: options.width || 256,
    });

    return qrCodeDataUrl;
  } catch (error) {
    throw new Error(
      `Failed to generate ZATCA QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Generates ZATCA QR code as buffer
 */
export async function generateZATCAQRCodeBuffer(
  data: ZATCAInvoiceData,
  options: ZATCAQROptions = {},
): Promise<Buffer> {
  try {
    // Generate TLV hex data
    const tlvHex = generateZATCATLV(data);

    // Generate QR code buffer using the hex string with proper options
    const qrCodeBuffer = await QRCode.toBuffer(tlvHex, {
      errorCorrectionLevel: options.errorCorrectionLevel || "M",
      type: "png",
      margin: options.margin || 1,
      color: options.color || {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: options.width || 256,
    });

    return qrCodeBuffer;
  } catch (error) {
    throw new Error(
      `Failed to generate ZATCA QR code buffer: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Validates ZATCA invoice data
 */
export function validateZATCAData(data: ZATCAInvoiceData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.sellerName || data.sellerName.trim().length === 0) {
    errors.push("Seller name is required");
  }

  if (!data.vatNumber || !/^[0-9]{15}$/.test(data.vatNumber)) {
    errors.push("VAT number must be exactly 15 digits");
  }

  if (!data.timestamp || !isValidISO8601(data.timestamp)) {
    errors.push("Valid ISO 8601 timestamp is required");
  }

  if (typeof data.totalAmount !== "number" || data.totalAmount < 0) {
    errors.push("Total amount must be a non-negative number");
  }

  if (typeof data.vatAmount !== "number" || data.vatAmount < 0) {
    errors.push("VAT amount must be a non-negative number");
  }

  if (data.vatAmount > data.totalAmount) {
    errors.push("VAT amount cannot exceed total amount");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates ZATCA QR data from order and company information
 */
export function createZATCADataFromOrder(
  order: {
    totalAmount: number;
    vatAmount?: number;
    createdAt: Date;
  },
  company: {
    name: string;
    vatRegistrationNumber: string;
  },
): ZATCAInvoiceData {
  // Calculate VAT if not provided (assuming 15% standard rate)
  const vatAmount = order.vatAmount || order.totalAmount * 0.15;

  return {
    sellerName: company.name,
    vatNumber: company.vatRegistrationNumber,
    timestamp: order.createdAt.toISOString(),
    totalAmount: order.totalAmount,
    vatAmount: vatAmount,
  };
}
