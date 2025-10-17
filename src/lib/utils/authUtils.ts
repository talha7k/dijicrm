/**
 * Creates headers for authenticated API calls using cookies
 * @returns Record<string, string> - Headers object with Content-Type
 */
export async function createAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  return headers;
}

/**
 * Makes an authenticated fetch request with proper headers
 * The authentication is handled by cookies, which are automatically sent with fetch requests
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
    credentials: 'include', // Include cookies in the request
    headers: {
      ...headers,
      ...options.headers, // Allow overriding headers
    },
  });
}
