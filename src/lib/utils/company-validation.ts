import type { UserProfile } from "$lib/types/user";

/**
 * Validates if a user has access to a specific company
 */
export function hasCompanyAccess(
  user: UserProfile,
  companyId: string,
): boolean {
  if (!user.companyAssociations) return false;
  return user.companyAssociations.some(
    (assoc) => assoc.companyId === companyId,
  );
}

/**
 * Gets the user's role in a specific company
 */
export function getCompanyRole(
  user: UserProfile,
  companyId: string,
): "member" | "admin" | "owner" | null {
  if (!user.companyAssociations) return null;
  const association = user.companyAssociations.find(
    (assoc) => assoc.companyId === companyId,
  );
  return association?.role || null;
}

/**
 * Checks if user is an admin or owner in the company
 */
export function isCompanyAdmin(user: UserProfile, companyId: string): boolean {
  const role = getCompanyRole(user, companyId);
  return role === "admin" || role === "owner";
}

/**
 * Gets the active company ID for a user
 * Falls back to the first company association if no currentCompanyId is set
 */
export function getActiveCompanyId(user: UserProfile): string | null {
  if (user.currentCompanyId && hasCompanyAccess(user, user.currentCompanyId)) {
    return user.currentCompanyId;
  }
  return user.companyAssociations?.[0]?.companyId || null;
}

/**
 * Validates that data belongs to the user's active company
 */
export function validateCompanyDataAccess(
  user: UserProfile,
  dataCompanyId: string,
): boolean {
  const activeCompanyId = getActiveCompanyId(user);
  return activeCompanyId === dataCompanyId;
}
