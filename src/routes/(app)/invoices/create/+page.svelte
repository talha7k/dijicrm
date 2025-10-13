<script lang="ts">
  import { onMount } from "svelte";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Badge } from "$lib/components/ui/badge";

  import Icon from "@iconify/svelte";
   import { requireCompany } from "$lib/utils/auth";
   import { useProducts } from "$lib/hooks/useProducts";
   import { useDocumentRequirements } from "$lib/hooks/useDocumentRequirements";
   import { useDocumentGeneration } from "$lib/hooks/useDocumentGeneration";
   import { useDocumentDelivery } from "$lib/hooks/useDocumentDelivery";
   import { useClientManagement } from "$lib/hooks/useClientManagement";
   import { Timestamp } from "firebase/firestore";
   import type { BusinessCase, GeneratedDocument } from "$lib/types/document";
   import { goto } from "$app/navigation";

  let mounted = $state(false);

  onMount(() => {
    mounted = true;
    if (!requireCompany()) {
      return;
    }
  });

   let productsStore = useProducts();
   let requirementsStore = useDocumentRequirements();
   let generationStore = useDocumentGeneration;
   let deliveryStore = useDocumentDelivery;
   let clientStore = useClientManagement;

  // Load data on mount
  $effect(() => {
    if (mounted) {
      const companyId = "company-1"; // TODO: Get from auth context
      productsStore.loadProducts(companyId);
      requirementsStore.loadRequirements(companyId);
      clientStore.loadClients(companyId);
    }
  });

  let invoiceData = $state({
    clientId: "",
    clientName: "",
    clientEmail: "",
    dueDate: "",
    notes: "",
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
      alert("Please select a product");
      return;
    }

    const product = $productsStore.data?.find(p => p.id === selectedProductId);
    if (!product) {
      alert("Product not found");
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

  function handleSaveDraft() {
    // TODO: Save as draft
    console.log("Saving draft:", invoiceData);
    alert("Invoice saved as draft");
  }

  async function handleSendInvoice() {
    if (!invoiceData.clientName || !invoiceData.clientEmail || invoiceData.items.length === 0) {
      alert("Please fill in all required fields and add at least one item");
      return;
    }

    // Check if selected client is invited
    const selectedClient = selectedClientId ? $clientStore.clients.find(c => c.uid === selectedClientId) : null;
    const isInvitedClient = selectedClient && selectedClient.metadata?.accountStatus === 'invited';

    try {
      // Create business case
      const businessCase: BusinessCase = {
        id: `case-${Date.now()}`,
        companyId: "company-1", // TODO: Get from auth
        clientId: selectedClientId || "client-1", // Use selected client or default
        title: `Invoice for ${invoiceData.clientName}`,
        description: `Invoice created on ${new Date().toLocaleDateString()}`,
        selectedProducts: invoiceData.items.map(item => item.productId),
        status: isInvitedClient ? "pending" : "generated", // Delay for invited clients
        documents: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: "user-1", // TODO: Get from auth
      };

      // Get document requirements for selected products
      const productIds = invoiceData.items.map(item => item.productId);
      const allRequirements = $requirementsStore.data || [];
      const relevantRequirements = allRequirements.filter(req =>
        productIds.includes(req.productId) && req.isMandatory
      );

      // Generate required documents
      const generatedDocuments: GeneratedDocument[] = [];

      for (const requirement of relevantRequirements) {
        const documentData = {
          ...invoiceData,
          companyName: "DijiCRM", // TODO: Get from company settings
          amount: totalAmount(),
          date: new Date().toISOString().split('T')[0],
        };

        // Generate document
        await generationStore.generateDocument(requirement.templateId, documentData, "pdf");

        if ($generationStore.result) {
          const generatedDoc: GeneratedDocument = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            caseId: businessCase.id,
            clientId: businessCase.clientId,
            templateId: requirement.templateId,
            templateVersion: 1,
            htmlContent: $generationStore.result.content,
            pdfUrl: $generationStore.result.content, // TODO: This should be the actual PDF URL
            status: "generated",
            data: documentData,
            generatedAt: Timestamp.now(),
            version: 1,
            metadata: {},
          };

          generatedDocuments.push(generatedDoc);
          businessCase.documents.push(generatedDoc.id);
        }
      }

      // Send documents to client (skip for invited clients)
      if (generatedDocuments.length > 0 && !isInvitedClient) {
        await deliveryStore.deliverCaseDocuments(
          generatedDocuments,
          invoiceData.clientEmail,
          "DijiCRM", // TODO: Get from company settings
          invoiceData.clientName
        );
      }

      console.log("Invoice and documents processed:", {
        invoice: invoiceData,
        businessCase,
        documents: generatedDocuments,
        isInvitedClient
      });

      if (isInvitedClient) {
        alert(`Invoice created successfully! Documents will be sent automatically when the client activates their account.`);
      } else {
        alert(`Invoice sent successfully! ${generatedDocuments.length} document(s) were also sent to the client.`);
      }
      goto("/invoices");
    } catch (error) {
      console.error("Failed to send invoice:", error);
      alert("Failed to send invoice. Please try again.");
    }
  }

  function handleClientSelection(clientId: string) {
    selectedClientId = clientId;
    if (clientId) {
      const client = $clientStore.clients.find(c => c.uid === clientId);
      if (client) {
        invoiceData.clientId = client.uid;
        invoiceData.clientName = client.displayName || `${client.firstName} ${client.lastName}`;
        invoiceData.clientEmail = client.email;
      }
    } else {
      invoiceData.clientId = "";
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
  <DashboardLayout title="Create Invoice" description="Create a new invoice with product line items">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Invoice Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Client Information -->
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Select an existing client or enter details manually</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <Label for="client-select">Select Client (Optional)</Label>
              <Select type="single" bind:value={selectedClientId} onValueChange={handleClientSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose from existing clients or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  {#each $clientStore.clients as client (client.uid)}
                    <SelectItem value={client.uid}>
                      <div class="flex items-center justify-between w-full">
                        <span>{client.displayName || `${client.firstName} ${client.lastName}`}</span>
                        <Badge variant={client.metadata?.accountStatus === 'active' ? 'default' : 'secondary'}>
                          {client.metadata?.accountStatus === 'active' ? 'Active' : 'Invited'}
                        </Badge>
                      </div>
                    </SelectItem>
                  {/each}
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label for="client-name">Client Name</Label>
                <Input
                  id="client-name"
                  bind:value={invoiceData.clientName}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div>
                <Label for="client-email">Client Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  bind:value={invoiceData.clientEmail}
                  placeholder="Enter client email"
                  required
                />
              </div>
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
                <Select type="single" bind:value={selectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product or service" />
                  </SelectTrigger>
                  <SelectContent>
                    {#each $productsStore.data || [] as product (product.id)}
                      <SelectItem value={product.id}>
                        <div class="flex items-center justify-between w-full">
                          <span>{product.name}</span>
                          <Badge variant="outline">
                            {product.price ? formatCurrency(product.price) : "Contact pricing"}
                          </Badge>
                        </div>
                      </SelectItem>
                    {/each}
                  </SelectContent>
                </Select>
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
            <Button
              onclick={handleSaveDraft}
              variant="outline"
              class="w-full"
              disabled={invoiceData.items.length === 0}
            >
              <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              onclick={handleSendInvoice}
              class="w-full"
              disabled={!invoiceData.clientName || !invoiceData.clientEmail || invoiceData.items.length === 0}
            >
              <Icon icon={selectedClient?.metadata?.accountStatus === 'invited' ? 'lucide:clock' : 'lucide:send'} class="h-4 w-4 mr-2" />
              {selectedClient?.metadata?.accountStatus === 'invited' ? 'Queue Invoice' : 'Send Invoice'}
            </Button>
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
                    Documents will be sent automatically when they complete registration.
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

        <!-- Document Requirements Notice -->
        {#if invoiceData.items.length > 0}
          <Card>
            <CardHeader>
              <CardTitle class="text-sm">Document Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              {#if $requirementsStore.data}
                {@const productIds = invoiceData.items.map(item => item.productId)}
                {@const relevantRequirements = $requirementsStore.data.filter(req =>
                  productIds.includes(req.productId) && req.isMandatory
                )}
                {#if relevantRequirements.length > 0}
                  <div class="space-y-2">
                    <p class="text-sm text-muted-foreground">
                      The following documents will be automatically generated and sent to the client:
                    </p>
                    <ul class="text-sm space-y-1">
                      {#each relevantRequirements as req}
                        {@const product = $productsStore.data?.find(p => p.id === req.productId)}
                        <li class="flex items-center gap-2">
                          <Icon icon="lucide:file-text" class="h-3 w-3" />
                          <span>{product?.name || 'Unknown Product'} - Document Required</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                {:else}
                  <p class="text-sm text-muted-foreground">
                    No additional documents are required for the selected products.
                  </p>
                {/if}
              {:else}
                <p class="text-sm text-muted-foreground">
                  Based on the products/services selected, additional documents may be required from the client.
                  These will be automatically identified when the invoice is sent.
                </p>
              {/if}
            </CardContent>
          </Card>
        {/if}
              {:else}
                <p class="text-sm text-muted-foreground">
                  Based on the products/services selected, additional documents may be required from the client.
                  These will be automatically identified when the invoice is sent.
                </p>
              {/if}
            </CardContent>
          </Card>
        {/if}
      </div>
    </div>
  </DashboardLayout>
{/if}