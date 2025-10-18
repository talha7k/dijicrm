import {
  SYSTEM_VARIABLE_CATALOG,
  type VariableCatalogEntry,
  type TemplateVariable,
  type ClientTemplateVariable,
} from "$lib/types/templateVariable";

/**
 * Variable categories - simplified to just SYSTEM and CUSTOM
 */
export const VARIABLE_CATEGORIES = {
  SYSTEM: "system",
  CUSTOM: "custom",
} as const;

/**
 * Variable type groups
 */
export const VARIABLE_TYPES = {
  TEXT: "text",
  NUMBER: "number",
  CURRENCY: "currency",
  DATE: "date",
  BOOLEAN: "boolean",
  IMAGE: "image",
} as const;

/**
 * Gets all system variables from the catalog
 */
export function getSystemVariables(): VariableCatalogEntry[] {
  return [...SYSTEM_VARIABLE_CATALOG];
}

/**
 * Gets commonly used system variables
 */
export function getCommonSystemVariables(): VariableCatalogEntry[] {
  return SYSTEM_VARIABLE_CATALOG.filter((variable) => variable.isCommon);
}

/**
 * Searches system variables by key, label, or description
 */
export function searchSystemVariables(query: string): VariableCatalogEntry[] {
  if (!query || query.trim() === "") {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  return SYSTEM_VARIABLE_CATALOG.filter(
    (variable) =>
      variable.key.toLowerCase().includes(lowerQuery) ||
      variable.label.toLowerCase().includes(lowerQuery) ||
      variable.description.toLowerCase().includes(lowerQuery),
  );
}

/**
 * Creates a comprehensive variable catalog including system and custom variables
 */
export function createVariableCatalog(
  customVariables: (TemplateVariable | ClientTemplateVariable)[] = [],
): VariableCatalogEntry[] {
  const catalog: VariableCatalogEntry[] = [];

  // Add system variables
  catalog.push(...SYSTEM_VARIABLE_CATALOG);

  // Add custom variables
  for (const customVar of customVariables) {
    const catalogEntry: VariableCatalogEntry = {
      key: customVar.key,
      label: customVar.label,
      type: customVar.type,
      category: "system" as const, // VariableCatalogEntry requires category to be 'system'
      description: customVar.description || `Custom variable: ${customVar.key}`,
      exampleValue: getExampleValueForType(customVar.type),
      isCommon: false,
    };

    catalog.push(catalogEntry);
  }

  return catalog;
}

/**
 * Gets example values for different variable types
 */
function getExampleValueForType(type: string): any {
  switch (type) {
    case "text":
      return "Example text";
    case "number":
      return 42;
    case "currency":
      return 100.5;
    case "date":
      return new Date().toISOString().split("T")[0];
    case "boolean":
      return true;
    case "image":
      return "data:image/png;base64,...";
    default:
      return "Example value";
  }
}

/**
 * Gets variables by type
 */
export function getVariablesByType(
  variables: VariableCatalogEntry[],
  type: string,
): VariableCatalogEntry[] {
  return variables.filter((variable) => variable.type === type);
}

/**
 * Validates that a variable key follows naming conventions
 */
export function validateVariableKey(key: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!key) {
    errors.push("Variable key is required");
    return { valid: false, errors };
  }

  if (key.length < 2) {
    errors.push("Variable key must be at least 2 characters long");
  }

  if (key.length > 50) {
    errors.push("Variable key must be less than 50 characters");
  }

  // Check for valid characters (letters, numbers, underscores)
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
    errors.push(
      "Variable key must start with a letter and contain only letters, numbers, and underscores",
    );
  }

  // Check if it conflicts with system variables
  const systemVarKeys = SYSTEM_VARIABLE_CATALOG.map((sv) => sv.key);
  if (systemVarKeys.includes(key)) {
    errors.push(`'${key}' is a reserved system variable name`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Suggests variable names based on a partial input
 */
export function suggestVariableNames(partial: string): string[] {
  if (!partial || partial.trim() === "") {
    return [];
  }

  const lowerPartial = partial.toLowerCase();
  const suggestions: string[] = [];

  // Check system variables
  for (const systemVar of SYSTEM_VARIABLE_CATALOG) {
    if (
      systemVar.key.toLowerCase().includes(lowerPartial) ||
      systemVar.label.toLowerCase().includes(lowerPartial)
    ) {
      suggestions.push(systemVar.key);
    }
  }

  // Add common suggestions based on partial
  const commonSuggestions = [
    "clientName",
    "clientEmail",
    "clientPhone",
    "clientAddress",
    "companyName",
    "companyAddress",
    "companyPhone",
    "companyEmail",
    "orderNumber",
    "orderDate",
    "dueDate",
    "totalAmount",
    "subtotal",
    "taxAmount",
    "discountAmount",
    "currency",
    "paymentStatus",
    "currentDate",
    "currentTime",
    "invoiceNumber",
    "invoiceDate",
  ];

  for (const suggestion of commonSuggestions) {
    if (
      suggestion.toLowerCase().includes(lowerPartial) &&
      !suggestions.includes(suggestion)
    ) {
      suggestions.push(suggestion);
    }
  }

  return suggestions.slice(0, 10); // Limit to 10 suggestions
}

/**
 * Gets variable usage statistics
 */
export function getVariableUsageStats(variables: VariableCatalogEntry[]): {
  totalVariables: number;
  systemVariables: number;
  commonVariables: number;
  variablesByType: Record<string, number>;
} {
  const stats = {
    totalVariables: variables.length,
    systemVariables: variables.filter((v) => v.category === "system").length,
    commonVariables: variables.filter((v) => v.isCommon).length,
    variablesByType: {} as Record<string, number>,
  };

  for (const variable of variables) {
    // Count by type
    stats.variablesByType[variable.type] =
      (stats.variablesByType[variable.type] || 0) + 1;
  }

  return stats;
}

/**
 * Formats variable for display in templates
 */
export function formatVariableForDisplay(variable: VariableCatalogEntry): {
  placeholder: string;
  example: string;
  description: string;
} {
  return {
    placeholder: `{{${variable.key}}}`,
    example:
      typeof variable.exampleValue === "string"
        ? variable.exampleValue
        : String(variable.exampleValue),
    description: variable.description,
  };
}

/**
 * Creates a variable template from catalog entries
 */
export function createVariableTemplateFromCatalog(
  selectedKeys: string[],
  templateName: string,
  category: string = "custom",
): TemplateVariable[] {
  const templateVariables: TemplateVariable[] = [];

  for (const key of selectedKeys) {
    const catalogEntry = SYSTEM_VARIABLE_CATALOG.find(
      (entry) => entry.key === key,
    );

    if (catalogEntry) {
      templateVariables.push({
        key: catalogEntry.key,
        label: catalogEntry.label,
        type: catalogEntry.type,
        required: false,
        category: catalogEntry.category as "system" | "custom",
        description: catalogEntry.description,
        usageCount: 0,
      });
    } else {
      // Create a basic template variable for non-system variables
      templateVariables.push({
        key,
        label: formatVariableLabel(key),
        type: "text",
        required: false,
        category: "custom",
        description: `Custom variable: ${key}`,
        usageCount: 0,
      });
    }
  }

  return templateVariables;
}

/**
 * Formats variable key into a human-readable label
 */
function formatVariableLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}
