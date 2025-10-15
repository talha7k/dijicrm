import { json, error } from "@sveltejs/kit";
import { db } from "$lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export async function GET({ url }: { url: URL }) {
  try {
    const companyId = url.searchParams.get("companyId");

    if (!companyId) {
      throw error(400, "Company ID is required");
    }

    // Query invitations for this company
    const invitationsRef = collection(db, "invitations");
    const invitationsQuery = query(
      invitationsRef,
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc"),
    );

    const invitationSnapshot = await getDocs(invitationsQuery);
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
    throw error(500, "Failed to fetch invitations");
  }
}
