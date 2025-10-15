<script lang="ts">
  import { onMount } from "svelte";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import * as Select from "$lib/components/ui/select/index.js";

import Icon from "@iconify/svelte";
   import { requireCompany } from "$lib/utils/auth";
    import { formatDateShort } from "$lib/utils";
    import { goto } from "$app/navigation";
    import ConfirmDialog from "$lib/components/shared/confirm-dialog.svelte";
    import { ordersStore } from "$lib/stores/orders";
    import { clientManagementStore } from "$lib/stores/clientManagement";
    import { activeCompanyId } from "$lib/stores/companyContext";
    import { get } from "svelte/store";

   let mounted = $state(false);
   let searchQuery = $state("");
   let selectedStatus = $state("all");

   // Dialog state
   let showConfirmDialog = $state(false);
   let confirmTitle = $state('');
   let confirmMessage = $state('');
   let invoiceToDelete = $state<any>(null);

    const orderStore = ordersStore;
   const clientStore = clientManagementStore;

   // Invoice data - loaded from Firebase
   let orders: any[] = $state([]);
   let clients: any[] = $state([]);
   let loading = $state(true);
   let error = $state<string | null>(null);

   onMount(async () => {
      mounted = true;
      // Company access is checked at layout level
      
      try {
        // Initialize with empty arrays to prevent undefined errors
        orders = [];
        clients = [];
        
        // Load orders and clients
        const companyId = get(activeCompanyId);
        console.log('Loading invoices for company:', companyId);
        
        if (companyId) {
          await orderStore.loadOrders(companyId);
          await clientStore.loadClients();
        } else {
          console.log('No active company found, using fallback');
          // Fallback to a default company ID for now
          await orderStore.loadOrders("company-1");
          await clientStore.loadClients();
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        error = 'Failed to load invoices: ' + (err instanceof Error ? err.message : 'Unknown error');
      } finally {
        loading = false;
      }
    });

// Subscribe to store changes
    $effect(() => {
       if (mounted) {
         // Subscribe to stores to get reactive data
         const unsubscribeOrders = orderStore.subscribe((storeState) => {
           orders = storeState.data || [];
         });
         const unsubscribeClients = clientStore.subscribe((clientState) => {
           clients = clientState.clients || [];
         });
         
         return () => {
           unsubscribeOrders();
           unsubscribeClients();
         };
       }
    });

let filteredInvoices = $derived(() => {
     if (!orders || !Array.isArray(orders)) return [];
     
     return orders.filter((order) => {
       // Get client name for this order
       const client = clients.find(c => c.uid === order.clientId);
       const clientName = client ? (client.displayName || `${client.firstName} ${client.lastName}`) : 'Unknown Client';
       
       const matchesSearch =
         clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
         order.title.toLowerCase().includes(searchQuery.toLowerCase());

       const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;

       return matchesSearch && matchesStatus;
     });
   });

function handleCreateInvoice() {
     goto("/invoices/create");
   }

   function handleViewInvoice(order: any) {
     goto(`/invoices/${order.id}`);
   }

   function handleEditInvoice(order: any) {
     goto(`/invoices/${order.id}/edit`);
   }

function handleDeleteInvoice(order: any) {
      invoiceToDelete = order;
      confirmTitle = "Delete Invoice";
      confirmMessage = `Are you sure you want to delete invoice ${order.id}?`;
      showConfirmDialog = true;
    }

    function handleConfirmDelete() {
      if (invoiceToDelete) {
        // TODO: Delete invoice using ordersStore
        orderStore.deleteOrder(invoiceToDelete.id);
        invoiceToDelete = null;
        showConfirmDialog = false;
      }
    }

  function getStatusColor(status: string): string {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "partially_paid": return "bg-yellow-100 text-yellow-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "quote": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
</script>

{#if mounted}
  <DashboardLayout title="Invoices" description="Create and manage client invoices with product line items">
    <!-- Header Actions -->
    <div class="flex justify-between items-center">
      <div class="flex gap-4">
        <Input
          bind:value={searchQuery}
          placeholder="Search invoices..."
          class="w-64"
        />
        <Select.Root type="single" bind:value={selectedStatus}>
          <Select.Trigger class="w-40">
            {selectedStatus ? selectedStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "Filter by status"}
          </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All Status</Select.Item>
              <Select.Item value="draft">Draft</Select.Item>
              <Select.Item value="quote">Quote</Select.Item>
              <Select.Item value="sent">Sent</Select.Item>
              <Select.Item value="partially_paid">Partially Paid</Select.Item>
              <Select.Item value="paid">Paid</Select.Item>
              <Select.Item value="overdue">Overdue</Select.Item>
            </Select.Content>
        </Select.Root>
      </div>

      <Button onclick={handleCreateInvoice}>
        <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
        Create Invoice
      </Button>
    </div>

    <!-- Loading State -->
    {#if loading}
      <Card>
        <CardContent class="text-center py-8">
          <Icon icon="lucide:loader" class="h-8 w-8 mx-auto text-muted-foreground mb-4 animate-spin" />
          <p class="text-muted-foreground">Loading invoices...</p>
        </CardContent>
      </Card>
    {:else if filteredInvoices().length === 0}
      <Card>
        <CardContent class="text-center py-8">
          <Icon icon="lucide:file-text" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 class="text-lg font-medium mb-2">No invoices yet</h3>
           <p class="text-muted-foreground mb-4">
             {searchQuery || selectedStatus !== "all" ? "Try adjusting your search or filters." : "Get started by creating your first invoice."}
           </p>
        </CardContent>
      </Card>
    {:else}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
{#each filteredInvoices() as order (order.id)}
           <Card class="hover:shadow-md transition-shadow">
             <CardHeader>
               <div class="flex items-start justify-between">
                 <div class="flex-1">
                   <CardTitle class="text-lg">{order.title}</CardTitle>
                   <CardDescription class="mt-1">
                     {(() => {
                       const client = clients.find(c => c.uid === order.clientId);
                       return client ? (client.displayName || `${client.firstName} ${client.lastName}`) : 'Unknown Client';
                     })()}
                   </CardDescription>
                 </div>
                 <Badge class={getStatusColor(order.status)}>
                   {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                 </Badge>
               </div>
             </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div class="flex items-center text-sm text-muted-foreground">
                    <Icon icon="lucide:dollar-sign" class="h-4 w-4 mr-2" />
                    Total: {formatCurrency(order.totalAmount)}
                 </div>
{#if order.paidAmount > 0}
                    <div class="flex items-center text-sm text-green-600">
                      <Icon icon="lucide:check-circle" class="h-4 w-4 mr-2" />
                      Paid: {formatCurrency(order.paidAmount)}
                    </div>
                  {/if}
                  {#if order.outstandingAmount > 0}
                    <div class="flex items-center text-sm text-red-600">
                      <Icon icon="lucide:alert-circle" class="h-4 w-4 mr-2" />
                      Outstanding: {formatCurrency(order.outstandingAmount)}
                    </div>
                  {/if}
                  <div class="flex items-center text-sm text-muted-foreground">
                    <Icon icon="lucide:calendar" class="h-4 w-4 mr-2" />
                    Created: {formatDateShort(order.createdAt?.toDate())}
                  </div>
                  <div class="flex items-center text-sm text-muted-foreground">
                    <Icon icon="lucide:package" class="h-4 w-4 mr-2" />
                    {order.selectedProducts.length} product{order.selectedProducts.length > 1 ? "s" : ""}
                  </div>
               </div>

<div class="flex gap-2 mt-4">
                 <Button variant="outline" size="sm" onclick={() => handleViewInvoice(order)}>
                   <Icon icon="lucide:eye" class="h-3 w-3 mr-1" />
                   View
                 </Button>
                 {#if order.status === "draft"}
                   <Button variant="outline" size="sm" onclick={() => handleEditInvoice(order)}>
                     <Icon icon="lucide:edit" class="h-3 w-3 mr-1" />
                     Edit
                   </Button>
                 {/if}
                 <Button variant="outline" size="sm" onclick={() => handleDeleteInvoice(order)}>
                   <Icon icon="lucide:trash" class="h-3 w-3 mr-1" />
                   Delete
                 </Button>
               </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    {/if}

    <!-- Confirm Dialog -->
    <ConfirmDialog
      bind:open={showConfirmDialog}
      title={confirmTitle}
      message={confirmMessage}
      type="danger"
      onconfirm={handleConfirmDelete}
    />
  </DashboardLayout>
{/if}