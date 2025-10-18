import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb, getAuthAdmin } from "$lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");
    const auth = getAuthAdmin();
    if (!auth) throw new Error("Auth not initialized");

    // Get current user from locals (set by auth hooks)
    const user = locals.user;
    if (!user || !user.uid || !user.email) {
      throw error(401, "Unauthorized");
    }

    const companyId = params.id;
    if (!companyId) {
      throw error(400, "Company ID is required");
    }

    // Get the request body
    const updateData = await request.json();
    console.log("Update data received:", updateData);

    // Check if user has permission to update this company
    const memberDoc = await db
      .collection(`companies/${companyId}/members`)
      .where("userId", "==", user.uid)
      .where("status", "==", "active")
      .limit(1)
      .get();

    let hasPermission = false;

    if (memberDoc.empty) {
      console.log(
        `No company member record found for user ${user.uid} in company ${companyId}`,
      );

      // Check if user is the company owner as a fallback
      const companyDoc = await db.collection("companies").doc(companyId).get();
      if (companyDoc.exists) {
        const companyData = companyDoc.data();
        if (companyData?.ownerId === user.uid) {
          console.log(
            `User ${user.uid} is the owner of company ${companyId}, allowing update`,
          );
          hasPermission = true;
        } else {
          throw error(403, "You don't have permission to update this company");
        }
      } else {
        throw error(403, "You don't have permission to update this company");
      }
    } else {
      const memberData = memberDoc.docs[0].data();
      console.log(`Found member record:`, {
        userId: memberData.userId,
        companyId: memberData.companyId,
        permissions: memberData.permissions,
      });

      // Check for permissions - support both legacy and scoped permissions
      const hasCompanyWritePermission = memberData.permissions.some(
        (permission: string) => {
          return (
            permission === "write" ||
            permission === "admin" ||
            permission === "write:company" ||
            permission === "admin:company" ||
            permission.startsWith("write:*") ||
            permission.startsWith("admin:*")
          );
        },
      );

      if (hasCompanyWritePermission) {
        hasPermission = true;
      } else {
        console.log(
          `User ${user.uid} lacks required permissions for company ${companyId}`,
        );
        throw error(
          403,
          "You don't have permission to update company settings",
        );
      }
    }

    if (!hasPermission) {
      throw error(403, "You don't have permission to update this company");
    }

    // Get current company data
    const companyRef = db.collection("companies").doc(companyId);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) {
      throw error(404, "Company not found");
    }

    const currentCompany = companyDoc.data();
    if (!currentCompany) {
      throw error(404, "Company data not found");
    }

    // Prepare update data
    const updates: any = {
      updatedAt: Timestamp.now() as any,
    };

    // Handle settings updates
    if (updateData.settings) {
      updates.settings = {
        ...currentCompany.settings,
        ...updateData.settings,
      };
    }

    // Handle other top-level updates (if needed)
    if (updateData.name) {
      updates.name = updateData.name.trim();
    }

    if (updateData.vatNumber !== undefined) {
      updates.vatNumber = updateData.vatNumber;
    }

    if (updateData.description !== undefined) {
      updates.description = updateData.description?.trim() || null;
    }

    console.log("Updates object to apply:", updates);

    // Update the company document
    try {
      await companyRef.update(updates);
      console.log("Company document updated successfully");
    } catch (error) {
      console.error("Failed to update company document:", error);
      throw error;
    }

    // Return updated company data
    const updatedCompany = await companyRef.get();
    const updatedData = updatedCompany.data();

    if (!updatedData) {
      throw error(500, "Failed to retrieve updated company data");
    }

    console.log("Updated company data from DB:", updatedData);

    return json({
      success: true,
      company: {
        id: updatedCompany.id,
        name: updatedData.name,
        vatNumber: updatedData.vatNumber,
        code: updatedData.code,
        description: updatedData.description,
        ownerId: updatedData.ownerId,
        createdAt: updatedData.createdAt.toDate().toISOString(),
        updatedAt: updatedData.updatedAt.toDate().toISOString(),
        settings: updatedData.settings,
        isActive: updatedData.isActive,
        memberCount: updatedData.memberCount,
      },
    });
  } catch (err) {
    console.error("Error updating company:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    const user = locals.user;
    if (!user || !user.uid || !user.email) {
      throw error(401, "Unauthorized");
    }

    const companyId = params.id;
    if (!companyId) {
      throw error(400, "Company ID is required");
    }

    // Check if user has permission to view this company
    const memberDoc = await db
      .collection(`companies/${companyId}/members`)
      .where("userId", "==", user.uid)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (memberDoc.empty) {
      throw error(403, "You don't have permission to view this company");
    }

    // Get company data
    const companyDoc = await db.collection("companies").doc(companyId).get();

    if (!companyDoc.exists) {
      throw error(404, "Company not found");
    }

    const companyData = companyDoc.data();
    if (!companyData) {
      throw error(404, "Company data not found");
    }

    return json({
      success: true,
      company: {
        id: companyDoc.id,
        name: companyData.name,
        vatNumber: companyData.vatNumber,
        code: companyData.code,
        description: companyData.description,
        ownerId: companyData.ownerId,
        createdAt: companyData.createdAt.toDate().toISOString(),
        updatedAt: companyData.updatedAt.toDate().toISOString(),
        settings: companyData.settings,
        isActive: companyData.isActive,
        memberCount: companyData.memberCount,
      },
    });
  } catch (err) {
    console.error("Error fetching company:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};
