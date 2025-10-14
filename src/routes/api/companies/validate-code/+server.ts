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
      throw error(400, "Company code is required");
    }

    // Find company by code
    const companyQuery = await db
      .collection("companies")
      .where("code", "==", code.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (companyQuery.empty) {
      throw error(404, "Invalid company code");
    }

    const companyDoc = companyQuery.docs[0];
    const companyData = companyDoc.data() as Company;
    const company: Company & { id: string } = {
      id: companyDoc.id,
      ...companyData,
    };

    return json({
      valid: true,
      company: {
        id: company.id,
        name: company.name,
        description: company.description,
      },
    });
  } catch (err) {
    console.error("Error validating company code:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};
