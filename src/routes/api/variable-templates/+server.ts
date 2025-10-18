import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import {
  createVariableTemplate,
  getVariableTemplates,
  getVariableTemplateById,
  updateVariableTemplate,
  deleteVariableTemplate,
  getVariableTemplatesByCategory,
} from "$lib/services/variableCollectionService";

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const category = url.searchParams.get("category");
    const templateId = url.searchParams.get("templateId");
    const id = url.searchParams.get("id");

    // Get specific template by ID
    if (id) {
      const template = await getVariableTemplateById(id);
      if (!template) {
        throw error(404, "Variable template not found");
      }
      return json({ template });
    }

    // Get templates by category
    if (category) {
      const templates = await getVariableTemplatesByCategory(category);
      return json({ templates });
    }

    // Get templates by document template
    if (templateId) {
      const templates = await getVariableTemplates(templateId);
      return json({ templates });
    }

    // Get all templates
    const templates = await getVariableTemplates();
    return json({ templates });
  } catch (err) {
    console.error("Error fetching variable templates:", err);
    throw error(500, "Failed to fetch variable templates");
  }
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const userId = locals.user?.uid;

    if (!userId) {
      throw error(401, "Authentication required");
    }

    // Validate required fields
    if (!data.name || !data.category || !data.variables) {
      throw error(400, "Missing required fields: name, category, variables");
    }

    // Validate variables array
    if (!Array.isArray(data.variables) || data.variables.length === 0) {
      throw error(400, "Variables must be a non-empty array");
    }

    // Validate each variable
    for (const variable of data.variables) {
      if (!variable.name || !variable.type) {
        throw error(400, "Each variable must have name and type");
      }
    }

    const template = await createVariableTemplate({
      name: data.name,
      description: data.description || "",
      category: data.category,
      variables: data.variables,
      isActive: data.isActive !== false, // Default to true
      createdBy: userId,
      documentTemplateIds: data.documentTemplateIds || [],
    });

    return json({ template }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating variable template:", err);
    if (err.status) throw err;
    throw error(500, "Failed to create variable template");
  }
};

export const PUT: RequestHandler = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const userId = locals.user?.uid;

    if (!userId) {
      throw error(401, "Authentication required");
    }

    if (!data.id) {
      throw error(400, "Template ID is required");
    }

    // Validate variables if provided
    if (data.variables) {
      if (!Array.isArray(data.variables) || data.variables.length === 0) {
        throw error(400, "Variables must be a non-empty array");
      }

      for (const variable of data.variables) {
        if (!variable.name || !variable.type) {
          throw error(400, "Each variable must have name and type");
        }
      }
    }

    const template = await updateVariableTemplate(data.id, {
      name: data.name,
      description: data.description,
      category: data.category,
      variables: data.variables,
      isActive: data.isActive,
      documentTemplateIds: data.documentTemplateIds,
    });

    if (!template) {
      throw error(404, "Variable template not found");
    }

    return json({ template });
  } catch (err: any) {
    console.error("Error updating variable template:", err);
    if (err.status) throw err;
    throw error(500, "Failed to update variable template");
  }
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
  try {
    const id = url.searchParams.get("id");
    const userId = locals.user?.uid;

    if (!userId) {
      throw error(401, "Authentication required");
    }

    if (!id) {
      throw error(400, "Template ID is required");
    }

    const success = await deleteVariableTemplate(id);

    if (!success) {
      throw error(404, "Variable template not found");
    }

    return json({ success: true });
  } catch (err: any) {
    console.error("Error deleting variable template:", err);
    if (err.status) throw err;
    throw error(500, "Failed to delete variable template");
  }
};
