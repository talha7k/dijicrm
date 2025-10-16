import { getDb } from "$lib/firebase-admin";
import type { UserProfile } from "$lib/types/user";

/**
 * Server-side company validation utilities
 */

/**
 * Validates if a user has access to a specific company by checking Firestore
 */
export async function validateCompanyAccess(
  userId: string,
  companyId: string,
): Promise<boolean> {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    console.log(`Checking access for user ${userId} to company ${companyId}`);

    // Check if user is a member of the company
    const memberDoc = await db
      .collection("companyMembers")
      .where("userId", "==", userId)
      .where("companyId", "==", companyId)
      .limit(1)
      .get();

    const hasAccess = !memberDoc.empty;
    console.log(`User ${userId} access to company ${companyId}: ${hasAccess}`);

    if (!hasAccess) {
      // Let's check what companies this user actually has access to
      const allUserMemberships = await db
        .collection("companyMembers")
        .where("userId", "==", userId)
        .get();

      console.log(
        `User ${userId} has access to companies:`,
        allUserMemberships.docs.map((doc) => doc.data().companyId),
      );

      // Also check the user's profile to see what company they should be associated with
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData) {
          console.log(`User ${userId} profile:`, {
            currentCompanyId: userData.currentCompanyId,
            companyAssociations: userData.companyAssociations,
            role: userData.role,
          });
        }
      } else {
        console.log(`User ${userId} profile not found in users collection`);
      }
    }

    return hasAccess;
  } catch (error) {
    console.error("Error validating company access:", error);
    return false;
  }
}

/**
 * Gets the user's role in a specific company from Firestore
 */
export async function getUserCompanyRole(
  userId: string,
  companyId: string,
): Promise<"member" | "admin" | "owner" | null> {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not initialized");

    const memberDoc = await db
      .collection("companyMembers")
      .where("userId", "==", userId)
      .where("companyId", "==", companyId)
      .limit(1)
      .get();

    if (memberDoc.empty) {
      return null;
    }

    const memberData = memberDoc.docs[0].data();
    return memberData.role || "member";
  } catch (error) {
    console.error("Error getting user company role:", error);
    return null;
  }
}

/**
 * Checks if user is an admin or owner in the company
 */
export async function isCompanyAdmin(
  userId: string,
  companyId: string,
): Promise<boolean> {
  const role = await getUserCompanyRole(userId, companyId);
  return role === "admin" || role === "owner";
}

/**
 * Validates that a resource belongs to the user's company
 * This should be used for all data access operations
 */
export async function validateResourceOwnership(
  userId: string,
  resourceCompanyId: string,
): Promise<boolean> {
  return validateCompanyAccess(userId, resourceCompanyId);
}

/**
 * Ensures user has access to company and throws error if not
 */
export async function requireCompanyAccess(
  userId: string,
  companyId: string,
  action: string = "perform this action",
): Promise<void> {
  const hasAccess = await validateCompanyAccess(userId, companyId);
  if (!hasAccess) {
    throw new Error(
      `User ${userId} does not have access to company ${companyId} to ${action}`,
    );
  }
}

/**
 * Ensures user is admin/owner and throws error if not
 */
export async function requireCompanyAdmin(
  userId: string,
  companyId: string,
  action: string = "perform this action",
): Promise<void> {
  const isAdmin = await isCompanyAdmin(userId, companyId);
  if (!isAdmin) {
    throw new Error(
      `User ${userId} is not an admin of company ${companyId} to ${action}`,
    );
  }
}
