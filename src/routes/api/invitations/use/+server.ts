import { json, error } from "@sveltejs/kit";
import { db } from "$lib/firebase";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function POST({ request }: { request: Request }) {
  try {
    const { token, usedBy } = await request.json();

    if (!token || !usedBy) {
      throw error(400, "Token and usedBy are required");
    }

    // Find invitation by token
    const invitationsRef = collection(db, "invitations");
    const invitationQuery = query(
      invitationsRef,
      where("code", "==", token),
      where("status", "==", "pending"),
      limit(1),
    );
    const invitationSnapshot = await getDocs(invitationQuery);

    if (invitationSnapshot.empty) {
      throw error(404, "Invitation not found or already used");
    }

    const invitationDoc = invitationSnapshot.docs[0];
    const invitationData = invitationDoc.data();

    // Check if invitation has expired
    const expiresAt = invitationData.expiresAt.toDate();
    if (expiresAt < new Date()) {
      await updateDoc(invitationDoc.ref, { status: "expired" });
      throw error(410, "Invitation has expired");
    }

    // Mark invitation as used
    await updateDoc(invitationDoc.ref, {
      status: "used",
      usedBy: usedBy,
      usedAt: serverTimestamp(),
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
