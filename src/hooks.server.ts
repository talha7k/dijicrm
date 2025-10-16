import { getAuthAdmin } from "$lib/firebase-admin";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  // Get auth token from header
  const authHeader = event.request.headers.get("authorization");

  console.log("Auth header present:", !!authHeader);

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      // Extract token from header
      const token = authHeader.split(" ")[1];
      console.log("Token extracted, length:", token.length);

      // Verify token with Firebase Admin
      const auth = getAuthAdmin();
      if (!auth) throw new Error("Firebase Auth not initialized");
      console.log("Firebase Admin initialized, verifying token...");
      const decodedToken = await auth.verifyIdToken(token);
      console.log("Token verified successfully for user:", decodedToken.uid);

      // Set user in locals
      event.locals.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || null,
        photoURL: decodedToken.picture || null,
      };
      console.log("User set in locals:", event.locals.user.uid);
    } catch (error) {
      // Invalid token - continue without user
      console.warn("Invalid auth token:", error);
    }
  }

  return resolve(event);
};
