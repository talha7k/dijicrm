import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "$lib/firebase";
import { goto } from "$app/navigation";
import { redirectToDashboard } from "$lib/utils/auth";
import type { UserProfile } from "$lib/types/user";
import { isProfileCompleteCached } from "$lib/utils/profile-cache";

/**
 * Creates a basic user profile document in Firestore
 */
export async function createBasicUserProfile(user: User): Promise<UserProfile> {
  const { Timestamp } = await import("@firebase/firestore");

  const basicProfile: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email || "",
    photoURL: user.photoURL || null,

    // Authentication and status
    isActive: true,
    lastLoginAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),

    // Profile information (will be filled during onboarding)
    firstName: undefined,
    lastName: undefined,
    username: undefined,
    bio: undefined,
    phoneNumber: undefined,

    // Preferences and settings
    emailNotifications: true,
    pushNotifications: true,
    theme: "system",
    language: "en",

    // Role-based access control (will be set during onboarding)
    role: "company", // Default, will be updated during onboarding
    permissions: [],

    // Company associations (will be set during onboarding)
    companyAssociations: undefined,
    currentCompanyId: undefined,

    // Address information
    address: undefined,

    // Additional metadata
    metadata: {
      deviceInfo: {
        lastDevice: navigator.userAgent || "unknown",
        platform: navigator.platform || "unknown",
      },
      lastIPAddress: undefined, // Will be set by backend if needed
      accountStatus: "active",
    },

    // Onboarding completion tracking
    onboardingCompleted: false,

    // Invitation system
    invitationToken: undefined,
    invitationExpiresAt: undefined,
    invitedBy: undefined,
    invitationStatus: undefined,
  };

  // Save to Firestore
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, basicProfile);

  console.log("Created basic user profile for:", user.uid);
  return basicProfile;
}

/**
 * Handles post-authentication logic after successful authentication
 * Ensures user profile exists and routes appropriately
 */
export async function handlePostAuthentication(user: User): Promise<void> {
  if (!user) {
    throw new Error("No user provided to handlePostAuthentication");
  }

  try {
    console.log("Handling post-authentication for user:", user.uid);

    // Check if user profile exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      console.log("User profile exists, checking completeness");
      // Existing user - check profile completeness with caching
      const isComplete = await isProfileCompleteCached(user.uid);
      if (isComplete) {
        // Profile is complete - redirect to appropriate dashboard
        const userProfile = userSnap.data() as UserProfile;
        console.log("Profile is complete, redirecting to dashboard");
        await redirectToAppropriateDashboard(userProfile);
      } else {
        // Profile exists but is incomplete - redirect to onboarding
        console.log(
          "User profile exists but is incomplete, redirecting to onboarding",
        );
        await goto("/onboarding");
      }
    } else {
      console.log("No user profile found, creating basic profile");
      // New user - create basic profile and redirect to onboarding
      await createBasicUserProfile(user);
      await goto("/onboarding");
    }
  } catch (error) {
    console.error("Error in handlePostAuthentication:", error);
    // On error, redirect to sign-in to try again
    await goto("/sign-in");
    throw error;
  }
}

/**
 * Redirects user to appropriate dashboard based on their profile
 */
async function redirectToAppropriateDashboard(
  userProfile: UserProfile,
): Promise<void> {
  if (!userProfile.currentCompanyId) {
    // Profile exists but no company association - redirect to onboarding
    await goto("/onboarding");
    return;
  }

  // Profile is complete - redirect to appropriate dashboard
  redirectToDashboard();
}

/**
 * Checks if a user profile exists in Firestore
 */
export async function checkUserProfileExists(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists();
  } catch (error) {
    console.error("Error checking user profile existence:", error);
    return false;
  }
}
