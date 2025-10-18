import { derived, get, writable } from "svelte/store";
import type { CompanyContext, Company } from "$lib/types/company";
import { authStore } from "$lib/services/authService";
import {
  hasCompanyAccess,
  getCompanyRole,
} from "$lib/utils/company-validation";
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "$lib/firebase";
import { auth } from "$lib/firebase";

import { setCurrencyConfig } from "$lib/utils/currency";
import { setVatConfig, initializeVatFromCompany } from "$lib/utils/vat";

type CompanyContextData = {
  data: CompanyContext | null;
  loading: boolean;
  error: any;
  hasServerData: boolean;
};

export const companyContextData = writable<CompanyContextData>({
  data: null,
  loading: true,
  error: null,
  hasServerData: false,
});

let companyUnsubscribe: (() => void) | null = null;

const switchCompany = async (companyId: string, providedUser?: any) => {
  companyContextData.update((s) => ({ ...s, loading: true, error: null }));

  const $authStore = get(authStore);
  const user = providedUser || $authStore.profile;

  if (!user) {
    companyContextData.update((s) => ({
      ...s,
      loading: false,
      error: "No user profile",
    }));
    return;
  }
  if (!hasCompanyAccess(user, companyId)) {
    companyContextData.update((s) => ({
      ...s,
      loading: false,
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
    return;
  }

  // Clean up previous listener
  if (companyUnsubscribe) {
    companyUnsubscribe();
  }

  // Set up real-time listener for company data and subcollections
  const companyDocRef = doc(db, "companies", companyId);
  companyUnsubscribe = onSnapshot(
    companyDocRef,
    async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const company = docSnapshot.data() as Company;

        // Initialize currency from company settings
        const currency = company.settings?.currency || "SAR";
        setCurrencyConfig({
          code: currency,
          symbol: currency,
        });

        // SMTP, branding, and VAT configs are now part of the main company document
        const smtpConfig = company.smtpConfig || null;
        const brandingConfig = company.brandingConfig || null;
        const vatConfig = company.vatConfig || null;

        // Initialize VAT from subcollection or fallback to company settings
        if (vatConfig) {
          setVatConfig(vatConfig);
        } else if (company.settings?.vatAmount) {
          // Fallback to company settings if subcollection doesn't exist
          const vatRate = company.settings.vatAmount;
          setVatConfig({
            rate: vatRate,
            enabled: true,
          });
        }

        companyContextData.update((s) => ({
          ...s,
          data: {
            companyId,
            company,
            role,
            permissions: [],
            smtpConfig,
            brandingConfig,
            vatConfig,
          },
          loading: false,
          error: null,
        }));
      } else {
        companyContextData.update((s) => ({
          ...s,
          data: null,
          loading: false,
          error: "Company not found",
        }));
      }
    },
    (error) => {
      console.error("Error listening to company data:", error);

      const currentContext = get(companyContextData);
      if (currentContext.hasServerData && currentContext.data) {
        console.warn(
          "Company data listener failed, but using server-side data:",
          error.message,
        );
        companyContextData.update((s) => ({
          ...s,
          loading: false,
        }));
      } else {
        companyContextData.update((s) => ({
          ...s,
          data: null,
          loading: false,
          error: `Failed to listen to company data: ${error.message}`,
        }));
      }
    },
  );

  // Update user's current company only if it's different
  if (auth.currentUser) {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Only update if the company ID is actually different to prevent loops
      if (userData.currentCompanyId !== companyId) {
        await updateDoc(userRef, {
          currentCompanyId: companyId,
        });
      }
    } else {
      // If user doesn't exist in DB, create the profile first
      await setDoc(userRef, {
        currentCompanyId: companyId,
      }, { merge: true });
    }
  }
};

export const initializeFromUser = async () => {
  const $authStore = get(authStore);
  const currentContext = get(companyContextData);

  console.log("🏢 initializeFromUser called:", {
    hasServerData: currentContext.hasServerData,
    hasContextData: !!currentContext.data,
    hasAuthProfile: !!$authStore.profile,
    contextCompanyId: currentContext.data?.companyId,
    authCompanyId: $authStore.profile?.currentCompanyId,
  });

  // If we already have valid context for the same company and listener is active, use existing data
  if (
    currentContext.data &&
    $authStore.profile &&
    currentContext.data.companyId === $authStore.profile.currentCompanyId &&
    companyUnsubscribe
  ) {
    // Real-time listener is already active, no need to reinitialize
    return;
  }

  companyContextData.update((s) => ({ ...s, loading: true, error: null }));

  if (!$authStore.profile) {
    companyContextData.update((s) => ({
      ...s,
      data: null,
      loading: false,
      error: "No user profile data available",
    }));
    throw new Error("No user profile data available");
  }

  const user = $authStore.profile;
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
    throw new Error("No company associations found.");
  }

  let companyIdToLoad = user.currentCompanyId;

  if (!companyIdToLoad || !hasCompanyAccess(user, companyIdToLoad)) {
    companyIdToLoad = validAssociations[0].companyId;
  }

  try {
    await switchCompany(companyIdToLoad);

    // SMTP and branding are now loaded in the real-time listener
  } catch (error) {
    companyContextData.update((s) => ({
      ...s,
      data: null,
      loading: false,
      error: `Failed to initialize company context: ${error}`,
    }));
    throw error;
  }
};

const reset = () => {
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
};

const retryInitialization = async () => {
  companyContextData.update((s) => ({ ...s, error: null, loading: true }));
  try {
    await initializeFromUser();
  } catch (error) {
    companyContextData.update((s) => ({
      ...s,
      loading: false,
      error: `Retry failed: ${error}`,
    }));
    throw error;
  }
};

// Set up real-time listener without resetting existing data
const setupRealtimeListener = async (companyId: string) => {
  // Clean up previous listener
  if (companyUnsubscribe) {
    companyUnsubscribe();
  }

  // Set up real-time listener for company data and subcollections
  const companyDocRef = doc(db, "companies", companyId);
  companyUnsubscribe = onSnapshot(
    companyDocRef,
    async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const company = docSnapshot.data() as Company;
        const currentContext = get(companyContextData);

        if (currentContext.data) {
          // Update existing context with new company data
          companyContextData.update((s) => ({
            ...s,
            data: {
              ...s.data!,
              company,
              // Keep existing companyId, role, permissions
            },
            loading: false,
          }));
        }

        // SMTP and branding configs are now part of the main company document
        const smtpConfig = company.smtpConfig || null;
        const brandingConfig = company.brandingConfig || null;

        // Update context with SMTP and branding configs
        companyContextData.update((s) => ({
          ...s,
          data: s.data
            ? {
                ...s.data,
                smtpConfig,
                brandingConfig,
              }
            : null,
          loading: false,
        }));
      }
    },
    (error) => {
      console.error("Error in real-time listener:", error);
    },
  );
};

export const companyContext = derived(
  companyContextData,
  ($companyContextData) => ({
    ...$companyContextData,
    switchCompany,
    initializeFromUser,
    reset,
    retryInitialization,
    setupRealtimeListener,
  }),
);

export const activeCompanyId = derived(
  companyContext,
  ($context) => $context.data?.companyId || null,
);

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
