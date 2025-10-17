<script lang="ts">
  import AppSidebar from "$lib/components/navigation/app-sidebar.svelte";
  import AutoBreadcrumb from "$lib/components/shared/auto-breadcrumb.svelte";
  import DarkModeToggle from "$lib/components/shared/dark-mode-toggle.svelte";
  import UserAvatarDropdown from "$lib/components/shared/user-avatar-dropdown.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { isSidebarOpen } from "$lib/stores/sidebar";
  import { app } from "$lib/stores/app";
  import { initializeAppFromServerData } from "$lib/services/initService";
  import type { UserProfile } from "$lib/types/user";
  import type { Company } from "$lib/types/company";
  import type { CompanyMember } from "$lib/types/companyMember";
  
  // Stage 3: Populating the Svelte Stores
  type SessionData = {
    profile: UserProfile;
    company: Company;
    membership: CompanyMember;
  };
  
  // Receive server data - this will only be present if user passed server-side checks
  let { data, children } = $props<{ data: SessionData; children: any }>();
  
  // Initialize app with server-side data when available
  // This will set authenticated: true, profileReady: true, companyReady: true
  if (data?.profile && data?.company && data?.membership) {
    initializeAppFromServerData(data);
  }
</script>

{#if $app.initializing}
  <div class="flex h-full w-full items-center justify-center">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
      ></div>
      <p class="text-muted-foreground">Setting up your workspace...</p>
    </div>
  </div>
{:else if !$app.authenticated}
  <!-- Will redirect to sign-in via server-side redirect -->
{:else if !$app.profileReady}
  <!-- Will redirect to onboarding via server-side redirect -->
{:else if !$app.companyReady}
  <!-- Will redirect to onboarding via server-side redirect -->
{:else}
  <Sidebar.Provider bind:open={$isSidebarOpen}>
    <AppSidebar variant="inset" />
    <Sidebar.Inset class="rounded-tl-2xl border-l border-t">
      <header
        class="flex h-16 shrink-0 items-center justify-between gap-2 border-b pl-2"
      >
        <div class="flex items-center gap-2 px-3">
          <AutoBreadcrumb />
        </div>
        <div class="flex items-center gap-2 px-4">
          <DarkModeToggle />
          <UserAvatarDropdown />
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pl-5">
        {@render children()}
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{/if}
