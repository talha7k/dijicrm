import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "$lib/firebase";
import type { UserProfile } from "$lib/types/user";
import { derived, get } from "svelte/store";
import { persisted } from "svelte-persisted-store";

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
}

// Create the unified auth store
export const authStore = persisted<AuthState>("authState", {
  status: AuthStatus.INITIALIZING,
  user: null,
  profile: null,
  error: null,
});

// Global state to manage listeners
let unsubscribeFromAuth: (() => void) | null = null;
let unsubscribeFromProfile: (() => void) | null = null;

// Track if we're currently performing a login write to prevent loops
let isPerformingLoginWrite = false;
let currentLoginWriteUid: string | null = null;
let lastLoginWriteTimestamp: number | null = null;

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

/**
 * [FIX] Performs a one-time write to create a profile or update `lastLoginAt`.
 * This is now separate from the real-time listener to prevent loops.
 */
async function handleLoginWrite(user: User): Promise<void> {
  // Prevent multiple concurrent writes that could cause issues
  // Also prevent writes that happen too close together to avoid loops
  const now = Date.now();
  if (isPerformingLoginWrite && currentLoginWriteUid === user.uid) {
    // Check if the last write was very recent (less than 1 second ago)
    if (lastLoginWriteTimestamp && (now - lastLoginWriteTimestamp) < 1000) {
      console.log("Login write happened very recently, skipping to prevent loop");
      return;
    }
  }
  
  isPerformingLoginWrite = true;
  currentLoginWriteUid = user.uid;
  lastLoginWriteTimestamp = now;
  
  const userRef = doc(db, "users", user.uid);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      // User exists, just update their last login time.
      // Use a more specific field update to minimize potential triggers
      await setDoc(userRef, { 
        lastLoginAt: serverTimestamp() 
      }, { merge: true });
    } else {
      // User is new, create their profile.
      const { Timestamp } = await import("firebase/firestore");
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || user.email || "",
        photoURL: user.photoURL || null,
        isActive: true,
        lastLoginAt: Timestamp.now(), // Use client-side timestamp initially
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
            lastDevice: typeof navigator !== 'undefined' ? navigator.userAgent || "unknown" : "unknown",
            platform: typeof navigator !== 'undefined' ? navigator.platform || "unknown" : "unknown",
          },
          accountStatus: "active",
        },
        onboardingCompleted: false,
      };
      await setDoc(userRef, newProfile);
    }
  } catch (error) {
    console.error("Error during login write operation:", error);
    // Optionally handle this error in the auth store
  } finally {
    // Only reset the flags if this is the same operation that set them
    if (currentLoginWriteUid === user.uid) {
      isPerformingLoginWrite = false;
      currentLoginWriteUid = null;
    }
  }
}

/**
 * [FIX] Sets up a real-time listener that ONLY reads data and updates the store.
 */
function setupProfileListener(uid: string) {
  const userRef = doc(db, "users", uid);
  unsubscribeFromProfile = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      authStore.update((state) => ({
        ...state,
        profile: docSnap.data() as UserProfile,
        status: AuthStatus.AUTHENTICATED, // Now we are fully authenticated with profile data
        error: null,
      }));
    } else {
      authStore.update((state) => ({
        ...state,
        profile: null,
        status: AuthStatus.ERROR,
        error: "User profile was not found or deleted.",
      }));
    }
  }, (error) => {
    console.error("Profile listener error:", error);
    authStore.update((state) => ({
      ...state,
      status: AuthStatus.ERROR,
      error: "Failed to listen for profile updates.",
    }));
  });
}

/**
 * Initializes the entire authentication service. Call this ONCE.
 */
export function initializeAuth(): void {
  // Prevent re-initialization if already initialized
  if (unsubscribeFromAuth) {
    console.log("Auth service already initialized, skipping duplicate initialization.");
    return;
  }
  
  authStore.update(s => ({ ...s, status: AuthStatus.INITIALIZING }));

  // Store the auth state subscription to prevent multiple subscriptions
  unsubscribeFromAuth = onAuthStateChanged(auth, async (firebaseUser) => {
    // Clean up any existing profile listener when the user changes
    if (unsubscribeFromProfile) {
      unsubscribeFromProfile();
      unsubscribeFromProfile = null;
    }

    if (firebaseUser) {
      // Set intermediate state
      authStore.update(s => ({ ...s, user: firebaseUser, status: AuthStatus.AUTHENTICATING }));
      
      // 1. Perform the one-time database write.
      await handleLoginWrite(firebaseUser);
      
      // 2. Set up the separate, continuous read listener.
      setupProfileListener(firebaseUser.uid);
    } else {
      // User is logged out, clear all state.
      authStore.set({
        user: null,
        profile: null,
        status: AuthStatus.UNAUTHENTICATED,
        error: null,
      });
    }
  });
}

// Function to re-initialize auth with server-side data to prevent duplicate operations
export function initializeAuthWithServerData(user: User, profile: UserProfile): void {
  // If auth service is already initialized, just update the state directly
  if (unsubscribeFromAuth) {
    authStore.update(state => ({
      ...state,
      user,
      profile,
      status: AuthStatus.AUTHENTICATED,
      error: null
    }));
    return;
  }
  
  // Otherwise, initialize normally but with the provided data
  authStore.set({
    user,
    profile,
    status: AuthStatus.AUTHENTICATED,
    error: null
  });
  
  // Set up the profile listener for future updates
  setupProfileListener(user.uid);
}

// Cleanup function to properly dispose of listeners when needed
export function cleanupAuthListeners(): void {
  if (unsubscribeFromAuth) {
    unsubscribeFromAuth();
    unsubscribeFromAuth = null;
  }
  
  if (unsubscribeFromProfile) {
    unsubscribeFromProfile();
    unsubscribeFromProfile = null;
  }
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
    // The onAuthStateChanged listener will automatically handle cleaning up state.
  } catch (error) {
    console.error("Sign out error:", error);
    // Force a state clear as a fallback
    authStore.set({
      user: null,
      profile: null,
      status: AuthStatus.UNAUTHENTICATED,
      error: "Failed to sign out cleanly.",
    });
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
  authStore.set({
    user: null,
    profile: null,
    status: AuthStatus.UNAUTHENTICATED,
    error: null,
  });
}

// Refresh user data
export async function refreshUserData(): Promise<void> {
  const currentState = get(authStore);
  if (currentState.user) {
    // Re-trigger the login update process
    await handleLoginWrite(currentState.user);
    // Set up profile listener again
    setupProfileListener(currentState.user.uid);
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
