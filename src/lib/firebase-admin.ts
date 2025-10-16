import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

const PUBLIC_FIREBASE_PROJECT_ID = process.env.PUBLIC_FIREBASE_PROJECT_ID;

let adminApp: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function initializeFirebaseAdmin() {
  if (adminApp) return; // Already initialized

  let credential;

  // Try to get service account from environment variable
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      credential = cert({
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
        projectId: serviceAccount.project_id,
      });
    } catch (parseError) {
      console.error(
        "Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:",
        parseError,
      );
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY format");
    }
  } else {
    console.warn(
      "FIREBASE_SERVICE_ACCOUNT_KEY not found, using application default credentials",
    );
    credential = applicationDefault();
  }

  adminApp = initializeApp({
    credential,
    projectId: PUBLIC_FIREBASE_PROJECT_ID,
  });
  db = getFirestore(adminApp);
  auth = getAuth(adminApp);
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
