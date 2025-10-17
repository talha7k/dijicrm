<script lang="ts">
  import AppSidebar from "$lib/components/navigation/app-sidebar.svelte";
  import AutoBreadcrumb from "$lib/components/shared/auto-breadcrumb.svelte";
  import DarkModeToggle from "$lib/components/shared/dark-mode-toggle.svelte";
  import UserAvatarDropdown from "$lib/components/shared/user-avatar-dropdown.svelte";
  import CompanySwitcher from "$lib/components/shared/company-switcher.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { isSidebarOpen } from "$lib/stores/sidebar";
  import { app } from "$lib/stores/app";
  import { goto } from "$app/navigation";

  let { children } = $props();

  $effect(() => {
    if (!$app.initializing && !$app.authenticated) {
      goto("/sign-in");
    } else if (!$app.initializing && $app.authenticated && $app.profileReady && !$app.companyReady) {
      // User is authenticated but needs company setup
      goto("/onboarding");
    }
  });
</script>

{#if $app.initializing}
  <div class="flex h-full w-full items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-muted-foreground">Setting up your workspace...</p>
    </div>
  </div>
{:else if !$app.authenticated}
  <!-- Will redirect to sign-in via effect -->
{:else if !$app.profileReady}
  <!-- Will redirect to onboarding via effect -->
{:else if !$app.companyReady}
  <!-- Will redirect to onboarding via effect -->
{:else}
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
          <CompanySwitcher />
          <DarkModeToggle />
          <UserAvatarDropdown />
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4">
        {@render children()}
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
{/if}
