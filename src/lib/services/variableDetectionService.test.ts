import { describe, it, expect } from "vitest";
import {
  detectVariablesInTemplate,
  analyzeTemplateVariables,
  validateVariableData,
  mergeVariableDetection,
} from "./variableDetectionService";
import type { TemplateVariable } from "$lib/types/templateVariable";

describe("Variable Detection Service", () => {
  describe("detectVariablesInTemplate", () => {
    it("should detect simple variables", () => {
      const template =
        "Hello {{clientName}}, your order {{orderNumber}} is ready.";
      const variables = detectVariablesInTemplate(template);

      expect(variables).toEqual(["clientName", "orderNumber"]);
    });

    it("should handle duplicate variables", () => {
      const template = "Order: {{orderNumber}} - Status: {{orderNumber}}";
      const variables = detectVariablesInTemplate(template);

      expect(variables).toEqual(["orderNumber"]);
    });

    it("should handle variables with spaces", () => {
      const template = "Date: {{ currentDate }}";
      const variables = detectVariablesInTemplate(template);

      expect(variables).toEqual(["currentDate"]);
    });

    it("should return empty array for no variables", () => {
      const template = "This is a plain text template.";
      const variables = detectVariablesInTemplate(template);

      expect(variables).toEqual([]);
    });
  });

  describe("analyzeTemplateVariables", () => {
    it("should detect system variables", () => {
      const template = "Date: {{currentDate}}, Total: {{totalAmount}}";
      const result = analyzeTemplateVariables(template);

      expect(result.detectedVariables).toHaveLength(2);
      expect(result.detectedVariables[0].key).toBe("currentDate");
      expect(result.detectedVariables[0].category).toBe("system");
      expect(result.detectedVariables[1].key).toBe("totalAmount");
      expect(result.detectedVariables[1].category).toBe("system");
    });

    it("should detect custom variables", () => {
      const template = "Client: {{clientName}}, Email: {{clientEmail}}";
      const result = analyzeTemplateVariables(template);

      expect(result.detectedVariables).toHaveLength(2);
      expect(result.detectedVariables[0].key).toBe("clientName");
      expect(result.detectedVariables[0].category).toBe("custom");
      expect(result.detectedVariables[1].key).toBe("clientEmail");
      expect(result.detectedVariables[1].category).toBe("custom");
    });

    it("should detect variable types correctly", () => {
      const template =
        "Amount: {{totalAmount}}, Date: {{orderDate}}, Count: {{itemCount}}, Active: {{isActive}}";
      const result = analyzeTemplateVariables(template);

      const variables = result.detectedVariables;
      const amountVar = variables.find((v) => v.key === "totalAmount");
      const dateVar = variables.find((v) => v.key === "orderDate");
      const countVar = variables.find((v) => v.key === "itemCount");
      const activeVar = variables.find((v) => v.key === "isActive");

      expect(amountVar?.type).toBe("currency");
      expect(dateVar?.type).toBe("date");
      expect(countVar?.type).toBe("number");
      expect(activeVar?.type).toBe("boolean");
    });

    it("should handle existing variables", () => {
      const template = "Client: {{clientName}}, Email: {{clientEmail}}";
      const existingVariables: TemplateVariable[] = [
        {
          key: "clientName",
          label: "Client Name",
          type: "text",
          required: true,
          category: "custom",
          usageCount: 5,
        },
      ];

      const result = analyzeTemplateVariables(template, existingVariables);

      expect(result.existingVariables).toHaveLength(1);
      expect(result.existingVariables[0].key).toBe("clientName");
      expect(result.newVariables).toHaveLength(1);
      expect(result.newVariables[0].key).toBe("clientEmail");
    });

    it("should generate recommendations", () => {
      const template = "{{clientName}} - {{totalAmount}}";
      const result = analyzeTemplateVariables(template);

      expect(result.recommendations).toContain(
        "Found 1 system variables that will be auto-populated",
      );
      expect(result.recommendations).toContain(
        "Found 1 custom variables that need user input",
      );
    });
  });

  describe("validateVariableData", () => {
    it("should validate complete data", () => {
      const detectedVariables = ["clientName", "totalAmount"];
      const providedData = {
        clientName: "John Doe",
        totalAmount: 100.5,
      };

      const result = validateVariableData(detectedVariables, providedData);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    it("should detect missing variables", () => {
      const detectedVariables = ["clientName", "totalAmount", "orderDate"];
      const providedData = {
        clientName: "John Doe",
        // missing totalAmount and orderDate
      };

      const result = validateVariableData(detectedVariables, providedData);

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["totalAmount", "orderDate"]);
    });

    it("should detect invalid types", () => {
      const detectedVariables = ["totalAmount", "orderDate"];
      const providedData = {
        totalAmount: "not a number",
        orderDate: "invalid date",
      };

      const result = validateVariableData(detectedVariables, providedData);

      expect(result.valid).toBe(false);
      expect(result.invalid).toHaveLength(2);
    });

    it("should handle empty values as missing", () => {
      const detectedVariables = ["clientName", "email"];
      const providedData = {
        clientName: "",
        email: null,
      };

      const result = validateVariableData(detectedVariables, providedData);

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(["clientName", "email"]);
    });
  });

  describe("mergeVariableDetection", () => {
    it("should merge multiple template analyses", () => {
      const analysis1 = analyzeTemplateVariables("Hello {{clientName}}");
      const analysis2 = analyzeTemplateVariables(
        "Order {{orderNumber}} - {{clientName}}",
      );

      const merged = mergeVariableDetection([analysis1, analysis2]);

      expect(merged.detectedVariables).toHaveLength(2);
      expect(merged.detectedVariables.map((v) => v.key)).toEqual([
        "clientName",
        "orderNumber",
      ]);
      expect(merged.newVariables).toHaveLength(2);
    });

    it("should remove duplicate recommendations", () => {
      const analysis1 = analyzeTemplateVariables("{{clientName}}");
      const analysis2 = analyzeTemplateVariables("{{clientEmail}}");

      const merged = mergeVariableDetection([analysis1, analysis2]);

      // Should not have duplicate recommendations
      const uniqueRecommendations = [...new Set(merged.recommendations)];
      expect(merged.recommendations).toEqual(uniqueRecommendations);
    });
  });
});
