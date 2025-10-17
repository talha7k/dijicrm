import { authStore, AuthStatus } from "$lib/services/authService";
import { companyContext, activeCompanyId } from "$lib/stores/companyContext";
import { get } from "svelte/store";
import { goto } from "$app/navigation";
import { isProfileComplete } from "$lib/services/profileValidationService";

/**
 * Check if the current user has the required role
 */
export function hasRole(requiredRole: "client" | "company"): boolean {
  const auth = get(authStore);
  return auth.profile?.role === requiredRole;
}

/**
 * Check if the current user is a client
 */
export function isClient(): boolean {
  return hasRole("client");
}

/**
 * Check if the current user is a company
 */
export function isCompany(): boolean {
  return hasRole("company");
}

/**
 * Redirect user to their appropriate dashboard based on role
 */
export function redirectToDashboard(): void {
  if (isClient()) {
    goto("/client-dashboard");
  } else if (isCompany()) {
    goto("/dashboard");
  } else {
    // Default to company dashboard if role is undefined
    goto("/dashboard");
  }
}

/**
 * Guard function for client-only routes
 */
export function requireClient(): boolean {
  if (!isClient()) {
    goto("/dashboard");
    return false;
  }
  return true;
}

/**
 * Guard function for company-only routes
 */
export function requireCompany(): boolean {
  if (!isCompany()) {
    goto("/client-dashboard");
    return false;
  }
  return true;
}

/**
 * Guard function for complete profile requirement
 */
export function requireCompleteProfile(): boolean {
  const auth = get(authStore);
  if (!auth.profile || !isProfileComplete(auth.profile)) {
    goto("/onboarding");
    return false;
  }
  return true;
}

/**
 * Redirect user to onboarding page
 */
export function redirectToOnboarding(): void {
  goto("/onboarding");
}

/**
 * Check if current user has a complete profile
 */
export function hasCompleteProfile(): boolean {
  const auth = get(authStore);
  return auth.profile ? isProfileComplete(auth.profile) : false;
}

/**
 * Get current user's profile completeness status
 */
export function getProfileStatus(): {
  exists: boolean;
  isComplete: boolean;
  isLoading: boolean;
  error: any;
} {
  const auth = get(authStore);
  return {
    exists: auth.profile !== null && auth.profile !== undefined,
    isComplete: auth.profile ? isProfileComplete(auth.profile) : false,
    isLoading: auth.status === AuthStatus.AUTHENTICATING,
    error: auth.error,
  };
}

/**
 * Check if user has an active company context
 */
export function hasActiveCompany(): boolean {
  const companyId = get(activeCompanyId);
  const context = get(companyContext);
  return !!(companyId && context.data && !context.loading && !context.error);
}

/**
 * Guard function for routes that require active company context
 */
export function requireActiveCompany(): boolean {
  if (!hasActiveCompany()) {
    goto("/account");
    return false;
  }
  return true;
}
