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
    console.log("CompanyContext: initializeFromUser called");

    const $userProfile = get(userProfile);
    console.log("CompanyContext: Current profile state:", {
      hasData: !!$userProfile.data,
      loading: $userProfile.loading,
      error: $userProfile.error,
      currentCompanyId: $userProfile.data?.currentCompanyId,
      companyAssociationsCount:
        $userProfile.data?.companyAssociations?.length || 0,
    });

    if ($userProfile.error) {
      console.error(
        "CompanyContext: Profile has error, cannot initialize:",
        $userProfile.error,
      );
      store.update((s) => ({
        ...s,
        data: null,
        loading: false,
        error: $userProfile.error,
      }));
      return;
    }

    if (!$userProfile.data) {
      console.log("CompanyContext: No user profile data available");
      store.update((s) => ({ ...s, data: null, loading: false }));
      return;
    }

    const user = $userProfile.data;
    console.log("CompanyContext: Using user data:", {
      uid: user.uid,
      currentCompanyId: user.currentCompanyId,
      companyAssociationsCount: user.companyAssociations?.length || 0,
    });

    // First try currentCompanyId if it exists and user has access
    if (
      user.currentCompanyId &&
      hasCompanyAccess(user, user.currentCompanyId)
    ) {
      console.log(
        "CompanyContext: Initializing with currentCompanyId:",
        user.currentCompanyId,
      );
      await switchCompany(user.currentCompanyId);
      return;
    }

    // If no currentCompanyId or no access, try the first available association
    if (user.companyAssociations && user.companyAssociations.length > 0) {
      const firstAssociation = user.companyAssociations[0];
      console.log(
        "CompanyContext: No valid currentCompanyId, trying first association:",
        firstAssociation.companyId,
      );

      // Set the currentCompanyId to the first association if not already set
      if (!user.currentCompanyId) {
        console.log(
          "CompanyContext: Setting currentCompanyId to first association",
        );
        try {
          const { updateDoc, doc } = await import("firebase/firestore");
          const { db, auth } = await import("$lib/firebase");
          if (auth.currentUser) {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
              currentCompanyId: firstAssociation.companyId,
            });
            console.log(
              "CompanyContext: Updated user profile with currentCompanyId",
            );

            // Update the local user profile store to reflect the change
            userProfile.update((store) => {
              if (store.data) {
                return {
                  ...store,
                  data: {
                    ...store.data,
                    currentCompanyId: firstAssociation.companyId,
                  },
                };
              }
              return store;
            });
          }
        } catch (error) {
          console.error(
            "CompanyContext: Failed to update currentCompanyId:",
            error,
          );
        }
      }

      // Now try to switch to the company
      if (hasCompanyAccess(user, firstAssociation.companyId)) {
        console.log(
          "CompanyContext: Switching to company:",
          firstAssociation.companyId,
        );
        await switchCompany(firstAssociation.companyId);
        return;
      } else {
        console.log(
          "CompanyContext: User does not have access to company:",
          firstAssociation.companyId,
        );
      }
    }

    // No valid company found
    console.log("CompanyContext: No valid company found for user");
    store.update((s) => ({ ...s, data: null, loading: false }));
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
