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

  // Check for session cookie in request
  const sessionCookie = event.cookies.get("__session");

  if (!sessionCookie) {
    // No session cookie exists - treat as logged out user
    event.locals.user = undefined;
  } else {
    try {
      // Verify session cookie with Firebase Admin
      const auth = getAuthAdmin();
      if (!auth) {
        console.error("Firebase Auth not initialized");
        event.locals.user = undefined;
      } else {
        const decodedClaims = await auth.verifySessionCookie(
          sessionCookie,
          true,
        ); // true to check if revoked

        // Set user in locals with essential information
        event.locals.user = {
          uid: decodedClaims.uid,
          email: decodedClaims.email || undefined,
          displayName: decodedClaims.name || null,
          photoURL: decodedClaims.picture || null,
        };
      }
    } catch (error) {
      // Invalid/Expired cookie - continue without user and delete the invalid cookie
      event.locals.user = undefined;
      event.cookies.delete("__session", { path: "/" });
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
