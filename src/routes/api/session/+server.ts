import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthAdmin } from '$lib/firebase-admin';

// This API endpoint is kept for compatibility but you can now use bearer tokens directly
export const POST: RequestHandler = async ({ request, cookies, url }) => {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return json({ error: 'Missing ID token' }, { status: 400 });
    }

    const auth = getAuthAdmin();
    if (!auth) {
      return json({ error: 'Firebase Auth not initialized' }, { status: 500 });
    }

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Determine if we're in development (localhost) or production
    const isLocalhost = url.hostname === 'localhost' || url.hostname.startsWith('127.0.0.1') || url.hostname.startsWith('::1');
    const isSecure = !isLocalhost; // Only use secure in production

    // Set the session cookie
    cookies.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000, // in seconds
      httpOnly: true,
      secure: isSecure, // Set to false for localhost development
      path: '/',
      sameSite: 'lax', // Changed to 'lax' for better localhost compatibility
    });

    return json({ success: true });
  } catch (error) {
    console.error('Session creation error:', error);
    return json({ error: 'Failed to create session' }, { status: 500 });
  }
};

// For bearer token authentication, you can now make direct calls to your API endpoints
// with the Authorization: Bearer <token> header