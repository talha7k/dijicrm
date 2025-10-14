<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { requireCompany } from '$lib/utils/auth';
  import { clientManagementStore } from '$lib/stores/clientManagement';
  import { userProfile } from '$lib/stores/user';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import * as Table from '$lib/components/ui/table';
  import type { UserProfile } from '$lib/types/user';

   // Company access is checked at layout level

  const clientStore = clientManagementStore;
  let clients = $state<UserProfile[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Subscribe to store
  $effect(() => {
    clientStore.subscribe(state => {
      clients = state.clients;
      loading = state.loading;
      error = state.error;
    });
  });

  onMount(() => {
    // Load clients for current company
    // For now, use mock company ID
    clientStore.loadClients('company-1');
  });

  function getStatusBadge(client: UserProfile) {
    const status = client.metadata?.accountStatus || 'unknown';
    const variant = status === 'active' ? 'default' as const :
                    status === 'invited' ? 'secondary' as const :
                    status === 'inactive' ? 'destructive' as const : 'outline' as const;

    return { status: status.charAt(0).toUpperCase() + status.slice(1), variant };
  }

  function handleCreateClient() {
    goto('/clients/create');
  }

  function handleEditClient(clientId: string) {
    goto(`/clients/${clientId}/edit`);
  }
</script>

<svelte:head>
  <title>Client Management - CRM</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Client Management</h1>
      <p class="text-muted-foreground">
        Manage your client accounts and send invitations
      </p>
    </div>
    <Button onclick={handleCreateClient}>
      <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
      </svg>
      Invite Client
    </Button>
  </div>

  {#if error}
    <div class="rounded-md bg-destructive/15 p-4 text-destructive">
      {error}
    </div>
  {/if}

  <div class="rounded-md border">
    {#if loading}
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span class="ml-2">Loading clients...</span>
      </div>
    {:else if clients.length === 0}
      <div class="flex flex-col items-center justify-center p-8 text-center">
        <svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <h3 class="mt-4 text-lg font-semibold">No clients yet</h3>
        <p class="mt-2 text-muted-foreground">
          Get started by inviting your first client.
        </p>
        <Button onclick={handleCreateClient} class="mt-4">
          Invite Client
        </Button>
      </div>
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Email</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Last Login</Table.Head>
            <Table.Head class="text-right">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each clients as client (client.uid)}
            <Table.Row>
              <Table.Cell class="font-medium">
                {client.displayName}
              </Table.Cell>
              <Table.Cell>{client.email}</Table.Cell>
              <Table.Cell>
                <Badge variant={getStatusBadge(client).variant}>
                  {getStatusBadge(client).status}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {client.lastLoginAt.toDate().toLocaleDateString()}
              </Table.Cell>
              <Table.Cell class="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() => handleEditClient(client.uid)}
                >
                  Edit
                </Button>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
  </div>
</div>