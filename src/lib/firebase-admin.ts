import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { SERVICE_ACCOUNT_KEY } from "$env/static/private";
import { PUBLIC_FIREBASE_PROJECT_ID } from "$env/static/public";

let adminApp: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function initializeFirebaseAdmin() {
  if (adminApp) return; // Already initialized

  try {
    const serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY);
    console.log(
      "Initializing Firebase Admin with service account:",
      serviceAccount.client_email,
    );
    const credential = cert({
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
      projectId: serviceAccount.project_id,
    });

    adminApp = initializeApp({
      credential,
      projectId: PUBLIC_FIREBASE_PROJECT_ID,
    });

    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    // You might want to throw an error here or handle it gracefully
  }
}
/**
 * Get Firestore database instance
 * Initializes Firebase Admin if not already done
 */
export function getDb() {
  if (!db) {
    initializeFirebaseAdmin();
  }
  return db;
}

/**
 * Get Firebase Auth instance
 * Initializes Firebase Admin if not already done
 */
export function getAuthAdmin() {
  if (!auth) {
    initializeFirebaseAdmin();
  }
  return auth;
}

/**
 * Get Firebase Admin app instance
 * Initializes Firebase Admin if not already done
 */
export function getAdminApp() {
  if (!adminApp) {
    initializeFirebaseAdmin();
  }
  return adminApp;
}
