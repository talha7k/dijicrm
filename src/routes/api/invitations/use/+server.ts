import { json, error } from "@sveltejs/kit";
import { getDb } from "$lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export async function POST({
  request,
  locals,
}: {
  request: Request;
  locals: any;
}) {
  try {
    // Get current user from locals (set by auth hooks)
    const user = locals.user;
    if (!user || !user.uid) {
      throw error(401, "Unauthorized");
    }

    const { token, usedBy, companyId } = await request.json();

    if (!token || !usedBy || !companyId) {
      throw error(400, "Token, usedBy, and companyId are required");
    }

    if (!token || !usedBy) {
      throw error(400, "Token and usedBy are required");
    }

    // Find invitation by token and company
    const db = getDb();
    if (!db) throw new Error("Database not initialized");
    const invitationsRef = db.collection("invitations");
    const invitationSnapshot = await invitationsRef
      .where("code", "==", token)
      .where("status", "==", "pending")
      .where("companyId", "==", companyId)
      .limit(1)
      .get();

    if (invitationSnapshot.empty) {
      throw error(404, "Invitation not found or already used");
    }

    const invitationDoc = invitationSnapshot.docs[0];
    const invitationData = invitationDoc.data();

    // Check if invitation has expired
    const expiresAt = invitationData.expiresAt.toDate();
    if (expiresAt < new Date()) {
      await invitationDoc.ref.update({ status: "expired" });
      throw error(410, "Invitation has expired");
    }

    // Mark invitation as used
    await invitationDoc.ref.update({
      status: "used",
      usedBy: usedBy,
      usedAt: Timestamp.now(),
    });

    return json({
      success: true,
      message: "Invitation marked as used",
    });
  } catch (err) {
    console.error("Error using invitation:", err);

    if (err instanceof Error) {
      if (err.message.includes("Invitation not found")) {
        throw error(404, err.message);
      }
      if (err.message.includes("expired")) {
        throw error(410, err.message);
      }
    }

    throw error(500, "Failed to use invitation");
  }
}
