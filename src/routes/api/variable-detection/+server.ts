import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import type { TemplateVariable } from "$lib/types/templateVariable";
import {
  analyzeTemplateVariables,
  validateVariableData,
  mergeVariableDetection,
} from "$lib/services/variableDetectionService";
import { getVariableTemplates } from "$lib/services/variableCollectionService";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();

    if (!data.templateContent) {
      throw error(400, "Template content is required");
    }

    // Get existing variables if template ID is provided
    let existingVariables: TemplateVariable[] = [];
    if (data.templateId) {
      const templates = await getVariableTemplates(data.templateId);
      existingVariables = templates.flatMap((t) => t.variables);
    }

    // Analyze the template
    const analysis = analyzeTemplateVariables(
      data.templateContent,
      existingVariables,
      [],
    );

    // Validate provided data if available
    let validation = null;
    if (data.providedData) {
      const detectedVariableNames = analysis.detectedVariables.map(
        (v) => v.key,
      );
      validation = validateVariableData(
        detectedVariableNames,
        data.providedData,
      );
    }

    return json({
      analysis,
      validation,
      detectedVariableCount: analysis.detectedVariables.length,
      systemVariableCount: analysis.detectedVariables.filter(
        (v) => v.category === "system",
      ).length,
      customVariableCount: analysis.detectedVariables.filter(
        (v) => v.category === "custom",
      ).length,
      requiredVariableCount: analysis.detectedVariables.filter(
        (v) => v.required,
      ).length,
    });
  } catch (err: any) {
    console.error("Error in variable detection:", err);
    if (err.status) throw err;
    throw error(500, "Failed to analyze template variables");
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();

    if (!data.templates || !Array.isArray(data.templates)) {
      throw error(400, "Templates array is required");
    }

    // Analyze each template
    const analyses = [];
    for (const templateData of data.templates) {
      if (!templateData.content) {
        continue;
      }

      let existingVariables: TemplateVariable[] = [];
      if (templateData.templateId) {
        const templates = await getVariableTemplates(templateData.templateId);
        existingVariables = templates.flatMap((t) => t.variables);
      }

      const analysis = analyzeTemplateVariables(
        templateData.content,
        existingVariables,
        [],
      );
      analyses.push(analysis);
    }

    // Merge all analyses
    const mergedAnalysis = mergeVariableDetection(analyses);

    return json({
      mergedAnalysis,
      templateCount: data.templates.length,
      totalVariableCount: mergedAnalysis.detectedVariables.length,
      systemVariableCount: mergedAnalysis.detectedVariables.filter(
        (v) => v.category === "system",
      ).length,
      customVariableCount: mergedAnalysis.detectedVariables.filter(
        (v) => v.category === "custom",
      ).length,
      requiredVariableCount: mergedAnalysis.detectedVariables.filter(
        (v) => v.required,
      ).length,
    });
  } catch (err: any) {
    console.error("Error in batch variable detection:", err);
    if (err.status) throw err;
    throw error(500, "Failed to analyze template variables");
  }
};
