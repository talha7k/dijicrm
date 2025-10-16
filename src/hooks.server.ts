import { getAuthAdmin } from "$lib/firebase-admin";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  // Get auth token from header
  const authHeader = event.request.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      // Verify token with Firebase Admin
      const auth = getAuthAdmin();
      if (!auth) throw new Error("Firebase Auth not initialized");
      const decodedToken = await auth.verifyIdToken(token);

      // Set user in locals
      event.locals.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || null,
        photoURL: decodedToken.picture || null,
      };
    } catch (error) {
      // Invalid token - continue without user
      console.warn("Invalid auth token:", error);
    }
  }

  return resolve(event);
};
