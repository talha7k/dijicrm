import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { PUBLIC_FIREBASE_PROJECT_ID } from "$env/static/public";
import type { Company } from "$lib/types/company";

// Initialize Firebase Admin if not already initialized
let adminApp: any;
let db: any;
let auth: any;

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
    auth = getAuth(adminApp);
  } else {
    db = getFirestore();
    auth = getAuth();
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    initializeFirebaseAdmin();

    // Get current user from Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw error(401, "Unauthorized");
    }

    const token = authHeader.substring(7);
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (err) {
      throw error(401, "Invalid token");
    }

    const user = decodedToken;

    const { name, description } = await request.json();

    if (!name || typeof name !== "string") {
      throw error(400, "Company name is required");
    }

    // Generate unique company code
    let code = generateCompanyCode();

    // Check if code is unique
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
      const existing = await db
        .collection("companies")
        .where("code", "==", code)
        .limit(1)
        .get();
      codeExists = !existing.empty;
      if (codeExists) {
        code = generateCompanyCode();
      }
      attempts++;
    }

    if (codeExists) {
      throw error(500, "Failed to generate unique company code");
    }

    const companyData: Company = {
      name: name.trim(),
      code,
      description: description?.trim(),
      ownerId: user.uid,
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
      settings: {
        timezone: "UTC",
        currency: "USD",
        language: "en",
        emailNotifications: true,
      },
      isActive: true,
      memberCount: 1, // Owner is the first member
    };

    const companyRef = await db.collection("companies").add(companyData);

    return json({
      success: true,
      company: {
        id: companyRef.id,
        name: companyData.name,
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
    console.error("Error creating company:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};

function generateCompanyCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
