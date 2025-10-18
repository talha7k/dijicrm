import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
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
} from "$lib/services/variableCatalogService";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const category = url.searchParams.get("category");
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");
    const common = url.searchParams.get("common");
    const grouped = url.searchParams.get("grouped");
    const stats = url.searchParams.get("stats");

    let variables = getSystemVariables();

    // Filter by category
    if (category) {
      variables = variables.filter((v) => v.category === category);
    }

    // Filter by type
    if (type) {
      variables = getVariablesByType(variables, type);
    }

    // Filter by common variables
    if (common === "true") {
      variables = getCommonSystemVariables();
    }

    // Search
    if (search) {
      variables = searchSystemVariables(search);
    }

    // Group by category
    if (grouped === "true") {
      const groupedVariables = variables.reduce(
        (acc, variable) => {
          const category = variable.category || "system";
          if (!acc[category]) acc[category] = [];
          acc[category].push(variable);
          return acc;
        },
        {} as Record<string, typeof variables>,
      );

      return json({
        variables: groupedVariables,
        categories: Object.keys(VARIABLE_CATEGORIES),
        types: Object.keys(VARIABLE_TYPES),
      });
    }

    // Get statistics
    if (stats === "true") {
      const usageStats = getVariableUsageStats(variables);
      return json({
        variables,
        stats: usageStats,
        categories: Object.keys(VARIABLE_CATEGORIES),
        types: Object.keys(VARIABLE_TYPES),
      });
    }

    return json({
      variables,
      categories: Object.keys(VARIABLE_CATEGORIES),
      types: Object.keys(VARIABLE_TYPES),
    });
  } catch (err) {
    console.error("Error fetching variable catalog:", err);
    throw error(500, "Failed to fetch variable catalog");
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();

    if (data.action === "validate") {
      if (!data.key) {
        throw error(400, "Variable key is required for validation");
      }

      const validation = validateVariableKey(data.key);
      return json(validation);
    }

    if (data.action === "suggest") {
      if (!data.partial) {
        throw error(400, "Partial input is required for suggestions");
      }

      const suggestions = suggestVariableNames(data.partial);
      return json({ suggestions });
    }

    if (data.action === "format") {
      if (!data.key) {
        throw error(400, "Variable key is required for formatting");
      }

      const variable = getSystemVariables().find((v) => v.key === data.key);
      if (!variable) {
        throw error(404, "Variable not found in catalog");
      }

      const formatted = formatVariableForDisplay(variable);
      return json(formatted);
    }

    if (data.action === "createTemplate") {
      if (!data.keys || !Array.isArray(data.keys)) {
        throw error(400, "Variable keys array is required");
      }

      const templateVariables = createVariableTemplateFromCatalog(
        data.keys,
        data.templateName || "Custom Template",
        data.category,
      );

      return json({ templateVariables });
    }

    throw error(
      400,
      "Invalid action. Supported actions: validate, suggest, format, createTemplate",
    );
  } catch (err: any) {
    console.error("Error in variable catalog POST:", err);
    if (err.status) throw err;
    throw error(500, "Failed to process variable catalog request");
  }
};
