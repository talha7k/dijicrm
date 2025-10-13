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
   import { useClientInvoices, type ClientInvoice } from '$lib/hooks/useClientInvoices';
   import { useClientDocuments } from '$lib/hooks/useClientDocuments';
   import type { GeneratedDocument } from '$lib/types/document';

   let mounted = $state(false);
   let invoices = useClientInvoices();
   let documents = useClientDocuments;

   onMount(() => {
     mounted = true;
     // Check if user has client role
     if (!requireClient()) {
       return; // Will redirect
     }

     // Load client documents
     documents.loadClientDocuments("client-1"); // TODO: Get from auth context
   });

   function getStatusColor(status: ClientInvoice['status']) {
     switch (status) {
       case 'paid': return 'bg-green-100 text-green-800';
       case 'pending': return 'bg-yellow-100 text-yellow-800';
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
  <DashboardLayout title="Client Dashboard" description="Manage your invoices and account information">
    <!-- Metrics Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Invoices"
        value={$invoices.data?.length || 0}
        icon="lucide:file-text"
      />
      <MetricCard
        title="Paid Invoices"
        value={$invoices.data?.filter(inv => inv.status === 'paid').length || 0}
        icon="lucide:check-circle"
      />
      <MetricCard
        title="Pending Amount"
        value={formatCurrency($invoices.data?.filter((inv) => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0) || 0)}
        icon="lucide:clock"
      />
      <MetricCard
        title="Overdue Amount"
        value={formatCurrency($invoices.data?.filter((inv) => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0) || 0)}
        icon="lucide:alert-triangle"
      />
    </div>

    <!-- Recent Invoices -->
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
        <CardDescription>Your latest invoice activity</CardDescription>
      </CardHeader>
      <CardContent>
        {#if $invoices.loading}
          <div class="text-center py-4">Loading invoices...</div>
        {:else if $invoices.data && $invoices.data.length > 0}
          <div class="space-y-4">
            {#each $invoices.data.slice(0, 5) as invoice}
              <div class="flex items-center justify-between p-4 border rounded-lg">
                <div class="space-y-1">
                  <p class="text-sm font-medium">{invoice.number}</p>
                  <p class="text-sm text-muted-foreground">{invoice.description}</p>
                  <p class="text-xs text-muted-foreground">Due: {formatDateShort(invoice.dueDate)}</p>
                </div>
                <div class="text-right space-y-1">
                  <p class="text-sm font-medium">{formatCurrency(invoice.amount)}</p>
                  <Badge class={getStatusColor(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </div>
              </div>
            {/each}
          </div>
          <div class="mt-4">
            <Button variant="outline" onclick={() => goto('/client-dashboard/invoices')}>
              View All Invoices
            </Button>
          </div>
        {:else}
          <div class="text-center py-4 text-muted-foreground">
            No invoices found
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