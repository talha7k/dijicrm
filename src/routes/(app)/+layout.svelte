<script lang="ts">
  import AppSidebar from "$lib/components/app/nav/app-sidebar.svelte";
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
