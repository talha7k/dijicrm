import { writable } from "svelte/store";

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
