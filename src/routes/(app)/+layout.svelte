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

      if (profile.data && !isProfileComplete(profile.data)) {
        // User is authenticated but profile is incomplete
        hasHandledInitialNavigation = true;
        goto("/onboarding");
        return;
      }

      if (profile.data === null && !profile.loading) {
        // Profile doesn't exist
        hasHandledInitialNavigation = true;
        goto("/onboarding");
        return;
      }

      // Profile exists and is complete, or still loading - allow access
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
      const doc = firekitDoc<UserProfile>(`users/${user.uid}`);
      userProfile.set({
        data: doc.data ?? undefined,
        loading: doc.loading,
        error: doc.error,
        update: async (data: Partial<UserProfile>) => {
          // Optimistic update - update local state immediately
          const currentData = doc.data;
          if (currentData) {
            const { Timestamp } = await import("@firebase/firestore");
            const optimisticData = { ...currentData, ...data, updatedAt: Timestamp.now() };
            userProfile.update(store => ({ ...store, data: optimisticData }));
          }

          try {
            await firekitDocMutations.update(`users/${user.uid}`, data);

            // Invalidate profile cache after successful update
            const { invalidateProfileCache } = await import("$lib/utils/profile-cache");
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
            userProfile.update(store => ({ ...store, data: doc.data ?? undefined }));
            throw error;
          }
        },
      });
    } else {
      userProfile.set({
        data: undefined,
        loading: false,
        error: null,
        update: async () => {},
      });
    }
  });
</script>

<Sidebar.Provider bind:open={$isSidebarOpen}>
  <AppSidebar variant="sidebar" />
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
