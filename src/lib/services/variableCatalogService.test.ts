import { describe, it, expect } from "vitest";
import {
  getSystemVariables,
  getCommonSystemVariables,
  searchSystemVariables,
  getVariablesByType,
  validateVariableKey,
  suggestVariableNames,
  getVariableUsageStats,
  formatVariableForDisplay,
  createVariableTemplateFromCatalog,
  VARIABLE_CATEGORIES,
  VARIABLE_TYPES,
} from "./variableCatalogService";
import { SYSTEM_VARIABLE_CATALOG } from "$lib/types/templateVariable";

describe("Variable Catalog Service", () => {
  describe("getSystemVariables", () => {
    it("should return all system variables", () => {
      const variables = getSystemVariables();

      expect(variables).toBeDefined();
      expect(variables.length).toBeGreaterThan(0);
      expect(variables[0]).toHaveProperty("key");
      expect(variables[0]).toHaveProperty("label");
      expect(variables[0]).toHaveProperty("type");
      expect(variables[0]).toHaveProperty("category");
      expect(variables[0].category).toBe("system");
    });

    it("should include common variables like currentDate", () => {
      const variables = getSystemVariables();
      const currentDateVar = variables.find((v) => v.key === "currentDate");

      expect(currentDateVar).toBeDefined();
      expect(currentDateVar?.label).toBe("Current Date");
      expect(currentDateVar?.type).toBe("date");
      expect(currentDateVar?.isCommon).toBe(true);
    });
  });

  describe("getCommonSystemVariables", () => {
    it("should return only common variables", () => {
      const commonVars = getCommonSystemVariables();

      expect(commonVars.length).toBeGreaterThan(0);
      expect(commonVars.every((v) => v.isCommon)).toBe(true);
    });
  });

  describe("searchSystemVariables", () => {
    it("should search by variable key", () => {
      const results = searchSystemVariables("date");

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((v) => v.key.toLowerCase().includes("date"))).toBe(
        true,
      );
    });

    it("should search by label", () => {
      const results = searchSystemVariables("current");

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some((v) => v.label.toLowerCase().includes("current")),
      ).toBe(true);
    });

    it("should be case insensitive", () => {
      const results1 = searchSystemVariables("DATE");
      const results2 = searchSystemVariables("date");

      expect(results1).toEqual(results2);
    });

    it("should return empty array for no matches", () => {
      const results = searchSystemVariables("nonexistentvariable");

      expect(results).toEqual([]);
    });
  });

  describe("getVariablesByType", () => {
    it("should filter variables by type", () => {
      const variables = getSystemVariables();
      const dateVars = getVariablesByType(variables, "date");

      expect(dateVars.length).toBeGreaterThan(0);
      expect(dateVars.every((v) => v.type === "date")).toBe(true);
    });

    it("should return empty array for unknown type", () => {
      const variables = getSystemVariables();
      const unknownVars = getVariablesByType(variables, "unknown");

      expect(unknownVars).toEqual([]);
    });
  });

  describe("validateVariableKey", () => {
    it("should validate correct variable keys", () => {
      const result = validateVariableKey("customVariable");

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject empty keys", () => {
      const result = validateVariableKey("");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Variable key is required");
    });

    it("should reject keys that are too short", () => {
      const result = validateVariableKey("x");

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("at least 2 characters")),
      ).toBe(true);
    });

    it("should reject keys with invalid characters", () => {
      const result = validateVariableKey("client-name");

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes("letters, numbers, and underscores"),
        ),
      ).toBe(true);
    });

    it("should reject keys starting with numbers", () => {
      const result = validateVariableKey("1clientName");

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("start with a letter"))).toBe(
        true,
      );
    });

    it("should reject system variable names", () => {
      const result = validateVariableKey("currentDate");

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("reserved system variable")),
      ).toBe(true);
    });
  });

  describe("suggestVariableNames", () => {
    it("should suggest names based on partial input", () => {
      const suggestions = suggestVariableNames("client");

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.includes("client"))).toBe(true);
    });

    it("should be case insensitive", () => {
      const suggestions1 = suggestVariableNames("CLIENT");
      const suggestions2 = suggestVariableNames("client");

      expect(suggestions1).toEqual(suggestions2);
    });

    it("should limit suggestions to 10", () => {
      const suggestions = suggestVariableNames("a"); // Very broad search

      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    it("should return empty array for empty partial", () => {
      const suggestions = suggestVariableNames("");

      expect(suggestions).toEqual([]);
    });
  });

  describe("getVariableUsageStats", () => {
    it("should return usage statistics", () => {
      const variables = getSystemVariables();
      const stats = getVariableUsageStats(variables);

      expect(stats).toHaveProperty("totalVariables");
      expect(stats).toHaveProperty("systemVariables");
      expect(stats).toHaveProperty("commonVariables");
      expect(stats).toHaveProperty("variablesByType");

      expect(stats.totalVariables).toBe(variables.length);
      expect(stats.systemVariables).toBe(variables.length); // All are system variables
    });

    it("should count variables by type", () => {
      const variables = getSystemVariables();
      const stats = getVariableUsageStats(variables);

      expect(Object.keys(stats.variablesByType).length).toBeGreaterThan(0);
      expect(stats.variablesByType["date"]).toBeGreaterThan(0);
    });
  });

  describe("formatVariableForDisplay", () => {
    it("should format variable for display", () => {
      const variables = getSystemVariables();
      const variable = variables.find((v) => v.key === "currentDate")!;
      const formatted = formatVariableForDisplay(variable);

      expect(formatted).toHaveProperty("placeholder");
      expect(formatted).toHaveProperty("example");
      expect(formatted).toHaveProperty("description");

      expect(formatted.placeholder).toBe("{{currentDate}}");
      expect(formatted.description).toBe(variable.description);
    });
  });

  describe("createVariableTemplateFromCatalog", () => {
    it("should create template variables from catalog keys", () => {
      const keys = ["currentDate", "totalAmount"];
      const templateVars = createVariableTemplateFromCatalog(
        keys,
        "Test Template",
      );

      expect(templateVars).toHaveLength(2);
      expect(templateVars[0].key).toBe("currentDate");
      expect(templateVars[0].category).toBe("system");
      expect(templateVars[1].key).toBe("totalAmount");
      expect(templateVars[1].category).toBe("system");
    });

    it("should handle non-system variables", () => {
      const keys = ["customVariable"];
      const templateVars = createVariableTemplateFromCatalog(
        keys,
        "Test Template",
      );

      expect(templateVars).toHaveLength(1);
      expect(templateVars[0].key).toBe("customVariable");
      expect(templateVars[0].category).toBe("custom");
      expect(templateVars[0].label).toBe("Custom Variable");
    });
  });

  describe("Constants", () => {
    it("should define variable categories", () => {
      expect(VARIABLE_CATEGORIES).toHaveProperty("SYSTEM");
      expect(VARIABLE_CATEGORIES).toHaveProperty("CUSTOM");
    });

    it("should define variable types", () => {
      expect(VARIABLE_TYPES).toHaveProperty("TEXT");
      expect(VARIABLE_TYPES).toHaveProperty("NUMBER");
      expect(VARIABLE_TYPES).toHaveProperty("DATE");
      expect(VARIABLE_TYPES).toHaveProperty("BOOLEAN");
    });
  });
});
