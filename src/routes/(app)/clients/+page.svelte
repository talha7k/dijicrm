<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { requireCompany } from '$lib/utils/auth';
  import { clientManagementStore } from '$lib/stores/clientManagement';
  import { clientInvoicesStore } from '$lib/stores/clientInvoices';
  import { userProfile } from '$lib/stores/user';
    import Button from '$lib/components/ui/button/button.svelte';
    import { Badge } from '$lib/components/ui/badge';
    import * as Card from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input/index.js';
    import * as Select from '$lib/components/ui/select/index.js';
    import Loading from '$lib/components/ui/loading/loading.svelte';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
    import type { UserProfile } from '$lib/types/user';
   import type { ClientInvoice } from '$lib/stores/clientInvoices';
   import { toast } from 'svelte-sonner';

   // Company access is checked at layout level

   const clientStore = clientManagementStore;
   const invoiceStore = clientInvoicesStore;
     let clients = $state<UserProfile[]>([]);
     let invoices = $state<ClientInvoice[]>([]);
     let loading = $state(false);
     let error = $state<string | null>(null);
     let searchQuery = $state('');
     let statusFilter = $state('all');
     let activityFilter = $state('all');
     let invoiceCounts = $state<Record<string, number>>({});

     const statusDisplay = $derived(
         statusFilter === 'all' ? 'All Status' :
         statusFilter === 'active' ? 'Active' :
         statusFilter === 'added' ? 'Added' :
         statusFilter === 'invited' ? 'Invited' :
         statusFilter === 'inactive' ? 'Inactive' :
         'Status'
     );

     const activityDisplay = $derived(
         activityFilter === 'all' ? 'All Activity' :
         activityFilter === 'active' ? 'Active' :
         activityFilter === 'recent' ? 'Recent' :
         activityFilter === 'inactive' ? 'Inactive' :
         'Activity'
     );

     // Subscribe to stores
     $effect.pre(() => {
       clientStore.subscribe(state => {
         clients = state.clients;
         loading = state.loading;
         error = state.error;
         invoiceCounts = state.invoiceCounts || {};
       });

       invoiceStore.subscribe(state => {
         invoices = state.data || [];
       });
     });

     // Filter clients based on search and filters
     const filteredClients = $derived(clients.filter((client: UserProfile) => {
       // Search filter
       const matchesSearch = searchQuery === '' ||
         client.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         client.email?.toLowerCase().includes(searchQuery.toLowerCase());

       // Status filter
       const clientStatus = client.metadata?.accountStatus || 'unknown';
       const matchesStatus = statusFilter === 'all' || clientStatus === statusFilter;

       // Activity filter
       const activity = getActivityIndicator(client);
       const matchesActivity = activityFilter === 'all' ||
         activity.label.toLowerCase() === activityFilter;

       return matchesSearch && matchesStatus && matchesActivity;
     }));

  onMount(() => {
    // Load clients for current company
    clientStore.loadClients();
  });

  function getStatusBadge(client: UserProfile) {
    const status = client.metadata?.accountStatus || 'unknown';
    const variant = status === 'active' ? 'default' as const :
                    status === 'added' ? 'default' as const :
                    status === 'invited' ? 'secondary' as const :
                    status === 'inactive' ? 'destructive' as const : 'outline' as const;

    return { status: status.charAt(0).toUpperCase() + status.slice(1), variant };
  }

   function getClientInvoiceCount(clientId: string) {
     return invoiceCounts[clientId] || 0;
   }

  function getActivityIndicator(client: UserProfile) {
    const daysSinceLogin = client.lastLoginAt
      ? Math.floor((new Date().getTime() - client.lastLoginAt.toDate().getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLogin <= 7) return { color: 'text-green-500', label: 'Active' };
    if (daysSinceLogin <= 30) return { color: 'text-yellow-500', label: 'Recent' };
    return { color: 'text-gray-400', label: 'Inactive' };
  }

  function handleCreateClient() {
    goto('/clients/create');
  }

  function handleClientClick(clientId: string) {
    goto(`/clients/${clientId}`);
  }

  async function handleInviteClient(clientId: string) {
    try {
      // Get current user ID from user store
      let currentUserId = '';
      userProfile.subscribe(profile => {
        currentUserId = profile.data?.uid || '';
      })();

      await clientStore.inviteClient(clientId, currentUserId);
      // No need to reload clients - the store will update via Firestore listener
      // No need to show toast here - the store already shows appropriate notifications
    } catch (error) {
      console.error('Error inviting client:', error);
      // Error toast is already shown by the store, but we'll show one here for UI consistency
      toast.error('Failed to send invitation');
    }
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
         Manage your client accounts and add new clients
       </p>
    </div>
    <Button onclick={handleCreateClient}>
      <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
      </svg>
           Add Client
    </Button>
  </div>

  <!-- Search and Filters -->
  <div class="flex flex-col sm:flex-row gap-4">
    <div class="flex-1">
      <Input
        placeholder="Search clients by name or email..."
        bind:value={searchQuery}
        class="max-w-sm"
      />
    </div>
    <div class="flex gap-2">
       <Select.Root type="single" bind:value={statusFilter}>
         <Select.Trigger class="w-32">
           {statusDisplay}
         </Select.Trigger>
         <Select.Content>
           <Select.Item value="all">All Status</Select.Item>
           <Select.Item value="active">Active</Select.Item>
           <Select.Item value="added">Added</Select.Item>
           <Select.Item value="invited">Invited</Select.Item>
           <Select.Item value="inactive">Inactive</Select.Item>
         </Select.Content>
      </Select.Root>

       <Select.Root type="single" bind:value={activityFilter}>
         <Select.Trigger class="w-32">
           {activityDisplay}
         </Select.Trigger>
        <Select.Content>
          <Select.Item value="all">All Activity</Select.Item>
          <Select.Item value="active">Active</Select.Item>
          <Select.Item value="recent">Recent</Select.Item>
          <Select.Item value="inactive">Inactive</Select.Item>
        </Select.Content>
      </Select.Root>
    </div>
  </div>

  {#if error}
    <div class="rounded-md bg-destructive/15 p-4 text-destructive">
      {error}
    </div>
  {/if}

    {#if loading}
      <div class="flex items-center justify-center p-8">
        <Loading message="Loading clients..." />
      </div>
  {:else if clients.length === 0}
    <div class="flex flex-col items-center justify-center p-8 text-center">
      <svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
      </svg>
      <h3 class="mt-4 text-lg font-semibold">No clients yet</h3>
       <p class="mt-2 text-muted-foreground">
         Get started by generating sample data or adding your first client.
       </p>
      <div class="flex gap-2 mt-4">
        <Button onclick={() => goto("/settings")}>
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
          </svg>
          Generate Sample Data
        </Button>
        <Button variant="outline" onclick={handleCreateClient}>
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Add Client
        </Button>
      </div>
    </div>
   {:else}
     <div class="mb-4 text-sm text-muted-foreground">
       Showing {filteredClients.length} of {clients.length} clients
     </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each filteredClients as client: UserProfile (client.uid)}
        <Card.Root
          class="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/20 hover:bg-muted/30"
          onclick={() => handleClientClick(client.uid)}
          role="button"
          tabindex={0}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClientClick(client.uid);
            }
          }}
        >
           <Card.Header class="pb-3">
             <div class="flex items-start justify-between">
               <div class="flex-1 min-w-0">
                 <Card.Title class="text-lg truncate">{client.displayName}</Card.Title>
                  <Card.Description class="text-sm text-muted-foreground truncate">
                    {client.email}
                  </Card.Description>
                  <div class="mt-2">
                    <Badge variant={getStatusBadge(client).variant}>
                      {getStatusBadge(client).status}
                    </Badge>
                  </div>
                </div>
                <div class="flex items-center shrink-0">
                  <DropdownMenu.Root>
                   <DropdownMenu.Trigger>
                     {#snippet child({ props })}
                       <Button
                         variant="ghost"
                         size="sm"
                         class="h-8 w-8 p-0"
                         {...props}
                         onclick={(e) => e.stopPropagation()}
                       >
                         <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                         </svg>
                       </Button>
                     {/snippet}
                   </DropdownMenu.Trigger>
                   <DropdownMenu.Content align="end" class="w-48">
                     <DropdownMenu.Item
                       onclick={(e) => {
                         e.stopPropagation();
                         handleInviteClient(client.uid);
                       }}
                     >
                       <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                       </svg>
                       Send Invite
                     </DropdownMenu.Item>
                   </DropdownMenu.Content>
                 </DropdownMenu.Root>
               </div>
             </div>
           </Card.Header>
           <Card.Content class="pt-0">
             <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Invoices</span>
                <span class="font-medium">{getClientInvoiceCount(client.uid)}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Activity</span>
                <div class="flex items-center space-x-1">
                  <div class="w-2 h-2 rounded-full {getActivityIndicator(client).color}"></div>
                  <span class="text-xs">{getActivityIndicator(client).label}</span>
                </div>
              </div>
            </div>
          </Card.Content>
            <Card.Footer class="pt-3">
              <span class="text-xs text-muted-foreground">Click to view details</span>
            </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>