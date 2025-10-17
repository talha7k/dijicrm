import { derived, get, writable } from "svelte/store";
import type { CompanyContext, Company } from "$lib/types/company";
import { userProfile } from "./user";
import { app } from "./app";
import {
  hasCompanyAccess,
  getCompanyRole,
} from "$lib/utils/company-validation";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "$lib/firebase";
import { auth } from "$lib/firebase";
import { smtpConfigStore } from "./smtpConfig";

type CompanyContextData = {
  data: CompanyContext | null;
  loading: boolean;
  error: any;
  hasServerData: boolean; // Flag to indicate if data came from server validation
};

export const companyContextData = writable<CompanyContextData>({
  data: null,
  loading: true,
  error: null,
  hasServerData: false,
});

let companyUnsubscribe: (() => void) | null = null;

const switchCompany = async (companyId: string) => {
  companyContextData.update((s) => ({ ...s, loading: true, error: null }));
  app.update((state) => ({ ...state, companyReady: false, error: null })); // Set company as not ready during switch

  const $userProfile = get(userProfile);
  if (!$userProfile.data) {
    companyContextData.update((s) => ({
      ...s,
      loading: false,
      error: "No user profile",
    }));
    app.update((state) => ({
      ...state,
      companyReady: false,
      error: "No user profile",
    }));
    return;
  }

  const user = $userProfile.data;
  if (!hasCompanyAccess(user, companyId)) {
    companyContextData.update((s) => ({
      ...s,
      loading: false,
      error: "Access denied",
    }));
    app.update((state) => ({
      ...state,
      companyReady: false,
      error: "Access denied",
    }));
    return;
  }

  const role = getCompanyRole(user, companyId);
  if (!role) {
    companyContextData.update((s) => ({
      ...s,
      loading: false,
      error: "Invalid role",
    }));
    app.update((state) => ({
      ...state,
      companyReady: false,
      error: "Invalid role",
    }));
    return;
  }

  // Clean up previous listener
  if (companyUnsubscribe) {
    companyUnsubscribe();
  }

  // Set up real-time listener for company data
  const companyDocRef = doc(db, "companies", companyId);
  companyUnsubscribe = onSnapshot(
    companyDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const company = docSnapshot.data() as Company;

        companyContextData.update((s) => ({
          ...s,
          data: { companyId, company, role, permissions: [] },
          loading: false,
          error: null,
        }));

        // Update app store to reflect successful company loading
        app.update((state) => ({
          ...state,
          companyReady: true,
          error: null,
        }));
      } else {
        companyContextData.update((s) => ({
          ...s,
          data: null,
          loading: false,
          error: "Company not found",
        }));
        app.update((state) => ({
          ...state,
          companyReady: false,
          error: "Company not found",
        }));
      }
    },
    (error) => {
      console.error("Error listening to company data:", error);

      // If we have server data, don't set error states that would trigger redirects
      // Just log the error and continue with existing server data
      const currentContext = get(companyContextData);
      if (currentContext.hasServerData && currentContext.data) {
        console.warn(
          "Company data listener failed, but using server-side data:",
          error.message,
        );
        companyContextData.update((s) => ({
          ...s,
          loading: false,
          // Keep existing data, don't set error
        }));
        app.update((state) => ({
          ...state,
          companyReady: true, // Keep company ready since we have server data
          error: null, // Clear any error
        }));
      } else {
        // No server data available, set error states
        companyContextData.update((s) => ({
          ...s,
          data: null,
          loading: false,
          error: `Failed to listen to company data: ${error.message}`,
        }));
        app.update((state) => ({
          ...state,
          companyReady: false,
          error: `Failed to listen to company data: ${error.message}`,
        }));
      }
    },
  );

  // Update user's current company
  if (auth.currentUser) {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      currentCompanyId: companyId,
    });
  }
};

export const initializeFromUser = async () => {
  const $userProfile = get(userProfile);
  const currentContext = get(companyContextData);

  // If we already have valid context from server validation, skip client-side validation
  if (
    currentContext.data &&
    currentContext.hasServerData &&
    $userProfile.data &&
    currentContext.data.companyId === $userProfile.data.currentCompanyId
  ) {
    // Initialize SMTP configuration if not already done
    try {
      await smtpConfigStore.initialize();
    } catch (smtpError) {
      console.warn("Failed to initialize SMTP configuration:", smtpError);
    }
    return;
  }

  // If we already have valid context for the same company, just ensure SMTP is initialized
  if (
    currentContext.data &&
    $userProfile.data &&
    currentContext.data.companyId === $userProfile.data.currentCompanyId &&
    companyUnsubscribe // Listener is active
  ) {
    // Initialize SMTP configuration if not already done
    try {
      await smtpConfigStore.initialize();
    } catch (smtpError) {
      console.warn("Failed to initialize SMTP configuration:", smtpError);
    }
    return;
  }

  companyContextData.update((s) => ({ ...s, loading: true, error: null }));

  // Update app store to indicate company is not ready during initialization
  app.update((state) => ({ ...state, companyReady: false }));

  if ($userProfile.error) {
    companyContextData.update((s) => ({
      ...s,
      data: null,
      loading: false,
      error: `Profile error: ${$userProfile.error}`,
    }));
    app.update((state) => ({
      ...state,
      companyReady: false,
      error: `Profile error: ${$userProfile.error}`,
    }));
    throw new Error(`Profile error: ${$userProfile.error}`);
  }

  if (!$userProfile.data) {
    companyContextData.update((s) => ({
      ...s,
      data: null,
      loading: false,
      error: "No user profile data available",
    }));
    app.update((state) => ({
      ...state,
      companyReady: false,
      error: "No user profile data available",
    }));
    throw new Error("No user profile data available");
  }

  const user = $userProfile.data;
  const validAssociations = user.companyAssociations?.filter(
    (assoc) =>
      assoc.companyId &&
      typeof assoc.companyId === "string" &&
      assoc.companyId.trim().length > 0,
  );

  if (!validAssociations || validAssociations.length === 0) {
    companyContextData.update((s) => ({
      ...s,
      data: null,
      loading: false,
      error: "No company associations found.",
    }));
    app.update((state) => ({
      ...state,
      companyReady: false,
      error: "No company associations found.",
    }));
    throw new Error("No company associations found.");
  }

  let companyIdToLoad = user.currentCompanyId;

  if (!companyIdToLoad || !hasCompanyAccess(user, companyIdToLoad)) {
    companyIdToLoad = validAssociations[0].companyId;
  }

  try {
    await switchCompany(companyIdToLoad);

    // Initialize SMTP configuration for the company
    try {
      await smtpConfigStore.initialize();
    } catch (smtpError) {
      console.warn("Failed to initialize SMTP configuration:", smtpError);
      // Don't fail the whole initialization for SMTP issues
    }

    // On successful initialization, update app store
    app.update((state) => ({ ...state, companyReady: true, error: null }));
  } catch (error) {
    companyContextData.update((s) => ({
      ...s,
      data: null,
      loading: false,
      error: `Failed to initialize company context: ${error}`,
    }));
    app.update((state) => ({
      ...state,
      companyReady: false,
      error: `Failed to initialize company context: ${error}`,
    }));
    throw error;
  }
};

const reset = () => {
  // Clean up listener
  if (companyUnsubscribe) {
    companyUnsubscribe();
    companyUnsubscribe = null;
  }

  companyContextData.set({
    data: null,
    loading: false,
    error: null,
    hasServerData: false,
  });
  app.update((state) => ({ ...state, companyReady: false, error: null }));
};

const retryInitialization = async () => {
  companyContextData.update((s) => ({ ...s, error: null, loading: true }));
  app.update((state) => ({ ...state, companyReady: false, error: null }));
  try {
    await initializeFromUser();
  } catch (error) {
    companyContextData.update((s) => ({
      ...s,
      loading: false,
      error: `Retry failed: ${error}`,
    }));
    app.update((state) => ({
      ...state,
      companyReady: false,
      error: `Retry failed: ${error}`,
    }));
    throw error;
  }
};

export const companyContext = derived(
  companyContextData,
  ($companyContextData) => ({
    ...$companyContextData,
    switchCompany,
    initializeFromUser,
    reset,
    retryInitialization,
  }),
);

export const activeCompanyId = derived(
  companyContext,
  ($context) => $context.data?.companyId || null,
);

// Simple cache for company data
async function fetchCompany(companyId: string): Promise<Company | null> {
  try {
    const companyDoc = await getDoc(doc(db, "companies", companyId));
    if (companyDoc.exists()) {
      return companyDoc.data() as Company;
    }
    return null;
  } catch (error) {
    console.error("Error fetching company:", error);
    return null;
  }
}
