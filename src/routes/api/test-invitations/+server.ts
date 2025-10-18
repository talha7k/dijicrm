import { json } from "@sveltejs/kit";
import { getDb } from "$lib/firebase-admin";

export async function GET() {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    console.log("🔍 Testing invitations collection...");

    // Get all invitations without filtering
    const invitationsRef = db.collection("invitations");
    const allInvitations = await invitationsRef.get();

    console.log(
      `📊 Total invitations in database: ${allInvitations.docs.length}`,
    );

    const invitations = allInvitations.docs.map((doc) => {
      const data = doc.data();
      console.log(`📋 Invitation ${doc.id}:`, {
        companyId: data.companyId,
        email: data.email,
        role: data.role,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
      });
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
        usedAt: data.usedAt?.toDate(),
      };
    });

    return json({
      total: invitations.length,
      invitations,
    });
  } catch (err) {
    console.error("❌ Error testing invitations:", err);
    return json({ error: "Failed to test invitations" }, { status: 500 });
  }
}
