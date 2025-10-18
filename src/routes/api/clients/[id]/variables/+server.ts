import { json, error } from "@sveltejs/kit";
import { getDb } from "$lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import type { ClientTemplateVariable } from "$lib/types/templateVariable";

// GET /api/clients/[id]/variables - Get all variables for a client
export const GET = async ({
  params,
  locals,
  url,
}: {
  params: { id: string };
  locals: any;
  url: URL;
}) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    const user = locals.user;
    if (!user || !user.uid || !user.email) {
      throw error(401, "Unauthorized");
    }

    const clientId = params.id;
    if (!clientId) {
      throw error(400, "Client ID is required");
    }

    // Get query parameters
    const templateIds = url.searchParams.get("templateIds")?.split(",") || [];
    const category = url.searchParams.get("category") as
      | "system"
      | "custom"
      | null;
    const type = url.searchParams.get("type") as
      | ClientTemplateVariable["type"]
      | null;
    const isRequired =
      url.searchParams.get("isRequired") === "true" ? true : undefined;
    const search = url.searchParams.get("search") || "";

    // Build query
    let query = db
      .collection("clientTemplateVariables")
      .where("clientId", "==", clientId)
      .orderBy("updatedAt", "desc");

    // Apply filters if provided
    if (templateIds.length > 0) {
      // Note: Firestore doesn't support array-contains-any for multiple values easily
      // This would need a more complex query or client-side filtering
    }

    if (category) {
      query = query.where("category", "==", category);
    }

    if (type) {
      query = query.where("type", "==", type);
    }

    if (isRequired !== undefined) {
      query = query.where("isRequired", "==", isRequired);
    }

    const snapshot = await query.get();
    let variables: ClientTemplateVariable[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      variables.push({
        ...data,
        id: doc.id,
      } as ClientTemplateVariable);
    });

    // Client-side filtering for complex queries
    if (search) {
      const searchLower = search.toLowerCase();
      variables = variables.filter(
        (v) =>
          v.key.toLowerCase().includes(searchLower) ||
          v.label.toLowerCase().includes(searchLower),
      );
    }

    if (templateIds.length > 0) {
      variables = variables.filter((v) =>
        v.templateIds.some((id) => templateIds.includes(id)),
      );
    }

    return json({
      success: true,
      variables,
    });
  } catch (err) {
    console.error("Error fetching client variables:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};

// POST /api/clients/[id]/variables - Create a new variable for a client
export const POST = async ({
  params,
  request,
  locals,
}: {
  params: { id: string };
  request: Request;
  locals: any;
}) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    const user = locals.user;
    if (!user || !user.uid || !user.email) {
      throw error(401, "Unauthorized");
    }

    const clientId = params.id;
    if (!clientId) {
      throw error(400, "Client ID is required");
    }

    const variableData = await request.json();

    // Validate required fields
    if (!variableData.key || !variableData.label || !variableData.type) {
      throw error(400, "Key, label, and type are required");
    }

    if (
      !["text", "number", "date", "currency", "boolean", "image"].includes(
        variableData.type,
      )
    ) {
      throw error(400, "Invalid variable type");
    }

    if (!["system", "custom"].includes(variableData.category)) {
      throw error(400, "Invalid variable category");
    }

    // Check if variable already exists for this client
    const existingQuery = await db
      .collection("clientTemplateVariables")
      .where("clientId", "==", clientId)
      .where("key", "==", variableData.key)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      throw error(409, "Variable with this key already exists for this client");
    }

    const newVariableData = {
      ...variableData,
      clientId,
      companyId: user.companyId, // Assuming this is set in the user object
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
      createdBy: user.uid,
    };

    const docRef = await db
      .collection("clientTemplateVariables")
      .add(newVariableData);

    return json({
      success: true,
      variable: {
        id: docRef.id,
        ...newVariableData,
      },
    });
  } catch (err) {
    console.error("Error creating client variable:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};

// PUT /api/clients/[id]/variables - Update multiple variables (bulk update)
export const PUT = async ({
  params,
  request,
  locals,
}: {
  params: { id: string };
  request: Request;
  locals: any;
}) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    const user = locals.user;
    if (!user || !user.uid || !user.email) {
      throw error(401, "Unauthorized");
    }

    const clientId = params.id;
    if (!clientId) {
      throw error(400, "Client ID is required");
    }

    const updates = await request.json();

    if (!Array.isArray(updates)) {
      throw error(400, "Updates must be an array");
    }

    const results = [];

    for (const update of updates) {
      if (!update.id) {
        results.push({
          id: update.id,
          success: false,
          error: "Variable ID is required",
        });
        continue;
      }

      try {
        const updateData = {
          ...update,
          updatedAt: Timestamp.now() as any,
          lastModifiedBy: user.uid,
        };

        // Remove id from update data
        delete updateData.id;

        await db
          .collection("clientTemplateVariables")
          .doc(update.id)
          .update(updateData);

        results.push({ id: update.id, success: true });
      } catch (updateError) {
        console.error(`Error updating variable ${update.id}:`, updateError);
        results.push({
          id: update.id,
          success: false,
          error:
            updateError instanceof Error
              ? updateError.message
              : "Update failed",
        });
      }
    }

    return json({
      success: true,
      results,
    });
  } catch (err) {
    console.error("Error updating client variables:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};

// DELETE /api/clients/[id]/variables - Delete multiple variables (bulk delete)
export const DELETE = async ({
  params,
  request,
  locals,
}: {
  params: { id: string };
  request: Request;
  locals: any;
}) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    const user = locals.user;
    if (!user || !user.uid || !user.email) {
      throw error(401, "Unauthorized");
    }

    const clientId = params.id;
    if (!clientId) {
      throw error(400, "Client ID is required");
    }

    const { variableIds } = await request.json();

    if (!Array.isArray(variableIds)) {
      throw error(400, "Variable IDs must be an array");
    }

    const results = [];

    for (const variableId of variableIds) {
      try {
        // Verify the variable belongs to this client
        const variableDoc = await db
          .collection("clientTemplateVariables")
          .doc(variableId)
          .get();
        if (!variableDoc.exists) {
          results.push({
            id: variableId,
            success: false,
            error: "Variable not found",
          });
          continue;
        }

        const variableData = variableDoc.data();
        if (variableData?.clientId !== clientId) {
          results.push({
            id: variableId,
            success: false,
            error: "Variable does not belong to this client",
          });
          continue;
        }

        await db.collection("clientTemplateVariables").doc(variableId).delete();

        results.push({ id: variableId, success: true });
      } catch (deleteError) {
        console.error(`Error deleting variable ${variableId}:`, deleteError);
        results.push({
          id: variableId,
          success: false,
          error:
            deleteError instanceof Error
              ? deleteError.message
              : "Delete failed",
        });
      }
    }

    return json({
      success: true,
      results,
    });
  } catch (err) {
    console.error("Error deleting client variables:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};
