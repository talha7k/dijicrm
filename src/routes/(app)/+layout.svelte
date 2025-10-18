<script lang="ts">
  import AppSidebar from "$lib/components/navigation/app-sidebar.svelte";
  import AutoBreadcrumb from "$lib/components/shared/auto-breadcrumb.svelte";
  import DarkModeToggle from "$lib/components/shared/dark-mode-toggle.svelte";
  import UserAvatarDropdown from "$lib/components/shared/user-avatar-dropdown.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { isSidebarOpen } from "$lib/stores/sidebar";
  import { initializeAuth, isLoading, authError, readyForApp } from "$lib/services/authService";
  import Loading from "$lib/components/ui/loading/loading.svelte";
  import { onMount } from "svelte";
  
  let { children } = $props();
  
  // Initialize auth service when component mounts
  onMount(() => {
    initializeAuth();
  });
</script>

{#if $isLoading}
  <div class="flex h-screen w-full items-center justify-center">
    <Loading message="Initializing application..." size="lg" />
  </div>
{:else if $authError}
  <div class="flex h-screen w-full items-center justify-center">
    <div class="text-center">
      <p class="text-destructive mb-2">Authentication Error</p>
      <p class="text-sm text-muted-foreground">{$authError}</p>
    </div>
  </div>
{:else if $readyForApp}
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
{:else}
  <!-- User not ready for app - should be handled by auth layout redirects -->
  <div class="flex h-screen w-full items-center justify-center">
    <Loading message="Preparing your workspace..." size="lg" />
  </div>
{/if}