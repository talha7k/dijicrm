import { json, error } from "@sveltejs/kit";
import { getDb } from "$lib/firebase-admin";
import { requireCompanyAccess } from "$lib/utils/server-company-validation";

export async function GET({ url, locals }: { url: URL; locals: any }) {
  try {
    // Get user from locals (set by auth hooks)
    const user = locals.user;
    if (!user || !user.uid) {
      throw error(401, "Unauthorized");
    }

    const companyId = url.searchParams.get("companyId");

    if (!companyId) {
      throw error(400, "Company ID is required");
    }

    // Validate user has access to the company
    await requireCompanyAccess(user.uid, companyId, "view invitations");

    // Query invitations for this company
    const db = getDb();
    if (!db) throw new Error("Database not initialized");
    const invitationsRef = db.collection("invitations");
    const invitationsQuery = invitationsRef
      .where("companyId", "==", companyId)
      .orderBy("createdAt", "desc");

    const invitationSnapshot = await invitationsQuery.get();
    const invitations = invitationSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate(),
      usedAt: doc.data().usedAt?.toDate(),
    }));

    return json({ invitations });
  } catch (err) {
    console.error("Error fetching invitations:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Failed to fetch invitations");
  }
}
