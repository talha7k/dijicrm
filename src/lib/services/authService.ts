import type { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "$lib/firebase";
import type { UserProfile } from "$lib/types/user";
import { derived } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { get } from "svelte/store";

// Auth status enum for clear state management
export enum AuthStatus {
  INITIALIZING = "initializing",
  UNAUTHENTICATED = "unauthenticated",
  AUTHENTICATING = "authenticating",
  AUTHENTICATED = "authenticated",
  ERROR = "error",
}

// Core auth state interface
interface AuthState {
  status: AuthStatus;
  user: User | null;
  profile: UserProfile | null;
  error: string | null;
  lastActivity: number;
}

// Create the unified auth store
export const authStore = persisted<AuthState>("authState", {
  status: AuthStatus.INITIALIZING,
  user: null,
  profile: null,
  error: null,
  lastActivity: Date.now(),
});

// Initialization guard to prevent multiple simultaneous calls
let authServiceInitializing = false;
let initializationPromise: Promise<void> | null = null;

// Derived stores for convenient access
export const isAuthenticated = derived(
  authStore,
  ($auth) => $auth.status === AuthStatus.AUTHENTICATED,
);
export const isInitializing = derived(
  authStore,
  ($auth) => $auth.status === AuthStatus.INITIALIZING,
);
export const isLoading = derived(
  authStore,
  ($auth) =>
    $auth.status === AuthStatus.INITIALIZING ||
    $auth.status === AuthStatus.AUTHENTICATING,
);
export const authError = derived(authStore, ($auth) => $auth.error);
export const currentUser = derived(authStore, ($auth) => $auth.user);
export const userProfile = derived(authStore, ($auth) => $auth.profile);

// Auth state transition helpers
function setAuthState(
  status: AuthStatus,
  user: User | null = null,
  profile: UserProfile | null = null,
  error: string | null = null,
) {
  authStore.update((state) => ({
    ...state,
    status,
    user,
    profile,
    error,
    lastActivity: Date.now(),
  }));
}

// Initialize auth service - sets up Firebase auth listener
export async function initializeAuth(): Promise<void> {
  // Prevent multiple simultaneous initializations
  if (authServiceInitializing && initializationPromise) {
    return initializationPromise;
  }

  if (authServiceInitializing) {
    return Promise.resolve();
  }

  authServiceInitializing = true;

  initializationPromise = new Promise<void>(async (resolve, reject) => {
    try {
      setAuthState(AuthStatus.INITIALIZING);

      // Set up Firebase auth state listener
      auth.onAuthStateChanged(
        async (firebaseUser) => {
          if (firebaseUser) {
            setAuthState(AuthStatus.AUTHENTICATING, firebaseUser);
            await handleAuthenticatedUser(firebaseUser);
          } else {
            setAuthState(AuthStatus.UNAUTHENTICATED);
          }
          authServiceInitializing = false;
          resolve();
        },
        (error) => {
          console.error("Auth state listener error:", error);
          setAuthState(AuthStatus.ERROR, null, null, error.message);
          authServiceInitializing = false;
          reject(error);
        },
      );
    } catch (error) {
      console.error("Auth initialization error:", error);
      setAuthState(
        AuthStatus.ERROR,
        null,
        null,
        error instanceof Error ? error.message : "Unknown error",
      );
      authServiceInitializing = false;
      reject(error);
    }
  });

  return initializationPromise;
}

// Handle authenticated user - fetch or create profile
async function handleAuthenticatedUser(user: User): Promise<void> {
  try {
    const profile = await fetchOrCreateUserProfile(user);
    setAuthState(AuthStatus.AUTHENTICATED, user, profile);
  } catch (error) {
    console.error("Error handling authenticated user:", error);
    setAuthState(
      AuthStatus.ERROR,
      user,
      null,
      error instanceof Error ? error.message : "Profile fetch failed",
    );
  }
}

// Fetch existing profile or create new one
async function fetchOrCreateUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  } else {
    return await createBasicUserProfile(user);
  }
}

// Create basic user profile for new users
async function createBasicUserProfile(user: User): Promise<UserProfile> {
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

// Sign in function
export async function signIn(email: string, password: string): Promise<void> {
  try {
    setAuthState(AuthStatus.AUTHENTICATING);
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Create session cookie for server-side authentication
    const idToken = await userCredential.user.getIdToken();
    await fetch("/api/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    // Auth state listener will handle the rest
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Sign in failed";
    setAuthState(AuthStatus.ERROR, null, null, errorMessage);
    throw error;
  }
}

// Sign up function
export async function signUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<void> {
  try {
    setAuthState(AuthStatus.AUTHENTICATING);
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    if (displayName) {
      const { updateProfile } = await import("firebase/auth");
      await updateProfile(userCredential.user, { displayName });
    }

    // Auth state listener will handle profile creation
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Sign up failed";
    setAuthState(AuthStatus.ERROR, null, null, errorMessage);
    throw error;
  }
}

// Sign out function
export async function signOut(): Promise<void> {
  try {
    await auth.signOut();
    // Auth state listener will handle state reset
  } catch (error) {
    console.error("Sign out error:", error);
    // Force state reset even if Firebase sign out fails
    setAuthState(AuthStatus.UNAUTHENTICATED);
  }
}

// Alias for signOut for backward compatibility
export const handleLogout = signOut;

// Reset password function
export async function resetPassword(email: string): Promise<void> {
  try {
    const { sendPasswordResetEmail } = await import("firebase/auth");
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Password reset failed";
    throw new Error(errorMessage);
  }
}

// Update user profile
export async function updateUserProfile(
  updates: Partial<UserProfile>,
): Promise<void> {
  try {
    const currentState = get(authStore);
    if (!currentState.user || !currentState.profile) {
      throw new Error("No authenticated user found");
    }

    const userRef = doc(db, "users", currentState.user.uid);
    const { Timestamp } = await import("@firebase/firestore");

    const updatedProfile = {
      ...currentState.profile,
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await setDoc(userRef, updatedProfile, { merge: true });

    // Update local state
    setAuthState(AuthStatus.AUTHENTICATED, currentState.user, updatedProfile);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Profile update failed";
    throw new Error(errorMessage);
  }
}

// Check if user profile exists
export async function checkUserProfileExists(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    return false;
  }
}

// Get current auth state (synchronous)
export function getCurrentAuthState(): AuthState {
  return get(authStore);
}

// Clear auth state (for testing or forced logout)
export function clearAuthState(): void {
  setAuthState(AuthStatus.UNAUTHENTICATED);
}

// Refresh user data
export async function refreshUserData(): Promise<void> {
  const currentState = get(authStore);
  if (currentState.user) {
    await handleAuthenticatedUser(currentState.user);
  }
}

// Utility function to check if profile is complete
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;

  return !!(
    profile.displayName &&
    profile.email &&
    profile.role &&
    profile.metadata?.accountStatus === "active"
  );
}

// Utility function to check if user has company associations
export function hasCompanyAssociations(profile: UserProfile | null): boolean {
  if (!profile) return false;

  const validAssociations = profile.companyAssociations?.filter(
    (assoc) =>
      assoc.companyId &&
      typeof assoc.companyId === "string" &&
      assoc.companyId.trim().length > 0,
  );

  return !!(validAssociations && validAssociations.length > 0);
}

// Utility function to check if user needs onboarding
export function needsOnboarding(profile: UserProfile | null): boolean {
  if (!profile) return true;

  // If onboarding is not completed, user needs onboarding
  if (!profile.onboardingCompleted) return true;

  // If user has no company associations, they need onboarding
  if (!hasCompanyAssociations(profile)) return true;

  return false;
}

// Derived store for profile completeness
export const profileComplete = derived(authStore, ($auth) =>
  isProfileComplete($auth.profile),
);

// Derived store for company associations
export const hasCompanyAccess = derived(authStore, ($auth) =>
  hasCompanyAssociations($auth.profile),
);

// Derived store for onboarding requirement
export const requiresOnboarding = derived(authStore, ($auth) =>
  needsOnboarding($auth.profile),
);

// Derived store for ready state (authenticated + profile complete + has company associations)
export const readyForApp = derived(
  authStore,
  ($auth) =>
    $auth.status === AuthStatus.AUTHENTICATED &&
    isProfileComplete($auth.profile) &&
    hasCompanyAssociations($auth.profile) &&
    $auth.profile?.onboardingCompleted,
);
