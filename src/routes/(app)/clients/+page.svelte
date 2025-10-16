<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { requireCompany } from '$lib/utils/auth';
   import { clientManagementStore } from '$lib/stores/clientManagement';
   import { ordersStore } from '$lib/stores/orders';
   import { userProfile } from '$lib/stores/user';
   import { companyContext } from '$lib/stores/companyContext';
   import { db } from '$lib/firebase';
   import { collection, query, where, getDocs } from 'firebase/firestore';
   import { get } from 'svelte/store';
    import Button from '$lib/components/ui/button/button.svelte';
    import { Badge } from '$lib/components/ui/badge';
    import * as Card from '$lib/components/ui/card';
    import { Input } from '$lib/components/ui/input/index.js';
    import * as Select from '$lib/components/ui/select/index.js';
    import Loading from '$lib/components/ui/loading/loading.svelte';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
    import type { UserProfile } from '$lib/types/user';
   import type { Order } from '$lib/types/document';
   import { toast } from 'svelte-sonner';

   // Company access is checked at layout level

   const clientStore = clientManagementStore;
    const orderStore = ordersStore;
     let clients = $state<UserProfile[]>([]);
      let orders = $state<Order[]>([]);
     let loading = $state(false);
     let error = $state<string | null>(null);
     let searchQuery = $state('');
     let statusFilter = $state('all');
      let activityFilter = $state('all');
      let orderCounts = $state<Record<string, number>>({});
      
      // Delete confirmation state
       let showDeleteDialog = $state(false);
       let clientToDelete = $state<{ id: string; name: string } | null>(null);
       let isDeleting = $state(false);
let deleteDataCounts = $state<{
  orders: number;
  payments: number;
  documents: number;
  emails: number;
}>({ orders: 0, payments: 0, documents: 0, emails: 0 });
       let isLoadingCounts = $state(false);

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
          orderCounts = state.orderCounts || {};
       });

        orderStore.subscribe(state => {
          orders = state.data || [];
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
      return orderCounts[clientId] || 0;
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

  async function handleDeleteClient(clientId: string, clientName: string) {
    clientToDelete = { id: clientId, name: clientName };
    isLoadingCounts = true;
    
    try {
      // Get client email for email history lookup
      const client = clientStore.getClient(clientId);
      const clientEmail = client?.email || '';
      
      // Get active company ID
      const companyContextValue = get(companyContext);
      const companyId = companyContextValue.data?.companyId;
      
       // Count related data
        const counts = { orders: 0, payments: 0, documents: 0, emails: 0 };
      
      if (companyId) {
        // Count orders
        const ordersQuery = query(
          collection(db, "orders"),
          where("clientId", "==", clientId),
          where("companyId", "==", companyId)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        counts.orders = ordersSnapshot.size;
      }
      
      // Count document deliveries
      const deliveriesQuery = query(
        collection(db, "documentDeliveries"),
        where("clientId", "==", clientId)
      );
      const deliveriesSnapshot = await getDocs(deliveriesQuery);
      counts.documents = deliveriesSnapshot.size;
      
      // Count email history
      if (clientEmail) {
        const emailQuery = query(
          collection(db, "emailHistory"),
          where("recipient", "==", clientEmail)
        );
        const emailSnapshot = await getDocs(emailQuery);
        counts.emails = emailSnapshot.size;
      }
      
      deleteDataCounts = counts;
      showDeleteDialog = true;
    } catch (error) {
      console.error('Error fetching delete counts:', error);
      toast.error('Failed to load client data for deletion');
    } finally {
      isLoadingCounts = false;
    }
  }

  async function confirmDeleteClient() {
    if (!clientToDelete) return;

    isDeleting = true;
    try {
      await clientStore.deleteClient(clientToDelete.id);
      toast.success(`Client "${clientToDelete.name}" and all related data have been deleted`);
      showDeleteDialog = false;
      clientToDelete = null;
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    } finally {
      isDeleting = false;
    }
  }

  function cancelDelete() {
    showDeleteDialog = false;
    clientToDelete = null;
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
    <div class="flex gap-2">
      <Button onclick={handleCreateClient}>
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
             Add Client
      </Button>
    </div>
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
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item
                        class="text-destructive focus:text-destructive"
                        onclick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(client.uid, client.displayName || 'Unknown Client');
                        }}
                      >
                        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Delete Client
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

  <!-- Delete Confirmation Dialog -->
  {#if showDeleteDialog && clientToDelete}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center mb-4">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Delete Client</h3>
            <p class="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>
        
        <div class="mb-6">
          <p class="text-gray-700 mb-2">
            Are you sure you want to delete <strong>{clientToDelete.name}</strong>?
          </p>
          
          {#if isLoadingCounts}
            <div class="flex items-center justify-center py-4">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-sm text-gray-600">Loading related data...</span>
            </div>
          {:else}
            <p class="text-sm text-gray-600 mb-3">
              This will permanently remove the client and all their related data:
            </p>
            <div class="bg-gray-50 rounded-lg p-3 space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">📋 Orders</span>
                <span class="text-sm font-medium text-gray-900">{deleteDataCounts.orders} items</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">🧾 Invoices</span>
                <span class="text-sm font-medium text-gray-900">{deleteDataCounts.orders} items</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">📄 Documents</span>
                <span class="text-sm font-medium text-gray-900">{deleteDataCounts.documents} items</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">📧 Email History</span>
                <span class="text-sm font-medium text-gray-900">{deleteDataCounts.emails} items</span>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-gray-200">
                <span class="text-sm text-gray-600">👤 Client Profile</span>
                <span class="text-sm font-medium text-gray-900">1 profile</span>
              </div>
            </div>
            <div class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-sm text-yellow-800">
                <strong>⚠️ Warning:</strong> This action cannot be undone and will permanently remove all data listed above.
              </p>
            </div>
          {/if}
        </div>

        <div class="flex justify-end space-x-3">
          <Button
            variant="outline"
            onclick={cancelDelete}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onclick={confirmDeleteClient}
            disabled={isDeleting}
          >
            {#if isDeleting}
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deleting...
            {:else}
              Delete Client
            {/if}
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>