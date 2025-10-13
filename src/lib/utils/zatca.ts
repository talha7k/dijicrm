/**
 * ZATCA QR Code Generation Utilities
 * Implements TLV (Tag-Length-Value) encoding for Saudi e-invoicing compliance
 */

export interface ZATCAInvoiceData {
  sellerName: string;
  vatNumber: string;
  invoiceDate: string; // ISO date string
  totalAmount: number;
  vatAmount: number;
}

/**
 * Encodes data in TLV (Tag-Length-Value) format
 * @param tag - Tag identifier (1 byte)
 * @param value - String value to encode
 * @returns TLV encoded bytes
 */
function encodeTLV(tag: number, value: string): Uint8Array {
  const valueBytes = new TextEncoder().encode(value);
  const length = valueBytes.length;

  const buffer = new Uint8Array(2 + length);
  buffer[0] = tag;
  buffer[1] = length;
  buffer.set(valueBytes, 2);

  return buffer;
}

/**
 * Generates ZATCA-compliant QR code data
 * @param data - Invoice data for QR code
 * @returns Base64 encoded TLV data (max 500 characters)
 */
export function generateZATCAQRCode(data: ZATCAInvoiceData): string {
  // ZATCA TLV tags:
  // 1: Seller name
  // 2: VAT number
  // 3: Invoice date (timestamp)
  // 4: Total amount
  // 5: VAT amount

  const tlvParts: Uint8Array[] = [
    encodeTLV(1, data.sellerName),
    encodeTLV(2, data.vatNumber),
    encodeTLV(3, data.invoiceDate),
    encodeTLV(4, data.totalAmount.toFixed(2)),
    encodeTLV(5, data.vatAmount.toFixed(2)),
  ];

  // Combine all TLV parts
  const totalLength = tlvParts.reduce((sum, part) => sum + part.length, 0);
  const combinedBuffer = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of tlvParts) {
    combinedBuffer.set(part, offset);
    offset += part.length;
  }

  // Convert to Base64
  const base64String = btoa(String.fromCharCode(...combinedBuffer));

  // Ensure max 500 characters as per ZATCA spec
  if (base64String.length > 500) {
    throw new Error(
      `QR code data exceeds 500 characters: ${base64String.length}`,
    );
  }

  return base64String;
}

/**
 * Validates ZATCA invoice data
 * @param data - Invoice data to validate
 * @returns Validation result
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

  if (!data.invoiceDate || isNaN(Date.parse(data.invoiceDate))) {
    errors.push("Valid invoice date is required");
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
