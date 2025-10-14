<script lang="ts">
  import { onMount } from "svelte";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";

  import Icon from "@iconify/svelte";
  import { requireCompany } from "$lib/utils/auth";
  import { formatDateShort } from "$lib/utils";
  import { goto } from "$app/navigation";

   let mounted = $state(false);
   let searchQuery = $state("");
   let selectedStatus = $state("all");

    onMount(async () => {
      mounted = true;
      // Company access is checked at layout level

      // TODO: Load invoices from Firebase
      // For now, simulate loading
      setTimeout(() => {
        loading = false;
      }, 500);
    });

   // Invoice data - will be loaded from Firebase
   let invoices: any[] = $state([]);
   let loading = $state(true);
   let error = $state<string | null>(null);

  let filteredInvoices = $derived(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === "all" || invoice.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  });

  function handleCreateInvoice() {
    goto("/invoices/create");
  }

  function handleViewInvoice(invoice: any) {
    goto(`/invoices/${invoice.id}`);
  }

  function handleEditInvoice(invoice: any) {
    // TODO: Navigate to edit page
    console.log("Edit invoice:", invoice);
  }

  function handleDeleteInvoice(invoice: any) {
    if (confirm(`Are you sure you want to delete invoice ${invoice.id}?`)) {
      // TODO: Delete invoice
      console.log("Delete invoice:", invoice);
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
        <Select type="single" bind:value={selectedStatus}>
          <SelectTrigger class="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="quote">Quote</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
        </Select>
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
            {searchQuery || selectedStatus !== "all" ? "Try adjusting your search or filters." : "Get started by generating sample data or creating your first invoice."}
          </p>
          {#if !searchQuery && selectedStatus === "all"}
            <div class="flex gap-2">
              <Button onclick={() => goto("/settings")}>
                <Icon icon="lucide:database" class="h-4 w-4 mr-2" />
                Generate Sample Data
              </Button>
              <Button variant="outline" onclick={handleCreateInvoice}>
                <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          {/if}
        </CardContent>
      </Card>
    {:else}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each filteredInvoices() as invoice (invoice.id)}
          <Card class="hover:shadow-md transition-shadow">
            <CardHeader>
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <CardTitle class="text-lg">{invoice.id}</CardTitle>
                  <CardDescription class="mt-1">
                    {invoice.clientName}
                  </CardDescription>
                </div>
                <Badge class={getStatusColor(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
             <CardContent>
               <div class="space-y-3">
                 <div class="flex items-center text-sm text-muted-foreground">
                   <Icon icon="lucide:dollar-sign" class="h-4 w-4 mr-2" />
                   Total: {formatCurrency(invoice.amount)}
                 </div>
                 {#if invoice.paidAmount > 0}
                   <div class="flex items-center text-sm text-green-600">
                     <Icon icon="lucide:check-circle" class="h-4 w-4 mr-2" />
                     Paid: {formatCurrency(invoice.paidAmount)}
                   </div>
                 {/if}
                 {#if invoice.outstandingAmount > 0}
                   <div class="flex items-center text-sm text-red-600">
                     <Icon icon="lucide:alert-circle" class="h-4 w-4 mr-2" />
                     Outstanding: {formatCurrency(invoice.outstandingAmount)}
                   </div>
                 {/if}
                 <div class="flex items-center text-sm text-muted-foreground">
                   <Icon icon="lucide:calendar" class="h-4 w-4 mr-2" />
                   Due: {formatDateShort(invoice.dueDate)}
                 </div>
                 <div class="flex items-center text-sm text-muted-foreground">
                   <Icon icon="lucide:package" class="h-4 w-4 mr-2" />
                   {invoice.items.length} item{invoice.items.length > 1 ? "s" : ""}
                 </div>
               </div>

              <div class="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onclick={() => handleViewInvoice(invoice)}>
                  <Icon icon="lucide:eye" class="h-3 w-3 mr-1" />
                  View
                </Button>
                {#if invoice.status === "draft"}
                  <Button variant="outline" size="sm" onclick={() => handleEditInvoice(invoice)}>
                    <Icon icon="lucide:edit" class="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                {/if}
                <Button variant="outline" size="sm" onclick={() => handleDeleteInvoice(invoice)}>
                  <Icon icon="lucide:trash" class="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    {/if}
  </DashboardLayout>
{/if}