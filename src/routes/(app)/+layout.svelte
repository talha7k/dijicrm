<script lang="ts">
  import AppSidebar from "$lib/components/navigation/app-sidebar.svelte";
  import AutoBreadcrumb from "$lib/components/shared/auto-breadcrumb.svelte";
  import DarkModeToggle from "$lib/components/shared/dark-mode-toggle.svelte";
  import UserAvatarDropdown from "$lib/components/shared/user-avatar-dropdown.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import { isSidebarOpen } from "$lib/stores/sidebar";
  import { initializeAuth, isLoading, authError, readyForApp, requiresOnboarding, isAuthenticated } from "$lib/services/authService";
  import Loading from "$lib/components/ui/loading/loading.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { companyContextData } from "$lib/stores/companyContext";
  import type { CompanyMember } from "$lib/types/companyMember";
  
  let { children, data }: { children: any; data: { profile: any; company: any; membership: CompanyMember } } = $props();
  
  // Initialize auth service when component mounts
  onMount(() => {
    console.log('🔍 Layout server data:', data);
    console.log('🔍 Profile keys:', data?.profile ? Object.keys(data.profile) : 'No profile');
    console.log('🔍 currentCompanyId:', data?.profile?.currentCompanyId);
    
    initializeAuth();
    
    // Initialize company context with server data
    if (data?.profile && data?.company && data?.membership) {
      console.log('🏢 Initializing company context with server data:', {
        companyId: data.profile.currentCompanyId,
        company: data.company.name,
        role: data.membership.role
      });
      
      companyContextData.set({
        data: {
          companyId: data.profile.currentCompanyId,
          company: data.company,
          role: data.membership.role,
          permissions: data.membership.permissions || []
        },
        loading: false,
        error: null,
        hasServerData: true
      });
    } else {
      console.log('❌ Missing data for company context:', {
        hasProfile: !!data?.profile,
        hasCompany: !!data?.company,
        hasMembership: !!data?.membership
      });
    }
  });

  // Redirect to onboarding if user is authenticated but needs onboarding
  $effect(() => {
    if ($isAuthenticated && $requiresOnboarding && !$isLoading) {
      goto("/onboarding");
    }
  });

  // Redirect unauthenticated users to sign-in
  $effect(() => {
    if (!$isAuthenticated && !$isLoading) {
      goto("/sign-in");
    }
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
{:else if $readyForApp && !$requiresOnboarding}
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
{:else if $isAuthenticated}
  <!-- Authenticated user but not ready for app (needs onboarding) -->
  <div class="flex h-screen w-full items-center justify-center">
    <Loading message="Preparing your workspace..." size="lg" />
  </div>
{:else}
  <!-- Unauthenticated user - redirect to sign-in -->
  <div class="flex h-screen w-full items-center justify-center">
    <Loading message="Redirecting to sign-in..." size="lg" />
  </div>
{/if}