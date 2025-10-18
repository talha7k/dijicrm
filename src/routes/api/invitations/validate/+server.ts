import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb } from "$lib/firebase-admin";
import type { Invitation } from "$lib/types/invitation";
import type { Company } from "$lib/types/company";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      throw error(400, "Invitation code is required");
    }

    console.log("🔍 Looking for invitation code:", code.toUpperCase());

    // Find invitation by code
    const invitationQuery = await db
      .collection("invitations")
      .where("code", "==", code.toUpperCase())
      .where("status", "==", "active")
      .limit(1)
      .get();

    console.log("📊 Query results:", {
      isEmpty: invitationQuery.empty,
      docsFound: invitationQuery.docs.length,
    });

    if (!invitationQuery.empty) {
      const doc = invitationQuery.docs[0];
      console.log("📋 Found invitation:", {
        id: doc.id,
        code: doc.data().code,
        status: doc.data().status,
        expiresAt: doc.data().expiresAt?.toDate(),
      });
    }

    if (invitationQuery.empty) {
      // Let's check all invitations to debug
      const allInvitations = await db.collection("invitations").get();
      console.log(
        "🔍 All invitations in DB:",
        allInvitations.docs.map((doc) => ({
          id: doc.id,
          code: doc.data().code,
          status: doc.data().status,
        })),
      );
      throw error(404, "Invalid or expired invitation code");
    }

    const invitationDoc = invitationQuery.docs[0];
    const invitationData = invitationDoc.data() as Invitation;
    const invitation: Invitation & { id: string } = {
      id: invitationDoc.id,
      ...invitationData,
    };

    // Check if expired
    const now = new Date();
    const expiresAt = invitation.expiresAt.toDate();

    if (now > expiresAt) {
      // Mark as expired
      await invitationDoc.ref.update({ status: "expired" });
      throw error(410, "Invitation code has expired");
    }

    // Get company info
    const companyDoc = await db
      .collection("companies")
      .doc(invitation.companyId)
      .get();

    if (!companyDoc.exists) {
      throw error(404, "Associated company not found");
    }

    const companyData = companyDoc.data() as Company;
    const company: Company & { id: string } = {
      id: companyDoc.id,
      ...companyData,
    };

    return json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt.toDate().toISOString(),
      },
      company: {
        id: company.id,
        name: company.name,
      },
    });
  } catch (err) {
    console.error("Error validating invitation:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};
