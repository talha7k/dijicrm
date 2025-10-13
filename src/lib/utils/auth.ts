import { userProfile } from "$lib/stores/user";
import { get } from "svelte/store";
import { goto } from "$app/navigation";

/**
 * Check if the current user has the required role
 */
export function hasRole(requiredRole: "client" | "company"): boolean {
  const user = get(userProfile);
  return user.data?.role === requiredRole;
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
