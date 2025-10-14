import { writable, derived, get } from "svelte/store";
import type { CompanyContext, Company } from "$lib/types/company";
import { userProfile } from "./user";
import {
  hasCompanyAccess,
  getCompanyRole,
} from "$lib/utils/company-validation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "$lib/firebase";
import { auth } from "$lib/firebase";

type CompanyContextStore = {
  data: CompanyContext | null;
  loading: boolean;
  error: any;
  switchCompany: (companyId: string) => Promise<void>;
  initializeFromUser: () => Promise<void>;
};

function createCompanyContextStore() {
  const store = writable<CompanyContextStore>({
    data: null,
    loading: true,
    error: null,
    switchCompany: async () => {},
    initializeFromUser: async () => {},
  });

  // Implement switchCompany
  const switchCompany = async (companyId: string) => {
    store.update((s) => ({ ...s, loading: true, error: null }));

    const $userProfile = get(userProfile);
    if (!$userProfile.data) {
      store.update((s) => ({ ...s, loading: false, error: "No user profile" }));
      return;
    }

    const user = $userProfile.data;
    if (!hasCompanyAccess(user, companyId)) {
      store.update((s) => ({ ...s, loading: false, error: "Access denied" }));
      return;
    }

    const role = getCompanyRole(user, companyId);
    if (!role) {
      store.update((s) => ({ ...s, loading: false, error: "Invalid role" }));
      return;
    }

    const company = await fetchCompany(companyId);
    if (!company) {
      store.update((s) => ({
        ...s,
        loading: false,
        error: "Company not found",
      }));
      return;
    }

    // Update user profile in Firestore
    if (auth.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        currentCompanyId: companyId,
      });
    }

    store.update((s) => ({
      ...s,
      data: {
        companyId,
        company,
        role,
        permissions: [], // TODO: Load permissions
      },
      loading: false,
    }));
  };

  // Implement initializeFromUser
  const initializeFromUser = async () => {
    const $userProfile = get(userProfile);
    if ($userProfile.data) {
      const user = $userProfile.data;
      const activeCompanyId =
        user.currentCompanyId || user.companyAssociations?.[0]?.companyId;

      if (activeCompanyId && hasCompanyAccess(user, activeCompanyId)) {
        await switchCompany(activeCompanyId);
      } else {
        store.update((s) => ({ ...s, data: null, loading: false }));
      }
    } else {
      store.update((s) => ({ ...s, data: null, loading: false }));
    }
  };

  store.update((s) => ({
    ...s,
    switchCompany,
    initializeFromUser,
  }));

  return store;
}

export const companyContext = createCompanyContextStore();

// Derived store for active company ID
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
