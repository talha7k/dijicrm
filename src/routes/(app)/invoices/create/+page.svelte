<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Badge } from "$lib/components/ui/badge";

import Icon from "@iconify/svelte";
   import { requireCompany } from "$lib/utils/auth";
    import { productsStore } from "$lib/stores/products";

    import { documentGenerationStore } from "$lib/stores/documentGeneration";
    import { documentDeliveryStore } from "$lib/stores/documentDelivery";
    import { clientManagementStore } from "$lib/stores/clientManagement";
    import { ordersStore } from "$lib/stores/orders";
   import { Timestamp } from "firebase/firestore";
    import type { Order, GeneratedDocument } from "$lib/types/document";
   import { goto } from "$app/navigation";
   import AlertDialog from "$lib/components/shared/alert-dialog.svelte";
   import ClientForm from "$lib/components/app/client/ClientForm.svelte";

   let mounted = $state(false);

   // Dialog state
   let showAlertDialog = $state(false);
   let alertTitle = $state('');
   let alertMessage = $state('');
   let alertType = $state<'info' | 'success' | 'warning' | 'error'>('info');

   // Client dialog state
   let showClientDialog = $state(false);
   let editingClient = $state(null);

   onMount(() => {
     mounted = true;
     // Company access is checked at layout level
     
     // Check if clientId is provided in query params
     const urlParams = new URLSearchParams($page.url.search);
     const clientId = urlParams.get('clientId');
     if (clientId) {
       selectedClientId = clientId;
       invoiceData.clientId = clientId;
     }
   });



let generationStore = documentGenerationStore;
       let deliveryStore = documentDeliveryStore;
      let clientStore = clientManagementStore;
      let orderStore = ordersStore;

   // Load data on mount
   $effect(() => {
     if (mounted) {
        productsStore.loadProducts();
        clientStore.loadClients();
     }
   });

  let invoiceData = $state({
    clientId: "",
    dueDate: "",
    notes: "",
    status: "draft",
    items: [] as InvoiceItem[],
  });

  let selectedProductId = $state("");
  let itemQuantity = $state(1);
  let selectedClientId = $state("");

  let selectedClient = $derived(
    selectedClientId ? $clientStore.clients.find(c => c.uid === selectedClientId) : null
  );

  interface InvoiceItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }

  let totalAmount = $derived(() => {
    return invoiceData.items.reduce((sum, item) => sum + item.total, 0);
  });

   function addProductToInvoice() {
     if (!selectedProductId) {
       alertTitle = "Validation Error";
       alertMessage = "Please select a product";
       alertType = "error";
       showAlertDialog = true;
       return;
     }

     const product = $productsStore.data?.find(p => p.id === selectedProductId);
     if (!product) {
       alertTitle = "Error";
       alertMessage = "Product not found";
       alertType = "error";
       showAlertDialog = true;
       return;
     }

    const existingItem = invoiceData.items.find(item => item.productId === selectedProductId);
    if (existingItem) {
      // Update quantity if product already exists
      existingItem.quantity += itemQuantity;
      existingItem.total = existingItem.quantity * existingItem.price;
    } else {
      // Add new item
      const newItem: InvoiceItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity: itemQuantity,
        price: product.price || 0,
        total: (product.price || 0) * itemQuantity,
      };
      invoiceData.items = [...invoiceData.items, newItem];
    }

    // Reset form
    selectedProductId = "";
    itemQuantity = 1;
  }

  function removeItem(itemId: string) {
    invoiceData.items = invoiceData.items.filter(item => item.id !== itemId);
  }

  function updateItemQuantity(itemId: string, quantity: number) {
    if (quantity < 1) return;

    invoiceData.items = invoiceData.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity,
          total: quantity * item.price,
        };
      }
      return item;
    });
  }



async function handleCreateInvoice() {
      if (invoiceData.items.length === 0) {
        alertTitle = "Validation Error";
        alertMessage = "Please add at least one item to the invoice";
        alertType = "error";
        showAlertDialog = true;
        return;
      }

      try {
        // Get client data if a client is selected
        const client = selectedClient;
        const clientName = client ? (client.displayName || `${client.firstName} ${client.lastName}`) : "";
        const clientEmail = client ? client.email : "";

        // Create order using the ordersStore
        const order = await orderStore.createOrder({
          clientId: selectedClientId || "",
          title: clientName ? `Invoice for ${clientName}` : "Invoice",
          description: invoiceData.notes || `Invoice created on ${new Date().toLocaleDateString()}`,
          selectedProducts: invoiceData.items.map(item => item.productId),
          status: invoiceData.status as any,
          documents: [],
          totalAmount: totalAmount(),
          paidAmount: 0,
          outstandingAmount: totalAmount(),
          payments: [],
          createdBy: "current-user", // TODO: Get from auth
        });

        alertTitle = "Success";
        alertMessage = "Invoice created successfully!";
        alertType = "success";
        showAlertDialog = true;

        // Navigate to invoices page after a short delay
        setTimeout(() => {
          goto("/invoices");
        }, 1500);
      } catch (error) {
        console.error("Failed to create invoice:", error);
        alertTitle = "Create Failed";
        alertMessage = "Failed to create invoice. Please try again.";
        alertType = "error";
        showAlertDialog = true;
      }
    }

  function handleClientSelection(clientId: string) {
    selectedClientId = clientId;
    invoiceData.clientId = clientId || "";
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  // Client dialog functions
  function handleClientDialogSave(clientData: any) {
    showClientDialog = false;
    editingClient = null;
    // Refresh clients list
    clientStore.loadClients();
  }

  function handleClientDialogCancel() {
    showClientDialog = false;
    editingClient = null;
  }
</script>

<!-- Client Dialog -->
{#if showClientDialog}
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-card text-card-foreground rounded-lg border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-foreground">
          {editingClient ? 'Edit Client' : 'Add New Client'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onclick={handleClientDialogCancel}
        >
          <Icon icon="lucide:x" class="h-4 w-4" />
        </Button>
      </div>
      
      <ClientForm
        client={editingClient}
        onSave={handleClientDialogSave}
        onCancel={handleClientDialogCancel}
      />
    </div>
  </div>
{/if}

{#if mounted}
  <DashboardLayout title="Create Invoice" description="Create a new invoice with product line items">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Invoice Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Client Information -->
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>
              {#if selectedClient}
                Invoice for: <strong>{selectedClient.displayName || `${selectedClient.firstName} ${selectedClient.lastName}`}</strong>
              {:else}
                Select an existing client or create a new one
              {/if}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            {#if selectedClient}
              <!-- Selected Client Display -->
              <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div>
                  <p class="font-medium">{selectedClient.displayName || `${selectedClient.firstName} ${selectedClient.lastName}`}</p>
                  <p class="text-sm text-muted-foreground">{selectedClient.email}</p>
                  {#if selectedClient.phoneNumber}
                    <p class="text-sm text-muted-foreground">{selectedClient.phoneNumber}</p>
                  {/if}
                </div>
                <div class="flex items-center gap-2">
                  <Badge variant={selectedClient.metadata?.accountStatus === 'active' ? 'default' : 'secondary'}>
                    {selectedClient.metadata?.accountStatus === 'active' ? 'Active' : 'Invited'}
                  </Badge>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onclick={() => {
                      selectedClientId = "";
                      invoiceData.clientId = "";
                    }}
                  >
                    <Icon icon="lucide:change" class="h-4 w-4 mr-2" />
                    Change
                  </Button>
                </div>
              </div>
            {:else}
              <!-- Client Selection -->
              <div>
                <Label for="client-select">Select Client</Label>
                <Select.Root type="single" bind:value={selectedClientId} onValueChange={handleClientSelection}>
                  <Select.Trigger class="w-full">
                    {$clientStore.clients.find(c => c.uid === selectedClientId)?.displayName || $clientStore.clients.find(c => c.uid === selectedClientId)?.firstName + ' ' + $clientStore.clients.find(c => c.uid === selectedClientId)?.lastName || "Choose from existing clients"}
                  </Select.Trigger>
                  <Select.Content>
                    {#each $clientStore.clients as client (client.uid)}
                      <Select.Item value={client.uid}>
                        <div class="flex items-center justify-between w-full">
                          <span>{client.displayName || `${client.firstName} ${client.lastName}`}</span>
                          <Badge variant={client.metadata?.accountStatus === 'active' ? 'default' : 'secondary'}>
                            {client.metadata?.accountStatus === 'active' ? 'Active' : 'Invited'}
                          </Badge>
                        </div>
                      </Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
            {/if}
            <div class="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onclick={() => showClientDialog = true}
              >
                <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
                Add New Client
              </Button>
              {#if selectedClient}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onclick={() => {
                    editingClient = selectedClient;
                    showClientDialog = true;
                  }}
                >
                  <Icon icon="lucide:edit" class="h-4 w-4 mr-2" />
                  Edit Client
                </Button>
              {/if}
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label for="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  bind:value={invoiceData.dueDate}
                  required
                />
              </div>
            </div>
             <div>
               <Label for="notes">Notes (Optional)</Label>
               <Textarea
                 id="notes"
                 bind:value={invoiceData.notes}
                 placeholder="Additional notes for the client"
                 rows={3}
               />
             </div>
             <div>
               <Label for="status">Invoice Status</Label>
                <Select.Root type="single" bind:value={invoiceData.status}>
                  <Select.Trigger class="w-full">
                    {invoiceData.status ? invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1) : "Select invoice status"}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="draft">Draft</Select.Item>
                    <Select.Item value="quote">Quote</Select.Item>
                    <Select.Item value="sent">Sent</Select.Item>
                    <Select.Item value="paid">Paid</Select.Item>
                  </Select.Content>
                </Select.Root>
             </div>
          </CardContent>
        </Card>

        <!-- Add Products -->
        <Card>
          <CardHeader>
            <CardTitle>Add Products/Services</CardTitle>
            <CardDescription>Select products or services to add to this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex gap-4 items-end">
              <div class="flex-1">
                <Label for="product-select">Product/Service</Label>
                <Select.Root type="single" bind:value={selectedProductId}>
                  <Select.Trigger class="w-full">
                    {$productsStore.data?.find(p => p.id === selectedProductId)?.name || "Select a product or service"}
                  </Select.Trigger>
                  <Select.Content>
                    {#each $productsStore.data || [] as product (product.id)}
                      <Select.Item value={product.id}>
                        <div class="flex items-center justify-between w-full">
                          <span>{product.name}</span>
                          <Badge variant="outline">
                            {product.price ? formatCurrency(product.price) : "Contact pricing"}
                          </Badge>
                        </div>
                      </Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>
              <div class="w-24">
                <Label for="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  bind:value={itemQuantity}
                />
              </div>
              <Button onclick={addProductToInvoice} disabled={!selectedProductId}>
                <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Invoice Items -->
        {#if invoiceData.items.length > 0}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
              <CardDescription>Review and adjust the items on this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                {#each invoiceData.items as item (item.id)}
                  <div class="flex items-center gap-4 p-4 border rounded-lg">
                    <div class="flex-1">
                      <h4 class="font-medium">{item.productName}</h4>
                      <p class="text-sm text-muted-foreground">{formatCurrency(item.price)} each</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <Label for="qty-{item.id}" class="text-sm">Qty:</Label>
                      <Input
                        id="qty-{item.id}"
                        type="number"
                        min="1"
                        value={item.quantity}
                        class="w-16"
                        onchange={(e) => updateItemQuantity(item.id, parseInt((e.target as HTMLInputElement).value) || 1)}
                      />
                    </div>
                    <div class="text-right min-w-[100px]">
                      <p class="font-medium">{formatCurrency(item.total)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onclick={() => removeItem(item.id)}
                    >
                      <Icon icon="lucide:trash" class="h-3 w-3" />
                    </Button>
                  </div>
                {/each}
              </div>
            </CardContent>
          </Card>
        {/if}
      </div>

      <!-- Invoice Summary -->
      <div class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex justify-between">
              <span>Items:</span>
              <span>{invoiceData.items.length}</span>
            </div>
            <div class="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(totalAmount())}</span>
            </div>
          </CardContent>
        </Card>

        <!-- Actions -->
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
<div class="space-y-3">
              <!-- Status Badge -->
              <div class="flex items-center justify-center">
                <Badge variant={invoiceData.status === 'draft' ? 'secondary' : 'default'}>
                  Status: {invoiceData.status}
                </Badge>
              </div>
              
              <Button
                onclick={handleCreateInvoice}
                class="w-full"
                disabled={invoiceData.items.length === 0}
              >
                <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Client Status Notice -->
        {#if selectedClient}
          <Card>
            <CardHeader>
              <CardTitle class="text-sm">Client Status</CardTitle>
            </CardHeader>
            <CardContent>
              {#if selectedClient.metadata?.accountStatus === 'invited'}
                <div class="flex items-center gap-2 text-amber-600">
                  <Icon icon="lucide:clock" class="h-4 w-4" />
                  <span class="text-sm">
                    This client has been invited but hasn't activated their account yet.
                    Documents will be sent to their email when you choose to send them.
                  </span>
                </div>
              {:else}
                <div class="flex items-center gap-2 text-green-600">
                  <Icon icon="lucide:check-circle" class="h-4 w-4" />
                  <span class="text-sm">
                    This client has an active account. Documents will be sent immediately.
                  </span>
                </div>
              {/if}
            </CardContent>
          </Card>
        {/if}


      </div>

      <!-- Alert Dialog -->
      <AlertDialog
        bind:open={showAlertDialog}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
      />
    </div>
  </DashboardLayout>
{/if}