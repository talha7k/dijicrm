import { describe, it, expect } from "vitest";
import {
  generateZATCAQRCode,
  validateZATCAData,
  type ZATCAInvoiceData,
} from "./zatca";

describe("ZATCA QR Code Generation", () => {
  describe("validateZATCAData", () => {
    it("should validate valid ZATCA data", () => {
      const validData: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789012345", // 15 digits
        invoiceDate: "2024-01-15",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const result = validateZATCAData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid VAT number", () => {
      const invalidData: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789", // Too short
        invoiceDate: "2024-01-15",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const result = validateZATCAData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("VAT number must be exactly 15 digits");
    });

    it("should reject empty seller name", () => {
      const invalidData: ZATCAInvoiceData = {
        sellerName: "",
        vatNumber: "123456789012345",
        invoiceDate: "2024-01-15",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const result = validateZATCAData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Seller name is required");
    });

    it("should reject invalid date", () => {
      const invalidData: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789012345",
        invoiceDate: "invalid-date",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const result = validateZATCAData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Valid invoice date is required");
    });

    it("should reject negative amounts", () => {
      const invalidData: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789012345",
        invoiceDate: "2024-01-15",
        totalAmount: -100.5,
        vatAmount: 150.0,
      };

      const result = validateZATCAData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Total amount must be a non-negative number",
      );
    });

    it("should reject VAT amount exceeding total", () => {
      const invalidData: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789012345",
        invoiceDate: "2024-01-15",
        totalAmount: 100.0,
        vatAmount: 150.0,
      };

      const result = validateZATCAData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("VAT amount cannot exceed total amount");
    });
  });

  describe("generateZATCAQRCode", () => {
    it("should generate QR code for valid data", () => {
      const data: ZATCAInvoiceData = {
        sellerName: "Test Company Ltd",
        vatNumber: "123456789012345",
        invoiceDate: "2024-01-15T10:30:00Z",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const qrCode = generateZATCAQRCode(data);
      expect(typeof qrCode).toBe("string");
      expect(qrCode.length).toBeGreaterThan(0);
      expect(qrCode.length).toBeLessThanOrEqual(500);

      // Should be valid base64
      expect(() => atob(qrCode)).not.toThrow();
    });

    it("should ensure QR code data does not exceed 500 characters", () => {
      const data: ZATCAInvoiceData = {
        sellerName: "Test Company Ltd",
        vatNumber: "123456789012345",
        invoiceDate: "2024-01-15T10:30:00Z",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const qrCode = generateZATCAQRCode(data);
      expect(qrCode.length).toBeLessThanOrEqual(500);
    });

    it("should generate consistent QR codes for same data", () => {
      const data: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789012345",
        invoiceDate: "2024-01-15",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const qrCode1 = generateZATCAQRCode(data);
      const qrCode2 = generateZATCAQRCode(data);

      expect(qrCode1).toBe(qrCode2);
    });
  });
});
