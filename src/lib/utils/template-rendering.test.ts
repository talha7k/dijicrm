import { describe, it, expect } from "vitest";
import { validateTemplateData } from "./template-rendering";
import type { DocumentTemplate } from "$lib/types/document";
import { Timestamp } from "@firebase/firestore";

describe("Template Data Validation", () => {
  const createMockTemplate = (
    type: "order" | "legal" | "business" | "custom",
    placeholders: any[] = [],
  ): DocumentTemplate => ({
    id: "test-template",
    companyId: "test-company",
    name: "Test Template",
    description: "Test template description",
    type,
    htmlContent: "<div>Test content</div>",
    placeholders,
    isActive: true,
    version: 1,
    createdBy: "test-user",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  describe("Order Templates", () => {
    it("should fail validation when required data is missing", () => {
      const template = createMockTemplate("order", [
        {
          key: "companyName",
          label: "Company Name",
          type: "text",
          required: true,
        },
        { key: "items", label: "Items", type: "text", required: true },
        { key: "total", label: "Total", type: "number", required: true },
        {
          key: "orderNumber",
          label: "Order Number",
          type: "text",
          required: true,
        },
      ]);

      const result = validateTemplateData({}, [
        "Items",
        "Total",
        "Order Number",
      ]);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain("Items");
      expect(result.missingFields).toContain("Total");
      expect(result.missingFields).toContain("Order Number");
    });

    it("should handle complex order placeholders", () => {
      const template = createMockTemplate("order", [
        {
          key: "companyName",
          label: "Company Name",
          type: "text",
          required: true,
        },
        {
          key: "clientName",
          label: "Client Name",
          type: "text",
          required: true,
        },
        { key: "items", label: "Items", type: "text", required: true },
        { key: "subtotal", label: "Subtotal", type: "number", required: true },
        {
          key: "taxAmount",
          label: "Tax Amount",
          type: "number",
          required: true,
        },
        { key: "total", label: "Total", type: "number", required: true },
        { key: "date", label: "Date", type: "date", required: true },
        { key: "dueDate", label: "Due Date", type: "date", required: true },
        {
          key: "paymentTerms",
          label: "Payment Terms",
          type: "text",
          required: false,
        },
      ]);

      const result = validateTemplateData({}, [
        "Items",
        "Subtotal",
        "Tax Amount",
        "Total",
        "Date",
      ]);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain("Items");
      expect(result.missingFields).toContain("Subtotal");
      expect(result.missingFields).toContain("Tax Amount");
      expect(result.missingFields).toContain("Total");
      expect(result.missingFields).toContain("Date");
      expect(result.missingFields).toContain("Due Date");
    });
  });

  describe("Legal Templates", () => {
    it("should fail validation when required data is missing", () => {
      const template = createMockTemplate("legal", [
        {
          key: "companyName",
          label: "Company Name",
          type: "text",
          required: true,
        },
        {
          key: "principalName",
          label: "Principal Name",
          type: "text",
          required: true,
        },
        {
          key: "passportNumber",
          label: "Passport Number",
          type: "text",
          required: true,
        },
        {
          key: "currentDate",
          label: "Current Date",
          type: "date",
          required: true,
        },
        { key: "attorneys", label: "Attorneys", type: "text", required: true },
      ]);

      const result = validateTemplateData({}, [
        "Items",
        "Total",
        "Order Number",
      ]);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain("Principal Name");
      expect(result.missingFields).toContain("Passport Number");
      expect(result.missingFields).toContain("Current Date");
      expect(result.missingFields).toContain("Attorneys");
    });

    it("should handle complex legal placeholders", () => {
      const template = createMockTemplate("legal", [
        {
          key: "companyName",
          label: "Company Name",
          type: "text",
          required: true,
        },
        {
          key: "principalName",
          label: "Principal Name",
          type: "text",
          required: true,
        },
        {
          key: "principalNationality",
          label: "Principal Nationality",
          type: "text",
          required: true,
        },
        {
          key: "principalCapacity",
          label: "Principal Capacity",
          type: "text",
          required: true,
        },
        {
          key: "passportNumber",
          label: "Passport Number",
          type: "text",
          required: true,
        },
        {
          key: "passportIssueDate",
          label: "Passport Issue Date",
          type: "date",
          required: true,
        },
        {
          key: "passportIssuePlace",
          label: "Passport Issue Place",
          type: "text",
          required: true,
        },
        {
          key: "companyRegistration",
          label: "Company Registration",
          type: "text",
          required: true,
        },
        {
          key: "currentDate",
          label: "Current Date",
          type: "date",
          required: true,
        },
        { key: "attorneys", label: "Attorneys", type: "text", required: true },
      ]);

      const result = validateTemplateData({}, [
        "Items",
        "Total",
        "Order Number",
      ]);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain("Principal Name");
      expect(result.missingFields).toContain("Principal Nationality");
      expect(result.missingFields).toContain("Principal Capacity");
      expect(result.missingFields).toContain("Passport Number");
      expect(result.missingFields).toContain("Passport Issue Date");
      expect(result.missingFields).toContain("Passport Issue Place");
      expect(result.missingFields).toContain("Company Registration");
      expect(result.missingFields).toContain("Current Date");
      expect(result.missingFields).toContain("Attorneys");
    });
  });

  describe("Business Templates", () => {
    it("should fail validation when required data is missing", () => {
      const template = createMockTemplate("business", [
        {
          key: "companyName",
          label: "Company Name",
          type: "text",
          required: true,
        },
        {
          key: "currentDate",
          label: "Current Date",
          type: "date",
          required: true,
        },
        {
          key: "effectiveDate",
          label: "Effective Date",
          type: "date",
          required: true,
        },
      ]);

      const result = validateTemplateData({}, [
        "Items",
        "Total",
        "Order Number",
      ]);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain("Current Date");
      expect(result.missingFields).toContain("Effective Date");
    });
  });

  describe("Custom Templates", () => {
    it("should fail validation when required data is missing", () => {
      const template = createMockTemplate("custom", [
        {
          key: "companyName",
          label: "Company Name",
          type: "text",
          required: true,
        },
        {
          key: "currentDate",
          label: "Current Date",
          type: "date",
          required: true,
        },
      ]);

      const result = validateTemplateData({}, [
        "Items",
        "Total",
        "Order Number",
      ]);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain("Current Date");
    });
  });

  describe("Image Placeholders", () => {
    it("should not require image placeholders to be present", () => {
      const template = createMockTemplate("order", [
        {
          key: "companyName",
          label: "Company Name",
          type: "text",
          required: true,
        },
        {
          key: "companyLogo",
          label: "Company Logo",
          type: "image",
          required: true,
        },
        {
          key: "companyStamp",
          label: "Company Stamp",
          type: "image",
          required: false,
        },
        {
          key: "zatcaQRCode",
          label: "ZATCA QR Code",
          type: "image",
          required: false,
        },
      ]);

      const result = validateTemplateData({}, [
        "Items",
        "Total",
        "Order Number",
      ]);

      expect(result.isValid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });
  });

  describe("Missing Required Fields", () => {
    it("should still fail validation for truly missing required non-image fields", () => {
      const template = createMockTemplate("order", [
        {
          key: "companyName",
          label: "Company Name",
          type: "text",
          required: true,
        },
        {
          key: "clientName",
          label: "Client Name",
          type: "text",
          required: true,
        },
        { key: "total", label: "Total", type: "number", required: true },
      ]);

      const result = validateTemplateData({}, ["Client Name"]);

      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain("Client Name");
    });
  });
});
