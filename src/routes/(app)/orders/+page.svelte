<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { ordersStore } from '$lib/stores/orders';
  import { activeCompanyId } from '$lib/stores/companyContext';
  import { clientManagementStore } from '$lib/stores/clientManagement';
  import type { Order } from '$lib/types/document';
  import OrderCard from '$lib/components/app/client/OrderCard.svelte';
  import PaymentModal from '$lib/components/app/client/PaymentModal.svelte';
  import * as Card from '$lib/components/ui/card';
  import Button from '$lib/components/ui/button/button.svelte';
  import { toast } from 'svelte-sonner';

  let orders = $state<Order[]>([]);
  let clients = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');

  // Filtering state
  let selectedClientFilter = $state<string>('all');
  let selectedStatusFilter = $state<string>('all');
  let selectedDateFilter = $state<string>('all');
  let filteredOrders = $state<Order[]>([]);

  // Payment modal state
  let showPaymentModal = $state(false);
  let selectedOrder = $state<Order | null>(null);

  // Load orders and clients on mount
  onMount(async () => {
    try {
      const companyId = get(activeCompanyId);
      if (!companyId) {
        throw new Error('No active company found');
      }
      await Promise.all([
        ordersStore.loadOrders(companyId),
        clientManagementStore.loadClients()
      ]);
    } catch (err) {
      console.error('Failed to load data:', err);
      error = 'Failed to load orders';
      toast.error('Failed to load orders');
    } finally {
      loading = false;
    }
  });

  // Subscribe to stores for real-time updates
  $effect(() => {
    const unsubscribeOrders = ordersStore.subscribe((state) => {
      if (state.data) {
        orders = state.data;
      }
      loading = state.loading;
      if (state.error) {
        error = state.error;
        toast.error(state.error);
      }
    });

    const unsubscribeClients = clientManagementStore.subscribe((state) => {
      if (state.clients) {
        clients = state.clients;
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeClients();
    };
  });

  // Filter orders based on selected filters
  $effect(() => {
    let filtered = [...orders];

    // Filter by client
    if (selectedClientFilter !== 'all') {
      filtered = filtered.filter(order => order.clientId === selectedClientFilter);
    }

    // Filter by status
    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatusFilter);
    }

    // Filter by date
    if (selectedDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate() || new Date();
        switch (selectedDateFilter) {
          case 'today':
            return orderDate >= today;
          case 'week':
            return orderDate >= thisWeek;
          case 'month':
            return orderDate >= thisMonth;
          default:
            return true;
        }
      });
    }

    filteredOrders = filtered;
  });

  function handleRecordPayment(order: Order) {
    selectedOrder = order;
    showPaymentModal = true;
  }

  function handlePaymentComplete() {
    // Refresh the orders data after payment
    toast.success('Payment recorded successfully');
    showPaymentModal = false;
    // Reload orders
    const companyId = get(activeCompanyId);
    if (companyId) {
      ordersStore.loadOrders(companyId);
    }
  }

  // Get unique clients for filter dropdown
  function getUniqueClients() {
    const clientMap = new Map();
    orders.forEach(order => {
      const client = clients.find(c => c.uid === order.clientId);
      if (client) {
        clientMap.set(order.clientId, client.displayName || client.email || 'Unknown Client');
      }
    });
    return Array.from(clientMap.entries());
  }

  function handleViewOrder(order: Order) {
    goto(`/orders/${order.id}`);
  }
</script>

<div class="w-full p-6">
  <!-- Page Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Orders</h1>
      <p class="text-muted-foreground mt-1">Manage and track all your orders</p>
    </div>
    <Button onclick={() => goto('/orders/create')} class="flex items-center gap-2">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      Create Order
    </Button>
  </div>

  <!-- Filters -->
  {#if !loading && !error}
    <div class="bg-card border rounded-lg p-4 mb-6">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium text-foreground">Filter by:</span>
        </div>

        <!-- Client Filter -->
        <div class="flex items-center space-x-2">
          <label for="client-filter" class="text-sm text-muted-foreground">Client:</label>
          <select
            id="client-filter"
            bind:value={selectedClientFilter}
            disabled={loading}
            class="px-3 py-1 text-sm border rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All Clients</option>
            {#if clients.length > 0}
              {#each getUniqueClients() as [clientId, clientName]}
                <option value={clientId}>{clientName}</option>
              {/each}
            {/if}
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center space-x-2">
          <label for="status-filter" class="text-sm text-muted-foreground">Status:</label>
          <select
            id="status-filter"
            bind:value={selectedStatusFilter}
            disabled={loading}
            class="px-3 py-1 text-sm border rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="quote">Quote</option>
            <option value="generated">Generated</option>
            <option value="sent">Sent</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Date Filter -->
        <div class="flex items-center space-x-2">
          <label for="date-filter" class="text-sm text-muted-foreground">Date:</label>
          <select
            id="date-filter"
            bind:value={selectedDateFilter}
            disabled={loading}
            class="px-3 py-1 text-sm border rounded-md bg-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <!-- Clear Filters Button -->
        {#if selectedClientFilter !== 'all' || selectedStatusFilter !== 'all' || selectedDateFilter !== 'all'}
          <div class="ml-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onclick={() => {
                selectedClientFilter = 'all';
                selectedStatusFilter = 'all';
                selectedDateFilter = 'all';
              }}
            >
              Clear Filters
            </Button>
          </div>
        {/if}

        <!-- Results Count -->
        {#if orders.length > 0}
          <div class="text-sm text-muted-foreground">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Orders Grid -->
  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each Array(6) as _}
        <Card.Root class="animate-pulse">
          <Card.Content class="p-6">
            <div class="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div class="h-3 bg-muted rounded w-1/2 mb-2"></div>
            <div class="h-3 bg-muted rounded w-2/3"></div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {:else if error}
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
      <Card.Root class="col-span-full">
        <Card.Content class="p-8 text-center">
          <svg class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <h3 class="text-xl font-semibold text-foreground mb-2">Error Loading Orders</h3>
          <p class="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onclick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card.Content>
      </Card.Root>
    </div>
  {:else if orders.length === 0}
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
      <Card.Root class="col-span-full">
        <Card.Content class="p-8 text-center">
          <svg class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3 class="text-xl font-semibold text-foreground mb-2">No Orders Yet</h3>
          <p class="text-muted-foreground mb-6">Create your first order to get started with managing your business.</p>
          <Button onclick={() => goto('/orders/create')}>
            Create Your First Order
          </Button>
        </Card.Content>
      </Card.Root>
    </div>
  {:else if filteredOrders.length === 0}
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
      <Card.Root class="col-span-full">
        <Card.Content class="p-8 text-center">
          <svg class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <h3 class="text-xl font-semibold text-foreground mb-2">No Orders Match Your Filters</h3>
          <p class="text-muted-foreground mb-6">Try adjusting your filter criteria to see more orders.</p>
          <Button variant="outline" onclick={() => {
            selectedClientFilter = 'all';
            selectedStatusFilter = 'all';
            selectedDateFilter = 'all';
          }}>
            Clear Filters
          </Button>
        </Card.Content>
      </Card.Root>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
      {#each filteredOrders as order (order.id)}
        {@const client = clients.find(c => c.uid === order.clientId)}
        {@const clientName = client ? (client.displayName || client.email || 'Unknown Client') : 'Unknown Client'}
        <OrderCard
          {order}
          onClick={() => handleViewOrder(order)}
          onRecordPayment={handleRecordPayment}
          {clientName}
        />
      {/each}
    </div>
  {/if}
</div>

<!-- Payment Modal -->
{#if showPaymentModal && selectedOrder}
  <PaymentModal
    order={selectedOrder}
    open={showPaymentModal}
    onPaymentComplete={handlePaymentComplete}
  />
{/if}