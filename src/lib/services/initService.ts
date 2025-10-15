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
          await handlePostAuthentication(user);
          const profile = get(userProfile);
          if (profile.data) {
            app.update((s) => ({ ...s, profileReady: true }));
            await initializeFromUser();
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
