import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "$lib/firebase";
import { goto } from "$app/navigation";
import { redirectToDashboard } from "$lib/utils/auth";
import type { UserProfile } from "$lib/types/user";
import { isProfileCompleteCached } from "$lib/utils/profile-cache";

/**
 * Handles post-authentication logic after successful Google Sign-In
 * Checks for existing user profile and routes appropriately
 */
export async function handlePostAuthentication(user: User): Promise<void> {
  if (!user) {
    throw new Error("No user provided to handlePostAuthentication");
  }

  try {
    // Check if user profile exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Existing user - check profile completeness with caching
      const isComplete = await isProfileCompleteCached(user.uid);
      if (isComplete) {
        // Profile is complete - redirect to appropriate dashboard
        const userProfile = userSnap.data() as UserProfile;
        await redirectToAppropriateDashboard(userProfile);
      } else {
        // Profile exists but is incomplete - redirect to onboarding
        console.log(
          "User profile exists but is incomplete, redirecting to onboarding",
        );
        await goto("/onboarding");
      }
    } else {
      // New user - redirect to onboarding
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
