import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getAuthAdmin } from "$lib/firebase-admin";

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const sessionCookie = cookies.get("__session");

    if (!sessionCookie) {
      return json({ authenticated: false }, { status: 401 });
    }

    const auth = getAuthAdmin();
    if (!auth) {
      return json({ error: "Firebase Auth not initialized" }, { status: 500 });
    }

    // Verify session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    return json({
      authenticated: true,
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      name: decodedClaims.name,
      picture: decodedClaims.picture,
    });
  } catch (error) {
    // Invalid or expired session
    cookies.delete("__session", { path: "/" });
    return json({ authenticated: false }, { status: 401 });
  }
};

export const POST: RequestHandler = async ({ request, cookies, url }) => {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return json({ error: "Missing ID token" }, { status: 400 });
    }

    const auth = getAuthAdmin();
    if (!auth) {
      return json({ error: "Firebase Auth not initialized" }, { status: 500 });
    }

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Determine if we're in development (localhost) or production
    const isLocalhost =
      url.hostname === "localhost" ||
      url.hostname.startsWith("127.0.0.1") ||
      url.hostname.startsWith("::1");
    const isSecure = !isLocalhost; // Only use secure in production

    // Set the session cookie
    cookies.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000, // in seconds
      httpOnly: true,
      secure: isSecure, // Set to false for localhost development
      path: "/",
      sameSite: "lax", // Changed to 'lax' for better localhost compatibility
    });

    return json({ success: true });
  } catch (error) {
    console.error("Session creation error:", error);
    return json({ error: "Failed to create session" }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ cookies }) => {
  try {
    cookies.delete("__session", { path: "/" });
    return json({ success: true });
  } catch (error) {
    console.error("Session deletion error:", error);
    return json({ error: "Failed to delete session" }, { status: 500 });
  }
};
