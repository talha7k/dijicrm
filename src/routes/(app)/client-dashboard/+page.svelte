<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import DashboardLayout from '$lib/components/shared/dashboard-layout.svelte';
  import MetricCard from '$lib/components/shared/metric-card.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
   import { requireClient } from '$lib/utils/auth';
   import { formatDateShort } from '$lib/utils';
    import { ordersStore } from '$lib/stores/orders';
    import { clientDocumentsStore } from '$lib/stores/clientDocuments';
    import type { Order, GeneratedDocument } from '$lib/types/document';
   import { userProfile } from '$lib/stores/user';
   import { get } from 'svelte/store';

   let mounted = $state(false);
      let orders = ordersStore;
    let documents = clientDocumentsStore;
    let currentClientId = $state<string | null>(null);

   onMount(() => {
     mounted = true;
     // Check if user has client role
     if (!requireClient()) {
       return; // Will redirect
     }

      // Get current client ID from user profile
      const userProfileData = get(userProfile);
      if (userProfileData.data?.uid) {
        currentClientId = userProfileData.data.uid;
       // Documents are loaded automatically by the store when user profile changes
     }
   });

   function getStatusColor(status: Order['status']) {
     switch (status) {
       case 'paid': return 'bg-green-100 text-green-800';
       case 'sent': return 'bg-yellow-100 text-yellow-800';
       case 'overdue': return 'bg-red-100 text-red-800';
       default: return 'bg-gray-100 text-gray-800';
     }
   }

   function getDocumentStatusColor(status: GeneratedDocument['status']) {
     switch (status) {
       case 'sent': return 'bg-blue-100 text-blue-800';
       case 'viewed': return 'bg-green-100 text-green-800';
       case 'completed': return 'bg-purple-100 text-purple-800';
       case 'rejected': return 'bg-red-100 text-red-800';
       default: return 'bg-gray-100 text-gray-800';
     }
   }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }


</script>

{#if mounted}
  <DashboardLayout title="Client Dashboard" description="Manage your orders and account information">
    <!-- Metrics Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Invoices"
        value={$orders.data?.length || 0}
        icon="lucide:file-text"
      />
      <MetricCard
        title="Paid Invoices"
        value={$orders.data?.filter(ord => ord.status === 'paid').length || 0}
        icon="lucide:check-circle"
      />
      <MetricCard
        title="Pending Amount"
        value={formatCurrency($orders.data?.filter((ord) => ord.status === 'sent').reduce((sum, ord) => sum + ord.outstandingAmount, 0) || 0)}
        icon="lucide:clock"
      />
      <MetricCard
        title="Overdue Amount"
        value={formatCurrency($orders.data?.filter((ord) => ord.status === 'overdue').reduce((sum, ord) => sum + ord.outstandingAmount, 0) || 0)}
        icon="lucide:alert-triangle"
      />
    </div>

    <!-- Recent Invoices -->
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
        <CardDescription>Your latest order activity</CardDescription>
      </CardHeader>
      <CardContent>
        {#if $orders.loading}
          <div class="text-center py-4">Loading orders...</div>
        {:else if $orders.data && $orders.data.length > 0}
          <div class="space-y-4">
            {#each $orders.data.slice(0, 5) as order}
              <div class="flex items-center justify-between p-4 border rounded-lg">
                <div class="space-y-1">
                  <p class="text-sm font-medium">{order.id}</p>
                  <p class="text-sm text-muted-foreground">{order.description}</p>

                  <Badge class={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </div>
            {/each}
          </div>
          <div class="mt-4">
             <Button variant="outline" onclick={() => goto('/client-dashboard/orders')}>
               View All Orders
             </Button>
          </div>
        {:else}
          <div class="text-center py-4 text-muted-foreground">
            No orders found
          </div>
         {/if}
       </CardContent>
     </Card>

     <!-- Recent Documents -->
     <Card>
       <CardHeader>
         <CardTitle>Recent Documents</CardTitle>
         <CardDescription>Documents sent to you for review and completion</CardDescription>
       </CardHeader>
       <CardContent>
         {#if $documents.loading}
           <div class="text-center py-4">Loading documents...</div>
         {:else if $documents.documents && $documents.documents.length > 0}
           <div class="space-y-4">
             {#each $documents.documents.slice(0, 5) as document}
               <div class="flex items-center justify-between p-4 border rounded-lg">
                 <div class="space-y-1">
                   <p class="text-sm font-medium">Document {document.id}</p>
                   <p class="text-sm text-muted-foreground">
                     {document.data.clientName} - {document.data.companyName}
                   </p>
                   <p class="text-xs text-muted-foreground">
                     Sent: {formatDateShort(document.sentAt)}
                   </p>
                 </div>
                 <div class="text-right space-y-1">
                   <Badge class={getDocumentStatusColor(document.status)}>
                     {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                   </Badge>
                   {#if document.status === 'sent'}
                     <Button
                       variant="outline"
                       size="sm"
                       onclick={() => {
                         documents.markAsViewed(document.id);
                         // TODO: Open document viewer
                       }}
                     >
                       View Document
                     </Button>
                   {/if}
                 </div>
               </div>
             {/each}
           </div>
           <div class="mt-4">
             <Button variant="outline" onclick={() => goto('/client-dashboard/documents')}>
               View All Documents
             </Button>
           </div>
         {:else}
           <div class="text-center py-4 text-muted-foreground">
             No documents found
           </div>
         {/if}
       </CardContent>
     </Card>
   </DashboardLayout>
 {/if}