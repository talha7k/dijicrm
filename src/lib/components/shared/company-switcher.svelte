<script lang="ts">
  import { userProfile } from '$lib/stores/user';
  import { goto } from '$app/navigation';
  import Icon from '@iconify/svelte';

  let showDropdown = $state(false);

  $: currentCompany = $userProfile.data?.companyAssociations?.[0]; // For now, assume first company
  $: companies = $userProfile.data?.companyAssociations || [];

  function switchCompany(companyId: string) {
    // In a full implementation, update current company context
    // For now, just close dropdown
    showDropdown = false;
    // TODO: Implement company switching logic
  }
</script>

<div class="company-switcher relative">
  {#if companies.length > 0}
    <button
      onclick={() => showDropdown = !showDropdown}
      class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div class="flex items-center gap-2">
        <Icon icon="lucide:building" class="h-4 w-4 text-gray-600" />
        <span class="text-sm font-medium text-gray-900">
          {currentCompany?.companyId || 'No Company'}
        </span>
      </div>
      {#if companies.length > 1}
        <Icon
          icon="lucide:chevron-down"
          class="h-4 w-4 text-gray-400 transition-transform {showDropdown ? 'rotate-180' : ''}"
        />
      {/if}
    </button>

    {#if showDropdown && companies.length > 1}
      <div class="absolute top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
        <div class="py-1">
          {#each companies as company}
            <button
              onclick={() => switchCompany(company.companyId)}
              class="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Icon icon="lucide:building" class="h-4 w-4 text-gray-600" />
              <div>
                <div class="text-sm font-medium text-gray-900">
                  {company.companyId}
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
  if (!e.target.closest('.company-switcher')) {
    showDropdown = false;
  }
}} />