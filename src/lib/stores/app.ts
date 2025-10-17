import { writable, derived } from "svelte/store";

type AppState = {
  initializing: boolean;
  authenticated: boolean;
  profileReady: boolean;
  companyReady: boolean;
  error: string | null;
};

export const app = writable<AppState>({
  initializing: true,
  authenticated: false,
  profileReady: false,
  companyReady: false,
  error: null,
});

// Unified loading state - true if any critical part is loading
export const isLoading = derived(
  app,
  ($app) =>
    $app.initializing ||
    ($app.authenticated && (!$app.profileReady || !$app.companyReady)),
);

// Ready state - true when app is fully ready to show content
export const isReady = derived(
  app,
  ($app) =>
    !$app.initializing &&
    $app.authenticated &&
    $app.profileReady &&
    $app.companyReady &&
    !$app.error,
);

// Should show loading UI - simplified logic
export const shouldShowLoading = derived(
  app,
  ($app) =>
    $app.initializing ||
    ($app.authenticated && (!$app.profileReady || !$app.companyReady)),
);
