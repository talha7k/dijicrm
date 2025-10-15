import { get } from "svelte/store";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "$lib/firebase";
import { userProfile } from "$lib/stores/user";
import { companyContext, initializeFromUser } from "$lib/stores/companyContext";
import { handlePostAuthentication } from "$lib/services/authService";
import { app } from "$lib/stores/app";

let initializationPromise: Promise<void> | null = null;

function initialize(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if we already have cached data
    const cachedProfile = get(userProfile);
    const cachedCompany = get(companyContext);

    // Set initial state based on cached data
    if (cachedProfile.data && !cachedProfile.loading) {
      app.set({
        initializing: true,
        authenticated: true,
        profileReady: true,
        companyReady: cachedCompany.data ? true : false,
        error: null,
      });
    } else {
      app.set({
        initializing: true,
        authenticated: false,
        profileReady: false,
        companyReady: false,
        error: null,
      });
    }

    onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          app.update((s) => ({ ...s, authenticated: true }));

          // Only fetch profile if we don't have valid cached data
          if (!cachedProfile.data || cachedProfile.loading) {
            await handlePostAuthentication(user);
          }

          const profile = get(userProfile);
          if (profile.data) {
            app.update((s) => ({ ...s, profileReady: true }));

            // Only initialize company if we don't have valid cached data
            if (!cachedCompany.data || cachedCompany.loading) {
              await initializeFromUser();
            }

            const company = get(companyContext);
            if (company.data) {
              app.update((s) => ({ ...s, companyReady: true }));
            }
          }
        } else {
          app.set({
            initializing: false,
            authenticated: false,
            profileReady: false,
            companyReady: false,
            error: null,
          });
        }
        app.update((s) => ({ ...s, initializing: false }));
        resolve();
      } catch (error) {
        app.update((s) => ({
          ...s,
          initializing: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        reject(error);
      }
    });
  });
}

export function initializeApp(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initialize();
  }
  return initializationPromise;
}

export function resetInitialization(): void {
  initializationPromise = null;
}
