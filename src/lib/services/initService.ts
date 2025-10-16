import { get } from "svelte/store";
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth } from "$lib/firebase";
import { userProfile } from "$lib/stores/user";
import { companyContext, initializeFromUser } from "$lib/stores/companyContext";
import { handlePostAuthentication } from "$lib/services/authService";
import { app } from "$lib/stores/app";
import { goto } from "$app/navigation";

let initializationPromise: Promise<void> | null = null;

function initialize(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check persisted stores first for instant loading
    const persistedProfile = get(userProfile);
    const persistedCompany = get(companyContext);

    // Set initial state based on persisted data
    if (persistedProfile.data && persistedCompany.data) {
      app.set({
        initializing: false, // No need to initialize if we have data
        authenticated: true,
        profileReady: true,
        companyReady: true,
        error: null,
      });
      resolve();
      return;
    }

    app.set({
      initializing: true,
      authenticated: false,
      profileReady: false,
      companyReady: false,
      error: null,
    });

    onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          app.update((s) => ({ ...s, authenticated: true }));

          // Only fetch if we don't have persisted data
          if (!persistedProfile.data) {
            await handlePostAuthentication(user);
          }

          const profile = get(userProfile);
          if (profile.data) {
            app.update((s) => ({ ...s, profileReady: true }));

            // Check if onboarding is completed
            if (!profile.data.onboardingCompleted) {
              app.update((s) => ({
                ...s,
                initializing: false,
                companyReady: false,
              }));
              goto("/onboarding");
              return;
            }

            // Only initialize company if we don't have persisted data
            if (!persistedCompany.data) {
              await initializeFromUser();
            }

            const company = get(companyContext);
            if (company.data) {
              app.update((s) => ({ ...s, companyReady: true }));
            } else if (company.error) {
              // Check if the error is due to no company associations
              if (company.error.includes("No company associations found")) {
                // Redirect to onboarding for users without company access
                app.update((s) => ({
                  ...s,
                  initializing: false,
                  companyReady: false,
                }));
                goto("/onboarding");
                return;
              }
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
