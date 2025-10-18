<script lang="ts">
   import { userProfile, authStore, AuthStatus } from '$lib/services/authService';
   import { companyContext, activeCompanyId } from '$lib/stores/companyContext';
   import { goto } from '$app/navigation';
   import { get } from 'svelte/store';
   import Icon from '@iconify/svelte';

  let showDropdown = $state(false);
  let switching = $state(false);

  let currentCompanyId = $derived(get(activeCompanyId));
  let companies = $derived($userProfile?.companyAssociations || []);
  let currentCompany = $derived(companies.find((c: any) => c.companyId === currentCompanyId) || companies[0]);
  let companyContextData = $derived(get(companyContext));

   async function switchCompany(companyId: string) {
     if (companyId === currentCompanyId || switching) {
       showDropdown = false;
       return;
     }

     try {
       switching = true;

       // Wait for auth to be ready before switching companies
       const authState = get(authStore);
       if (authState.status === AuthStatus.INITIALIZING || authState.status === AuthStatus.AUTHENTICATING || !authState.profile) {
         console.log('Waiting for auth to be ready before switching companies...');
         await new Promise<void>((resolve) => {
           const unsubscribe = authStore.subscribe((state) => {
             if (state.status !== AuthStatus.INITIALIZING && state.status !== AuthStatus.AUTHENTICATING && state.profile) {
               unsubscribe();
               resolve();
             }
           });
         });
       }

       const context = get(companyContext);

       // Use the existing switchCompany function from companyContext
       await context.switchCompany(companyId);

       // Navigate to dashboard to refresh the context
       goto('/dashboard');
     } catch (error) {
       console.error('Failed to switch company:', error);
       // TODO: Show error toast
     } finally {
       switching = false;
       showDropdown = false;
     }
   }
</script>

<div class="company-switcher relative">
  {#if companies.length > 0}
<button
       onclick={() => showDropdown = !showDropdown}
       class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
       disabled={switching}
     >
      <div class="flex items-center gap-2">
        <Icon icon="lucide:building" class="h-4 w-4 text-gray-600" />
<span class="text-sm font-medium text-gray-900">
           {companyContextData.data?.company?.name || currentCompany?.companyId || 'No Company'}
         </span>
      </div>
{#if companies.length > 1}
         {#if switching}
           <Icon icon="lucide:loader-2" class="h-4 w-4 text-gray-400 animate-spin" />
         {:else}
           <Icon
             icon="lucide:chevron-down"
             class="h-4 w-4 text-gray-400 transition-transform {showDropdown ? 'rotate-180' : ''}"
           />
         {/if}
       {/if}
    </button>

    {#if showDropdown && companies.length > 1}
      <div class="absolute top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
        <div class="py-1">
          {#each companies as company}
<button
               onclick={() => switchCompany(company.companyId)}
               class="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
               disabled={switching}
             >
              <Icon icon="lucide:building" class="h-4 w-4 text-gray-600" />
<div>
                 <div class="text-sm font-medium text-gray-900">
                   {company.companyId}
                   {#if company.companyId === currentCompanyId}
                     <span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Current</span>
                   {/if}
                 </div>
                 <div class="text-xs text-gray-500 capitalize">
                   {company.role}
                 </div>
               </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Close dropdown when clicking outside -->
<svelte:window onclick={(e) => {
  if (e.target && !(e.target as HTMLElement).closest('.company-switcher')) {
    showDropdown = false;
  }
}} />