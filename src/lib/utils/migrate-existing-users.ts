import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Timestamp } from "@firebase/firestore";
import { getAuth, UserRecord } from "firebase-admin/auth";
import { PUBLIC_FIREBASE_PROJECT_ID } from "$env/static/public";
import type { UserProfile } from "$lib/types/user";

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

/**
 * Migration result interface
 */
export interface MigrationResult {
  totalUsers: number;
  migratedUsers: number;
  skippedUsers: number;
  errors: Array<string>;
  migratedUserIds: Array<string>;
}

/**
 * Migrates existing Firebase Auth users to have basic user profiles
 * This is a one-time migration script to run after implementing the auth/onboarding separation
 */
export async function migrateExistingUsers(): Promise<MigrationResult> {
  const result = {
    totalUsers: 0,
    migratedUsers: 0,
    skippedUsers: 0,
    errors: [] as string[],
    migratedUserIds: [] as string[],
  };

  try {
    initializeFirebaseAdmin();

    console.log("Starting migration of existing users...");

    // Get all users from Firebase Auth (this might need pagination for large user bases)
    const users = await getAllUsers();
    result.totalUsers = users.length;

    console.log(`Found ${users.length} total users in Firebase Auth`);

    for (const user of users) {
      try {
        const migrationResult = await migrateUserIfNeeded(user);
        if (migrationResult.migrated) {
          result.migratedUsers++;
          result.migratedUserIds.push(user.uid);
          console.log(`✅ Migrated user: ${user.email} (${user.uid})`);
        } else {
          result.skippedUsers++;
          console.log(
            `⏭️  Skipped user: ${user.email} (${user.uid}) - ${migrationResult.reason}`,
          );
        }
      } catch (error) {
        const errorMsg = `Failed to migrate user ${user.email} (${user.uid}): ${error}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log("\nMigration completed!");
    console.log(`Total users: ${result.totalUsers}`);
    console.log(`Migrated: ${result.migratedUsers}`);
    console.log(`Skipped: ${result.skippedUsers}`);
    console.log(`Errors: ${result.errors.length}`);

    return result;
  } catch (error) {
    console.error("Migration failed:", error);
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
}

/**
 * Gets all users from Firebase Auth (with pagination support)
 */
async function getAllUsers(): Promise<UserRecord[]> {
  const users: UserRecord[] = [];
  let nextPageToken: string | undefined;

  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    users.push(...listUsersResult.users);
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  return users;
}

/**
 * Migration result for individual user
 */
interface UserMigrationResult {
  migrated: boolean;
  reason?: string;
}

/**
 * Migrates a single user if they don't have a profile
 */
async function migrateUserIfNeeded(
  user: UserRecord,
): Promise<UserMigrationResult> {
  // Check if user already has a profile
  const userRef = db.collection("users").doc(user.uid);
  const userSnap = await userRef.get();

  if (userSnap.exists()) {
    return { migrated: false, reason: "Profile already exists" };
  }

  // Check if user has been disabled
  if (user.disabled) {
    return { migrated: false, reason: "User is disabled" };
  }

  // Check if user has a recent sign-in (to avoid migrating inactive users)
  const lastSignInTime = user.metadata.lastSignInTime;
  if (lastSignInTime) {
    const lastSignIn = new Date(lastSignInTime);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (lastSignIn < thirtyDaysAgo) {
      return { migrated: false, reason: "User inactive for 30+ days" };
    }
  }

  // Create a basic profile for the user
  const basicProfile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    isActive: !user.disabled,
    lastLoginAt: user.metadata.lastSignInTime
      ? Timestamp.fromDate(new Date(user.metadata.lastSignInTime))
      : Timestamp.now(),
    createdAt: user.metadata.creationTime
      ? Timestamp.fromDate(new Date(user.metadata.creationTime))
      : Timestamp.now(),
    updatedAt: Timestamp.now(),
    emailNotifications: true,
    pushNotifications: false,
    theme: "system",
    language: "en",
    role: "client", // Default to client role
    permissions: [],
    companyAssociations: [], // Will be empty - user needs to complete onboarding
    currentCompanyId: undefined, // Will be set during onboarding
    metadata: {
      accountStatus: "active",
    },
    onboardingCompleted: false, // Force onboarding completion
  };

  // Save the profile
  await userRef.set(basicProfile);

  return { migrated: true };
}

/**
 * Validates that migrated profiles are correct
 */
export async function validateMigration(): Promise<{
  validProfiles: number;
  invalidProfiles: number;
  validationErrors: string[];
}> {
  try {
    initializeFirebaseAdmin();

    const result = {
      validProfiles: 0,
      invalidProfiles: 0,
      validationErrors: [] as string[],
    };

    // Get all user profiles
    const profilesSnap = await db.collection("users").get();

    for (const doc of profilesSnap.docs) {
      const profile = doc.data() as UserProfile;

      // Basic validation
      if (!profile.uid || !profile.email || !profile.role) {
        result.invalidProfiles++;
        result.validationErrors.push(
          `Profile ${doc.id} missing required fields`,
        );
        continue;
      }

      // Check if onboarding is marked as incomplete
      if (profile.onboardingCompleted !== false) {
        result.invalidProfiles++;
        result.validationErrors.push(
          `Profile ${doc.id} should have onboardingCompleted: false`,
        );
        continue;
      }

      result.validProfiles++;
    }

    return result;
  } catch (error) {
    console.error("Validation failed:", error);
    return {
      validProfiles: 0,
      invalidProfiles: 0,
      validationErrors: [`Validation failed: ${error}`],
    };
  }
}

/**
 * Cleans up any invalid profiles created during migration
 */
export async function cleanupInvalidProfiles(): Promise<{
  cleanedProfiles: number;
  errors: string[];
}> {
  try {
    initializeFirebaseAdmin();

    const result = {
      cleanedProfiles: 0,
      errors: [],
    };

    // Get all user profiles
    const profilesSnap = await db.collection("users").get();

    for (const doc of profilesSnap.docs) {
      const profile = doc.data() as UserProfile;

      // Check for invalid profiles (missing required fields)
      if (!profile.uid || !profile.email || !profile.role) {
        await doc.ref.delete();
        result.cleanedProfiles++;
        console.log(`🗑️  Cleaned up invalid profile: ${doc.id}`);
      }
    }

    return result;
  } catch (error) {
    console.error("Cleanup failed:", error);
    return {
      cleanedProfiles: 0,
      errors: [`Cleanup failed: ${error}`],
    };
  }
}
