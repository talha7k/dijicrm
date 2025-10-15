import { derived, get } from "svelte/store";
import type { CompanyContext, Company } from "$lib/types/company";
import { userProfile } from "./user";
import {
  hasCompanyAccess,
  getCompanyRole,
} from "$lib/utils/company-validation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "$lib/firebase";
import { auth } from "$lib/firebase";
import { persisted } from "svelte-persisted-store";
import { smtpConfigStore } from "./smtpConfig";

type CompanyContextData = {
  data: CompanyContext | null;
  loading: boolean;
  error: any;
};

const companyContextData = persisted<CompanyContextData>("companyContext", {
  data: null,
  loading: true,
  error: null,
});

const switchCompany = async (companyId: string) => {
  companyContextData.update((s) => ({ ...s, loading: true, error: null }));

  const $userProfile = get(userProfile);
  if (!$userProfile.data) {
    companyContextData.update((s) => ({
      ...s,
      loading: false,
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

  const company = await fetchCompany(companyId);
  if (!company) {
    companyContextData.update((s) => ({
      ...s,
      loading: false,
      error: "Company not found",
    }));
    return;
  }

  if (auth.currentUser) {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      currentCompanyId: companyId,
    });
  }

  companyContextData.update((s) => ({
    ...s,
    data: { companyId, company, role, permissions: [] },
    loading: false,
  }));
};

export const initializeFromUser = async () => {
  companyContextData.update((s) => ({ ...s, loading: true, error: null }));

  const $userProfile = get(userProfile);

  if ($userProfile.error) {
    companyContextData.update((s) => ({
      ...s,
      data: null,
      loading: false,
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
  companyContextData.set({ data: null, loading: false, error: null });
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
