import { describe, it, expect } from "vitest";
import {
  generateZATCAQRCode,
  generateZATCATLV,
  validateZATCAData,
  createZATCADataFromOrder,
  type ZATCAInvoiceData,
} from "./zatca";

describe("ZATCA QR Code Generation", () => {
  describe("validateZATCAData", () => {
    it("should validate valid ZATCA data", () => {
      const validData: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789012345", // 15 digits
        timestamp: "2024-01-15T10:30:00Z",
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
        timestamp: "2024-01-15T10:30:00Z",
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
        timestamp: "2024-01-15T10:30:00Z",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const result = validateZATCAData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Seller name is required");
    });

    it("should reject invalid timestamp", () => {
      const invalidData: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789012345",
        timestamp: "invalid-date",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const result = validateZATCAData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Valid ISO 8601 timestamp is required");
    });

    it("should reject negative amounts", () => {
      const invalidData: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789012345",
        timestamp: "2024-01-15T10:30:00Z",
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
        timestamp: "2024-01-15T10:30:00Z",
        totalAmount: 100.0,
        vatAmount: 150.0,
      };

      const result = validateZATCAData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("VAT amount cannot exceed total amount");
    });
  });

  describe("generateZATCATLV", () => {
    it("should generate TLV hex string for valid data", () => {
      const data: ZATCAInvoiceData = {
        sellerName: "Test Company Ltd",
        vatNumber: "123456789012345",
        timestamp: "2024-01-15T10:30:00Z",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const tlvHex = generateZATCATLV(data);
      expect(typeof tlvHex).toBe("string");
      expect(tlvHex.length).toBeGreaterThan(0);

      // Should start with tag 1 (01)
      expect(tlvHex.startsWith("01")).toBe(true);
    });

    it("should generate consistent TLV for same data", () => {
      const data: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789012345",
        timestamp: "2024-01-15T10:30:00Z",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const tlv1 = generateZATCATLV(data);
      const tlv2 = generateZATCATLV(data);

      expect(tlv1).toBe(tlv2);
    });
  });

  describe("generateZATCAQRCode", () => {
    it("should generate QR code for valid data", async () => {
      const data: ZATCAInvoiceData = {
        sellerName: "Test Company Ltd",
        vatNumber: "123456789012345",
        timestamp: "2024-01-15T10:30:00Z",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const qrCode = await generateZATCAQRCode(data);
      expect(typeof qrCode).toBe("string");
      expect(qrCode.length).toBeGreaterThan(0);

      // Should be a data URL
      expect(qrCode.startsWith("data:image/png;base64,")).toBe(true);
    });

    it("should generate consistent QR codes for same data", async () => {
      const data: ZATCAInvoiceData = {
        sellerName: "Test Company",
        vatNumber: "123456789012345",
        timestamp: "2024-01-15T10:30:00Z",
        totalAmount: 1000.5,
        vatAmount: 150.0,
      };

      const qrCode1 = await generateZATCAQRCode(data);
      const qrCode2 = await generateZATCAQRCode(data);

      expect(qrCode1).toBe(qrCode2);
    });
  });

  describe("createZATCADataFromOrder", () => {
    it("should create ZATCA data from order and company", () => {
      const order = {
        totalAmount: 1000,
        vatAmount: 150,
        createdAt: new Date("2024-01-15T10:30:00Z"),
      };

      const company = {
        name: "Test Company",
        vatRegistrationNumber: "123456789012345",
      };

      const zatcaData = createZATCADataFromOrder(order, company);

      expect(zatcaData.sellerName).toBe("Test Company");
      expect(zatcaData.vatNumber).toBe("123456789012345");
      expect(zatcaData.timestamp).toBe("2024-01-15T10:30:00.000Z");
      expect(zatcaData.totalAmount).toBe(1000);
      expect(zatcaData.vatAmount).toBe(150);
    });

    it("should calculate VAT if not provided", () => {
      const order = {
        totalAmount: 1000,
        createdAt: new Date("2024-01-15T10:30:00Z"),
      };

      const company = {
        name: "Test Company",
        vatRegistrationNumber: "123456789012345",
      };

      const zatcaData = createZATCADataFromOrder(order, company);

      expect(zatcaData.vatAmount).toBe(150); // 15% of 1000
    });
  });
});
