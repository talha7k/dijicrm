<script lang="ts">
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";
  import AppSidebar from "$lib/components/app/nav/app-sidebar.svelte";
  import AutoBreadcrumb from "$lib/components/shared/auto-breadcrumb.svelte";
  import DarkModeToggle from "$lib/components/shared/dark-mode-toggle.svelte";
  import UserAvatarDropdown from "$lib/components/shared/user-avatar-dropdown.svelte";
  import { Separator } from "$lib/components/ui/separator";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import {
    firekitUser,
    firekitPresence,
    firekitDoc,
    firekitDocMutations,
  } from "svelte-firekit";
  import { userProfile } from "$lib/stores/user";
  import { companyContext } from "$lib/stores/companyContext";
  import { isSidebarOpen } from "$lib/stores/sidebar";
  import type { UserProfile } from "$lib/types/user";
  let { children } = $props();
  const config: any = {
    geolocation: {
      enabled: true,
      type: "custom",
      requireConsent: true,
    },
    sessionTTL: 30 * 60 * 1000, // 30 minutes
    updateInterval: 60 * 1000, // 1 minute
  };
  import { redirectToDashboard } from "$lib/utils/auth";
  import { isProfileComplete } from "$lib/services/profileValidationService";

  // Track if we've already handled initial navigation to prevent loops
  let hasHandledInitialNavigation = $state(false);
  let hasInitializedPresence = $state(false);
  let profileCheckTimeout = $state<NodeJS.Timeout | null>(null);

  $effect(() => {
    if (hasHandledInitialNavigation) return;

    if (firekitUser.initialized && !firekitUser.isAuthenticated) {
      hasHandledInitialNavigation = true;
      goto("/sign-in");
      return;
    }

    // Check profile completeness for authenticated users
    if (firekitUser.initialized && firekitUser.isAuthenticated) {
      const profile = get(userProfile);
      
      console.log("Layout: Checking profile state", {
        hasData: !!profile.data,
        isLoading: profile.loading,
        hasError: !!profile.error,
        profileData: profile.data
      });

      // If profile is loading, wait a bit and check again
      if (profile.loading) {
        if (!profileCheckTimeout) {
          profileCheckTimeout = setTimeout(() => {
            console.log("Layout: Profile loading timeout, checking again");
            // The effect will run again with updated state
          }, 3000); // 3 second timeout
        }
        return;
      }

      // Clear timeout if we're not loading
      if (profileCheckTimeout) {
        clearTimeout(profileCheckTimeout);
        profileCheckTimeout = null;
      }

      // Check for profile errors
      if (profile.error) {
        console.error("Layout: Profile loading error:", profile.error);
        hasHandledInitialNavigation = true;
        goto("/onboarding");
        return;
      }

      // Check if profile data exists
      if (!profile.data) {
        console.log("Layout: No profile data found, redirecting to onboarding");
        hasHandledInitialNavigation = true;
        goto("/onboarding");
        return;
      }

      // Check profile completeness
      if (!isProfileComplete(profile.data)) {
        console.log("Layout: Profile is incomplete, redirecting to onboarding");
        hasHandledInitialNavigation = true;
        goto("/onboarding");
        return;
      }

      // Profile exists and is complete - allow access
      console.log("Layout: Profile is complete, allowing access");
    }
  });

  $effect(() => {
    if (
      firekitUser.initialized &&
      firekitUser.isAuthenticated &&
      !hasInitializedPresence &&
      firekitUser.user
    ) {
      hasInitializedPresence = true;
      // Small delay to ensure user data is stable before initializing presence
      setTimeout(() => {
        if (!firekitPresence.initialized) {
          firekitPresence.initialize(firekitUser.user, config);
        }
      }, 100);
    }
  });

  // Redirect to appropriate dashboard based on role after authentication
  $effect(() => {
    const user = get(userProfile);
    if (
      firekitUser.initialized &&
      firekitUser.isAuthenticated &&
      user.data?.role &&
      !hasHandledInitialNavigation
    ) {
      // Only redirect if we're on a generic route like /app
      const currentPath = window.location.pathname;
      if (currentPath === "/app" || currentPath === "/(app)") {
        hasHandledInitialNavigation = true;
        redirectToDashboard();
      }
    }
  });

  $effect(() => {
    const user = firekitUser.user;
    if (user && user.uid) {
      console.log("Layout: Initializing profile for user:", user.uid);
      const doc = firekitDoc<UserProfile>(`users/${user.uid}`);
      
      // Set up profile store with proper error handling
      userProfile.set({
        data: doc.data ?? undefined,
        loading: doc.loading,
        error: doc.error,
        update: async (data: Partial<UserProfile>) => {
          // Optimistic update - update local state immediately
          const currentData = doc.data;
          if (currentData) {
            const { Timestamp } = await import("@firebase/firestore");
            const optimisticData = {
              ...currentData,
              ...data,
              updatedAt: Timestamp.now(),
            };
            userProfile.update((store) => ({ ...store, data: optimisticData }));
          }

          try {
            await firekitDocMutations.update(`users/${user.uid}`, data);

            // Invalidate profile cache after successful update
            const { invalidateProfileCache } = await import(
              "$lib/utils/profile-cache"
            );
            invalidateProfileCache(user.uid);

            // Check for displayName
            if (
              data.displayName &&
              data.displayName !== (user as any).displayName
            ) {
              await (user as any).updateDisplayName(data.displayName);
            }

            if (data.photoURL && data.photoURL !== (user as any).photoURL) {
              await (user as any).updatePhotoURL(data.photoURL);
            }

            if (data.email && data.email !== (user as any).email) {
              await (user as any).updateEmail(data.email);
            }
          } catch (error) {
            // Revert optimistic update on error
            userProfile.update((store) => ({
              ...store,
              data: doc.data ?? undefined,
            }));
            throw error;
          }
        },
      });

      // Log profile state changes for debugging
      console.log("Layout: Profile doc state", {
        hasData: !!doc.data,
        isLoading: doc.loading,
        hasError: !!doc.error,
        error: doc.error
      });
    } else {
      console.log("Layout: No authenticated user, clearing profile");
      userProfile.set({
        data: undefined,
        loading: false,
        error: null,
        update: async () => {},
      });
    }
  });

  // Initialize company context when user profile is loaded
  $effect(() => {
    const profile = get(userProfile);
    if (profile.data && !profile.loading && !profile.error) {
      console.log("Layout: Initializing company context for complete profile");
      get(companyContext).initializeFromUser();
    } else if (profile.error) {
      console.error("Layout: Cannot initialize company context due to profile error:", profile.error);
    } else if (!profile.loading && !profile.data) {
      console.log("Layout: Cannot initialize company context - no profile data");
    }
  });
</script>

<Sidebar.Provider bind:open={$isSidebarOpen}>
  <AppSidebar variant="inset" />
  <Sidebar.Inset>
    <header
      class="flex h-16 shrink-0 items-center justify-between gap-2 border-b"
    >
      <div class="flex items-center gap-2 px-3">
        <AutoBreadcrumb />
      </div>
      <div class="flex items-center gap-2 px-4">
        <DarkModeToggle />
        <UserAvatarDropdown />
      </div>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
