import { derived } from "svelte/store";
import { authStore, AuthStatus } from "$lib/services/authService";

// Simplified app state - now just a thin wrapper around auth service
export const app = derived(authStore, ($authStore) => ({
  initializing: $authStore.status === AuthStatus.INITIALIZING,
  authenticated: $authStore.status === AuthStatus.AUTHENTICATED,
  profileReady: !!$authStore.profile,
  companyReady: !!$authStore.profile && !!$authStore.profile.currentCompanyId,
  error: $authStore.error,
}));

// Legacy derived stores for backward compatibility
export const isLoading = derived(
  app,
  ($app) =>
    $app.initializing ||
    ($app.authenticated && (!$app.profileReady || !$app.companyReady)),
);

export const isReady = derived(
  app,
  ($app) =>
    !$app.initializing &&
    $app.authenticated &&
    $app.profileReady &&
    $app.companyReady &&
    !$app.error,
);

export const shouldShowLoading = derived(
  app,
  ($app) =>
    $app.initializing ||
    ($app.authenticated && (!$app.profileReady || !$app.companyReady)),
);
