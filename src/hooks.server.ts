import { getAuthAdmin } from "$lib/firebase-admin";
import type { Handle } from "@sveltejs/kit";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://localhost:5174",
  "https://dijicrm-f6ea8.web.app",
  "https://dijicrm-f6ea8.firebaseapp.com",
  "https://tkcrm.vercel.app",
];

export const handle: Handle = async ({ event, resolve }) => {
  // Handle CORS preflight requests
  if (event.request.method === "OPTIONS") {
    const origin = event.request.headers.get("origin");

    if (allowedOrigins.includes(origin || "")) {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": origin || "",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, HEAD, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, Content-Length, Accept-Encoding, X-CSRF-Token",
          "Access-Control-Max-Age": "3600",
        },
      });
    }
  }

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

  const response = await resolve(event);

  // Add CORS headers to all responses
  const origin = event.request.headers.get("origin");
  if (allowedOrigins.includes(origin || "")) {
    response.headers.set("Access-Control-Allow-Origin", origin || "");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, HEAD, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Content-Length, Accept-Encoding, X-CSRF-Token",
    );
  }

  return response;
};
