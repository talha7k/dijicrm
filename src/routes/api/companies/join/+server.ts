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
import type { CompanyMember } from "$lib/types/companyMember";

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

    const { companyCode, role = "member" } = await request.json();

    if (!companyCode || typeof companyCode !== "string") {
      throw error(400, "Company code is required");
    }

    // Find company by code
    const companyQuery = await db
      .collection("companies")
      .where("code", "==", companyCode.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (companyQuery.empty) {
      throw error(404, "Invalid company code");
    }

    const companyDoc = companyQuery.docs[0];
    const companyData = companyDoc.data() as Company;
    const companyId = companyDoc.id;

    // Check if user is already a member
    const existingMemberQuery = await db
      .collection("companyMembers")
      .where("userId", "==", user.uid)
      .where("companyId", "==", companyId)
      .limit(1)
      .get();

    if (!existingMemberQuery.empty) {
      throw error(409, "User is already a member of this company");
    }

    // Create company member record
    const memberData: CompanyMember = {
      userId: user.uid,
      companyId,
      role: role as "member" | "admin" | "owner",
      joinedAt: Timestamp.now() as any,
      status: "active",
      permissions: [], // Default permissions
    };

    await db.collection("companyMembers").add(memberData);

    // Update company member count
    await companyDoc.ref.update({
      memberCount: companyData.memberCount + 1,
      updatedAt: Timestamp.now(),
    });

    return json({
      success: true,
      company: {
        id: companyId,
        name: companyData.name,
        code: companyData.code,
      },
      membership: {
        role,
        joinedAt: Timestamp.now().toDate().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error joining company:", err);
    if (err instanceof Error && "status" in err) {
      throw err;
    }
    throw error(500, "Internal server error");
  }
};
