<script lang="ts">
  import { goto } from "$app/navigation";
  import AppSidebar from "$lib/components/app/nav/app-sidebar.svelte";
  import AutoBreadcrumb from "$lib/components/shared/auto-breadcrumb.svelte";
  import DarkModeToggle from "$lib/components/shared/dark-mode-toggle.svelte";
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
  $effect(() => {
    if (firekitUser.initialized && !firekitUser.isAuthenticated) {
      goto("/sign-in");
    }
    if (firekitUser.initialized && !firekitPresence.initialized) {
      firekitPresence.initialize(firekitUser.user, config);
    }
  });

  $effect(() => {
    const user = firekitUser.user;
    if (user && user.uid) {
      const doc = firekitDoc<UserProfile>(`users/${user.uid}`);
      $effect(() => {
        userProfile.set({
          data: doc.data ?? undefined,
          loading: doc.loading,
          error: doc.error,
          update: async (data: Partial<UserProfile>) => {
            await firekitDocMutations.update(`users/${user.uid}`, data);

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
          },
        });
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
  <AppSidebar variant="inset" />
  <Sidebar.Inset>
    <header
      class="flex h-16 shrink-0 items-center justify-between gap-2 border-b"
    >
      <div class="flex items-center gap-2 px-3">
        <Sidebar.Trigger />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <AutoBreadcrumb />
      </div>
      <div class="flex items-center gap-2 px-4">
        <DarkModeToggle />
      </div>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
