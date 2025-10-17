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
  // Set app state to indicate user is authenticated and ready
  app.set({
    initializing: false,
    authenticated: true,
    profileReady: true,
    companyReady: true,
    error: null,
  });

  // Set the user profile data
  userProfile.set({
    data: data.profile,
    loading: false,
    error: null,
    update: async () => {} // This will be replaced with actual update function if needed
  });

  // Set the company context data
  import("$lib/stores/companyContext").then(({ companyContextData }) => {
    companyContextData.set({
      data: {
        companyId: data.profile.currentCompanyId || data.company.code,
        company: data.company,
        role: data.membership.role,
        permissions: data.membership.permissions
      },
      loading: false,
      error: null
    });
  });
}

export function initializeApp(): Promise<void> {
  // Initialize with minimal state for the client, but the server-side data
  // will override this when the (app) layout is loaded
  if (!initializationPromise) {
    // Set initial state as non-initializing to avoid getting stuck
    app.set({
      initializing: false,
      authenticated: false,
      profileReady: false,
      companyReady: false,
      error: null,
    });
    initializationPromise = Promise.resolve();
  }
  
  return initializationPromise;
}

export function resetInitialization(): void {
  initializationPromise = null;
}
