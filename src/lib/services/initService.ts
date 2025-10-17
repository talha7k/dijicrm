import { app } from "$lib/stores/app";
import { userProfile } from "$lib/stores/user";
import { companyContext } from "$lib/stores/companyContext";
import type { UserProfile } from "$lib/types/user";
import type { Company } from "$lib/types/company";
import type { CompanyMember } from "$lib/types/companyMember";

let initializationPromise: Promise<void> | null = null;

// Initialize with server-side data that was passed down
type ServerSessionData = {
  profile: UserProfile;
  company: Company;
  membership: CompanyMember;
};

export function initializeAppFromServerData(data: ServerSessionData): void {
  // Set initial app state - use server-provided data as truth since server validation passed
  app.set({
    initializing: false,
    authenticated: true,
    profileReady: true,
    companyReady: true, // Server validated this, so assume true initially
    error: null,
  });

  // Set the user profile data
  userProfile.set({
    data: data.profile,
    loading: false,
    error: null,
    update: async () => {}, // This will be replaced with actual update function if needed
  });

  // Set the company context data based on server-provided information
  import("$lib/stores/companyContext").then(async ({ companyContextData }) => {
    companyContextData.set({
      data: {
        companyId: data.profile.currentCompanyId || data.company.code,
        company: data.company,
        role: data.membership.role,
        permissions: data.membership.permissions,
      },
      loading: false,
      error: null,
    });

    // After setting up the data, perform background validation to catch any inconsistencies
    // but don't let validation failures immediately break the user experience
    try {
      // Small delay to ensure store updates are processed
      await new Promise((resolve) => setTimeout(resolve, 100));
      const { initializeFromUser } = await import("$lib/stores/companyContext");
      await initializeFromUser();
      // If successful, companyReady will already be true from the initial set
    } catch (validationError) {
      console.warn(
        "Background company validation failed after initialization:",
        validationError,
      );
      // Don't set error state for background validation failures - the server-side data is already valid
      // Just log the warning and continue with the existing server-provided data
    }
  });
}

export function initializeApp(): Promise<void> {
  // Initialize with minimal state for the client, but the server-side data
  // will override this when the (app) layout is loaded
  if (!initializationPromise) {
    // Start with initializing state to prevent flickering
    app.set({
      initializing: true,
      authenticated: false,
      profileReady: false,
      companyReady: false,
      error: null,
    });

    // Set a timeout to prevent getting stuck - if no server data arrives, assume unauthenticated
    initializationPromise = new Promise((resolve) => {
      setTimeout(() => {
        app.update((state) => {
          // Only update if still initializing (no server data arrived)
          if (state.initializing) {
            return { ...state, initializing: false };
          }
          return state;
        });
        resolve();
      }, 2000); // 2 second timeout
    });
  }

  return initializationPromise;
}

export function resetInitialization(): void {
  initializationPromise = null;
}
