import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "$lib/firebase";
import type { UserProfile } from "$lib/types/user";
import { userProfile } from "$lib/stores/user";
import { get } from "svelte/store";

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
