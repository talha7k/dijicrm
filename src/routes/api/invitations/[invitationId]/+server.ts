import { json, error } from "@sveltejs/kit";
import { getDb } from "$lib/firebase-admin";
import { requireCompanyAccess } from "$lib/utils/server-company-validation";
import { Timestamp } from "firebase-admin/firestore";

export async function DELETE({ params, locals, url }: { params: { invitationId: string }; locals: any; url: URL }) {
  try {
    // Get user from locals (set by auth hooks)
    const user = locals.user;
    if (!user || !user.uid) {
      throw error(401, "Unauthorized");
    }

    const { invitationId } = params;
    const hardDelete = url.searchParams.get("hard") === "true";

    if (!invitationId) {
      throw error(400, "Invitation ID is required");
    }

    // Get the invitation to verify company access
    const db = getDb();
    if (!db) throw new Error("Database not initialized");
    
    const invitationDoc = await db.collection("invitations").doc(invitationId).get();
    
    if (!invitationDoc.exists) {
      throw error(404, "Invitation not found");
    }

    const invitationData = invitationDoc.data();
    
    if (!invitationData) {
      throw error(404, "Invitation data not found");
    }

    // Validate user has access to the company
    await requireCompanyAccess(user.uid, invitationData.companyId, "manage invitations");

    if (hardDelete) {
      // Hard delete - completely remove the invitation
      await invitationDoc.ref.delete();
      
      return json({
        success: true,
        message: "Invitation deleted permanently",
        hardDelete: true,
      });
    } else {
      // Soft delete - mark as revoked (expired)
      // Check if invitation is already used or expired
      if (invitationData.status === "used") {
        throw error(400, "Cannot revoke an already used invitation");
      }

      if (invitationData.status === "expired") {
        throw error(400, "Invitation is already expired");
      }

      // Mark invitation as revoked (expired)
      await invitationDoc.ref.update({
        status: "expired",
        updatedAt: Timestamp.now(),
      });

      return json({
        success: true,
        message: "Invitation revoked successfully",
        hardDelete: false,
      });
    }
  } catch (err) {
    console.error("Error managing invitation:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to manage invitation");
  }
}