import {
  SYSTEM_VARIABLE_CATALOG,
  type TemplateVariable,
  type VariableDetectionResult,
} from "$lib/types/templateVariable";
import type { TemplatePlaceholder } from "$lib/types/document";

/**
 * Regular expression pattern to detect template variables
 * Matches {{variableName}} format but excludes template logic like {{#if}}, {{/each}}, etc.
 */
const VARIABLE_PATTERN = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

/**
 * Detects variables used in a template string
 * Only matches simple variable names, not template logic syntax
 */
export function detectVariablesInTemplate(templateContent: string): string[] {
  const matches = templateContent.match(VARIABLE_PATTERN);
  if (!matches) {
    return [];
  }

  // Extract variable names from {{variableName}} format
  // Filter out template logic patterns like #if, /if, #each, /each
  const variableNames = matches
    .map((match) => match.slice(2, -2).trim())
    .filter((variableName) => {
      // Exclude template logic patterns that start with # or /
      return !variableName.startsWith("#") && !variableName.startsWith("/");
    });

  // Remove duplicates and return
  return [...new Set(variableNames)];
}

/**
 * Analyzes template content and provides variable detection results
 */
export function analyzeTemplateVariables(
  templateContent: string,
  existingVariables: TemplateVariable[] = [],
  templatePlaceholders: TemplatePlaceholder[] = [],
): VariableDetectionResult {
  const detectedVariableNames = detectVariablesInTemplate(templateContent);

  // Convert template placeholders to TemplateVariable format
  const convertedPlaceholders: TemplateVariable[] = templatePlaceholders.map(
    (placeholder) => ({
      key: placeholder.key,
      label: placeholder.label,
      type: placeholder.type,
      required: placeholder.required,
      defaultValue: placeholder.defaultValue,
      description: placeholder.description,
      category: "custom", // Template placeholders are custom variables
      usageCount: 0, // New placeholders start with 0 usage
    }),
  );

  // Find existing variables that match detected ones (from both store and template)
  const allExistingVariables = [...existingVariables, ...convertedPlaceholders];
  const existingVariablesMap = new Map(
    allExistingVariables.map((v) => [v.key, v]),
  );

  const detectedVariables: TemplateVariable[] = [];
  const newVariables: TemplateVariable[] = [];

  for (const variableName of detectedVariableNames) {
    const existingVar = existingVariablesMap.get(variableName);

    if (existingVar) {
      detectedVariables.push(existingVar);
    } else {
      // Create new variable definition
      const newVar = createVariableDefinition(variableName);
      detectedVariables.push(newVar);

      // Only add to newVariables if it's actually a new custom variable
      // System variables are automatically available and don't need to be "defined"
      if (newVar.category === "custom") {
        newVariables.push(newVar);
      }
    }
  }

  // Generate recommendations
  const recommendations = generateRecommendations(
    detectedVariables,
    existingVariables,
  );

  return {
    detectedVariables,
    existingVariables: Array.from(existingVariablesMap.values()),
    newVariables,
    recommendations,
  };
}

/**
 * Creates a variable definition based on the variable name and system catalog
 */
function createVariableDefinition(variableName: string): TemplateVariable {
  // Check if it's a system variable first
  const systemVar = SYSTEM_VARIABLE_CATALOG.find(
    (sv) => sv.key === variableName,
  );

  if (systemVar) {
    return {
      key: systemVar.key,
      label: systemVar.label,
      type: systemVar.type,
      required: false, // System variables are rarely required
      category: "system",
      description: systemVar.description,
      usageCount: 0,
    };
  }

  // If not a system variable, determine type based on naming conventions for custom variables
  const detectedType = detectVariableType(variableName);

  return {
    key: variableName,
    label: formatVariableLabel(variableName),
    type: detectedType,
    required: detectRequiredStatus(variableName),
    category: "custom",
    description: `Custom variable: ${variableName}`,
    usageCount: 0,
  };
}

/**
 * Detects variable type based on naming conventions
 */
function detectVariableType(
  variableName: string,
): "text" | "number" | "date" | "currency" | "boolean" | "image" {
  const lowerName = variableName.toLowerCase();

  // Currency patterns
  if (
    lowerName.includes("amount") ||
    lowerName.includes("price") ||
    lowerName.includes("cost") ||
    lowerName.includes("total") ||
    lowerName.includes("subtotal") ||
    lowerName.includes("tax") ||
    lowerName.includes("discount") ||
    lowerName.includes("fee")
  ) {
    return "currency";
  }

  // Date patterns
  if (
    lowerName.includes("date") ||
    lowerName.includes("time") ||
    lowerName.includes("created") ||
    lowerName.includes("updated") ||
    lowerName.includes("expired") ||
    lowerName.includes("due")
  ) {
    return "date";
  }

  // Number patterns
  if (
    lowerName.includes("count") ||
    lowerName.includes("quantity") ||
    lowerName.includes("number") ||
    lowerName.includes("id") ||
    lowerName.includes("percentage") ||
    lowerName.includes("rate")
  ) {
    return "number";
  }

  // Boolean patterns
  if (
    lowerName.includes("is") ||
    lowerName.includes("has") ||
    lowerName.includes("can") ||
    lowerName.includes("should") ||
    lowerName.includes("will") ||
    lowerName.includes("active")
  ) {
    return "boolean";
  }

  // Image patterns
  if (
    lowerName.includes("image") ||
    lowerName.includes("photo") ||
    lowerName.includes("picture") ||
    lowerName.includes("logo") ||
    lowerName.includes("qr") ||
    lowerName.includes("signature")
  ) {
    return "image";
  }

  // Default to text
  return "text";
}

/**
 * Detects if a variable is likely required based on naming conventions
 */
function detectRequiredStatus(variableName: string): boolean {
  const lowerName = variableName.toLowerCase();

  // Common required fields
  const requiredPatterns = [
    "name",
    "email",
    "phone",
    "address",
    "amount",
    "total",
    "price",
    "date",
    "time",
    "number",
    "id",
    "status",
  ];

  return requiredPatterns.some((pattern) => lowerName.includes(pattern));
}

/**
 * Formats variable name into a human-readable label
 */
function formatVariableLabel(variableName: string): string {
  // Convert camelCase or snake_case to Title Case
  return variableName
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Generates recommendations for variable management
 */
function generateRecommendations(
  detectedVariables: TemplateVariable[],
  existingVariables: TemplateVariable[],
): string[] {
  const recommendations: string[] = [];

  const systemVars = detectedVariables.filter((v) => v.category === "system");
  const customVars = detectedVariables.filter((v) => v.category === "custom");
  const requiredVars = detectedVariables.filter((v) => v.required);

  if (systemVars.length > 0) {
    recommendations.push(
      `Found ${systemVars.length} system variables that will be auto-populated`,
    );
  }

  if (customVars.length > 0) {
    recommendations.push(
      `Found ${customVars.length} custom variables that need user input`,
    );

    if (requiredVars.length > 0) {
      recommendations.push(
        `${requiredVars.length} variables are marked as required and must be provided`,
      );
    }
  }

  // Check for potentially missing common variables
  const commonVariables = ["currentDate", "totalAmount"];
  const detectedKeys = detectedVariables.map((v) => v.key);
  const missingCommon = commonVariables.filter(
    (cv) => !detectedKeys.includes(cv),
  );

  if (missingCommon.length > 0) {
    recommendations.push(
      `Consider adding common variables: ${missingCommon.join(", ")}`,
    );
  }

  // Check for variables that might be better as system variables
  const potentiallySystemVars = customVars.filter(
    (v) =>
      v.key.includes("Date") ||
      v.key.includes("Time") ||
      v.key.includes("Amount"),
  );

  if (potentiallySystemVars.length > 0) {
    recommendations.push(
      `Consider making these system variables: ${potentiallySystemVars.map((v) => v.key).join(", ")}`,
    );
  }

  return recommendations;
}

/**
 * Validates that all detected variables have corresponding data
 */
export function validateVariableData(
  detectedVariables: string[],
  providedData: Record<string, any>,
): { valid: boolean; missing: string[]; invalid: string[] } {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const variableName of detectedVariables) {
    if (!(variableName in providedData)) {
      missing.push(variableName);
      continue;
    }

    const value = providedData[variableName];

    // Check for null/undefined values
    if (value === null || value === undefined || value === "") {
      missing.push(variableName);
      continue;
    }

    // Additional validation based on variable type
    const systemVar = SYSTEM_VARIABLE_CATALOG.find(
      (sv) => sv.key === variableName,
    );
    if (systemVar) {
      if (!validateVariableType(value, systemVar.type)) {
        invalid.push(`${variableName} (expected ${systemVar.type})`);
      }
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}

/**
 * Validates that a value matches the expected type
 */
function validateVariableType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case "text":
      return typeof value === "string";
    case "number":
    case "currency":
      return (
        typeof value === "number" ||
        (typeof value === "string" && !isNaN(Number(value)))
      );
    case "date":
      return (
        value instanceof Date ||
        (typeof value === "string" && !isNaN(new Date(value).getTime()))
      );
    case "boolean":
      return (
        typeof value === "boolean" || value === "true" || value === "false"
      );
    case "image":
      return (
        typeof value === "string" &&
        (value.startsWith("data:image/") || value.startsWith("http"))
      );
    default:
      return true;
  }
}

/**
 * Extracts variables from multiple templates and merges them
 */
export function mergeVariableDetection(
  templateAnalyses: VariableDetectionResult[],
): VariableDetectionResult {
  const allDetectedVariables = new Map<string, TemplateVariable>();
  const allNewVariables = new Map<string, TemplateVariable>();
  const allExistingVariables = new Map<string, TemplateVariable>();
  const allRecommendations: string[] = [];

  for (const analysis of templateAnalyses) {
    // Merge detected variables
    for (const variable of analysis.detectedVariables) {
      if (!allDetectedVariables.has(variable.key)) {
        allDetectedVariables.set(variable.key, variable);
      }
    }

    // Merge new variables
    for (const variable of analysis.newVariables) {
      if (!allNewVariables.has(variable.key)) {
        allNewVariables.set(variable.key, variable);
      }
    }

    // Merge existing variables
    for (const variable of analysis.existingVariables) {
      if (!allExistingVariables.has(variable.key)) {
        allExistingVariables.set(variable.key, variable);
      }
    }

    // Merge recommendations
    allRecommendations.push(...analysis.recommendations);
  }

  return {
    detectedVariables: Array.from(allDetectedVariables.values()),
    existingVariables: Array.from(allExistingVariables.values()),
    newVariables: Array.from(allNewVariables.values()),
    recommendations: [...new Set(allRecommendations)], // Remove duplicates
  };
}
