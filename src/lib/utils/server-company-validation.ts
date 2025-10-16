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

    // Check if user is a member of the company
    const memberDoc = await db
      .collection("companyMembers")
      .where("userId", "==", userId)
      .where("companyId", "==", companyId)
      .limit(1)
      .get();

    return !memberDoc.empty;
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
