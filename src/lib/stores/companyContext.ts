import { derived, get, writable } from "svelte/store";
import type { CompanyContext, Company } from "$lib/types/company";
import { authStore } from "$lib/services/authService";
import {
  hasCompanyAccess,
  getCompanyRole,
} from "$lib/utils/company-validation";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "$lib/firebase";
import { auth } from "$lib/firebase";
import { smtpConfigStore } from "./smtpConfig";
import { setCurrencyConfig } from "$lib/utils/currency";
import { setVatConfig } from "$lib/utils/vat";

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

const switchCompany = async (companyId: string) => {
  companyContextData.update((s) => ({ ...s, loading: true, error: null }));

  const $authStore = get(authStore);
  if (!$authStore.profile) {
    companyContextData.update((s) => ({
      ...s,
      loading: false,
      error: "No user profile",
    }));
    return;
  }

  const user = $authStore.profile;
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

  // Set up real-time listener for company data
  const companyDocRef = doc(db, "companies", companyId);
  companyUnsubscribe = onSnapshot(
    companyDocRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const company = docSnapshot.data() as Company;

        // Initialize currency from company settings
        const currency = company.settings?.currency || "SAR";
        setCurrencyConfig({
          code: currency,
          symbol: currency,
        });

        // Initialize VAT from company settings
        const vatRate = company.settings?.vatAmount || 0.15;
        setVatConfig({
          rate: vatRate,
          enabled: true,
        });

        companyContextData.update((s) => ({
          ...s,
          data: { companyId, company, role, permissions: [] },
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

  // Update user's current company
  if (auth.currentUser) {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      currentCompanyId: companyId,
    });
  }
};

export const initializeFromUser = async () => {
  const $authStore = get(authStore);
  const currentContext = get(companyContextData);

  // If we already have valid context from server validation, skip client-side validation
  if (
    currentContext.data &&
    currentContext.hasServerData &&
    $authStore.profile &&
    currentContext.data.companyId === $authStore.profile.currentCompanyId
  ) {
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
    $authStore.profile &&
    currentContext.data.companyId === $authStore.profile.currentCompanyId &&
    companyUnsubscribe
  ) {
    try {
      await smtpConfigStore.initialize();
    } catch (smtpError) {
      console.warn("Failed to initialize SMTP configuration:", smtpError);
    }
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

    try {
      await smtpConfigStore.initialize();
    } catch (smtpError) {
      console.warn("Failed to initialize SMTP configuration:", smtpError);
    }
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
