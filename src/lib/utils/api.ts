import { auth } from "$lib/firebase";

/**
 * Creates headers with Authorization token for authenticated API calls
 * @returns Record<string, string> - Headers object with Content-Type and Authorization if user is available
 */
export async function createAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Wait for auth state to be ready
  let user = auth.currentUser;

  if (!user) {
    // If user is not immediately available, wait a bit for auth to initialize
    await new Promise<void>((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((authUser) => {
        unsubscribe();
        user = authUser;
        resolve();
      });
    });
  }

  if (user) {
    const token = await user.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Makes an authenticated fetch request with proper headers
 * @param url - The URL to fetch
 * @param options - Fetch options (method, body, etc.)
 * @returns Promise<Response> - The fetch response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = await createAuthHeaders();

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers, // Allow overriding headers
    },
  });
}
