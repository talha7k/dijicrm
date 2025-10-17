import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { app } from "$lib/stores/app";
import { userProfile } from "$lib/stores/user";
import {
  companyContextData,
  initializeFromUser,
} from "$lib/stores/companyContext";
import { get } from "svelte/store";

let hasCheckedAuthState = false;

/**
 * Set up navigation guards that run before each route change
 */
export async function handleNavigate() {
  if (!browser) return; // Only run in browser

  // Only run after initial check to prevent infinite loops
  if (!hasCheckedAuthState) {
    hasCheckedAuthState = true;

    // Check authentication state and redirect if needed
    const appState = get(app);
    const userState = get(userProfile);
    const companyState = get(companyContextData);

    // If user is authenticated but doesn't have company context, try to initialize
    if (appState.authenticated && !appState.companyReady) {
      try {
        await initializeFromUser();
      } catch (error) {
        // If initialization fails, redirect to onboarding
        console.log(
          "Company context initialization failed, redirecting to onboarding",
        );
        setTimeout(() => {
          goto("/onboarding");
        }, 0);
      }
    }
  }
}

// For client-side navigation guard, we'll listen to store changes in the layout
// rather than using a global navigation hook
