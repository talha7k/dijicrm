import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PUBLIC_FIREBASE_PROJECT_ID } from "$env/static/public";
import type { Invitation } from "$lib/types/invitation";
import type { Company } from "$lib/types/company";

// Initialize Firebase Admin if not already initialized
let adminApp: any;
let db: any;

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const isProduction = process.env.NODE_ENV === "production";
    let credential;

    if (isProduction) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKey) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set",
        );
      }
      const serviceAccount = JSON.parse(serviceAccountKey);
      credential = cert({
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
        projectId: serviceAccount.project_id,
      });
    } else {
      credential = applicationDefault();
    }

    adminApp = initializeApp({
      credential,
      projectId: PUBLIC_FIREBASE_PROJECT_ID,
    });
    db = getFirestore(adminApp);
  } else {
    db = getFirestore();
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    initializeFirebaseAdmin();

    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      throw error(400, "Invitation code is required");
    }

    // Find invitation by code
    const invitationQuery = await db
      .collection("invitations")
      .where("code", "==", code.toUpperCase())
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (invitationQuery.empty) {
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
