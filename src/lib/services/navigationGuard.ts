import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { app } from "$lib/stores/app";

let hasInitialized = false;
let redirectTimer: any = null;

/**
 * Set up navigation guards to redirect users based on app state
 */
export function setupNavigationGuards() {
  if (!browser) return; // Only run in browser

  let unsubscribe = app.subscribe((state) => {
    // If user is authenticated but company is not ready and there's an error,
    // redirect to onboarding after initialization is complete
    if (
      state.authenticated &&
      !state.companyReady &&
      state.error &&
      !state.initializing
    ) {
      console.log(
        "Redirecting to onboarding due to company context error:",
        state.error,
      );
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
      redirectTimer = setTimeout(() => {
        goto("/onboarding");
      }, 1500); // Slight delay to show error message before redirecting
      return;
    }

    // Mark initialization as complete when initializing changes from true to false
    if (state.initializing === false && !hasInitialized) {
      hasInitialized = true;
    }
  });

  // Clean up timer on unsubscribe
  return () => {
    unsubscribe();
    if (redirectTimer) {
      clearTimeout(redirectTimer);
    }
  };
}
