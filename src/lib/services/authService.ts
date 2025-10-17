import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "$lib/firebase";
import { auth } from "$lib/firebase";
import type { UserProfile } from "$lib/types/user";
import { userProfile } from "$lib/stores/user";
import { get } from "svelte/store";
import { companyContext } from "$lib/stores/companyContext";
import { documentTemplatesStore } from "$lib/stores/documentTemplates";
import { clientDocumentsStore } from "$lib/stores/clientDocuments";
import { clientManagementStore } from "$lib/stores/clientManagement";
import { companyMetricsStore } from "$lib/stores/companyMetrics";

export async function createBasicUserProfile(user: User): Promise<UserProfile> {
  const { Timestamp } = await import("@firebase/firestore");

  const basicProfile: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email || "",
    photoURL: user.photoURL || null,
    isActive: true,
    lastLoginAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    emailNotifications: true,
    pushNotifications: true,
    theme: "system",
    language: "en",
    role: "company",
    permissions: [],
    metadata: {
      deviceInfo: {
        lastDevice: navigator.userAgent || "unknown",
        platform: navigator.platform || "unknown",
      },
      accountStatus: "active",
    },
    onboardingCompleted: false,
  };

  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, basicProfile);

  return basicProfile;
}

export async function handlePostAuthentication(user: User): Promise<void> {
  if (!user) {
    throw new Error("No user provided to handlePostAuthentication");
  }

  // Check if we already have the user data in persisted store
  const currentProfile = get(userProfile);
  if (currentProfile.data && currentProfile.data.uid === user.uid) {
    // Update loading state but don't re-fetch
    userProfile.update((s) => ({
      ...s,
      loading: false,
      error: null,
    }));
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    userProfile.update((s) => ({
      ...s,
      data: userSnap.data() as UserProfile,
      loading: false,
      error: null,
    }));
  } else {
    const newUserProfile = await createBasicUserProfile(user);
    userProfile.update((s) => ({
      ...s,
      data: newUserProfile,
      loading: false,
      error: null,
    }));
  }
}

export async function checkUserProfileExists(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    return false;
  }
}

/**
 * Properly handle user logout by cleaning up all listeners and stores
 */
export async function handleLogout(): Promise<void> {
  // First call Firebase signOut to clear the authentication state
  await auth.signOut();

  // Clean up company context (this will also clean up any active listeners)
  const companyContextValue = get(companyContext);
  if (companyContextValue && typeof companyContextValue.reset === "function") {
    companyContextValue.reset();
  }

  // Clean up document templates store
  if (
    documentTemplatesStore &&
    typeof documentTemplatesStore.unsubscribe === "function"
  ) {
    documentTemplatesStore.unsubscribe();
  }

  // Clean up client documents store
  if (
    clientDocumentsStore &&
    typeof clientDocumentsStore.unsubscribe === "function"
  ) {
    clientDocumentsStore.unsubscribe();
  }

  // Clean up client management store
  if (
    clientManagementStore &&
    typeof clientManagementStore.unsubscribe === "function"
  ) {
    clientManagementStore.unsubscribe();
  }

  // Clean up company metrics store
  if (
    companyMetricsStore &&
    typeof companyMetricsStore.unsubscribe === "function"
  ) {
    companyMetricsStore.unsubscribe();
  }

  // Reset user profile store
  userProfile.set({
    data: undefined,
    loading: false,
    error: null,
    update: async () => {},
  });

  // Reset app state to indicate user is no longer authenticated
  import("$lib/stores/app").then(({ app }) => {
    app.update((state) => ({
      ...state,
      authenticated: false,
      profileReady: false,
      companyReady: false,
      error: null,
    }));
  });

  // Additional cleanup can be added here as needed
}
