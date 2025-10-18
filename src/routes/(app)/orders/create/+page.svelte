<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { activeCompanyId } from '$lib/stores/companyContext';
  import { clientManagementStore } from '$lib/stores/clientManagement';
  import { ordersStore } from '$lib/stores/orders';
  import { productsStore } from '$lib/stores/products';
  import { formatCurrency } from '$lib/utils/currency';
  import type { Order } from '$lib/types/document';
  import * as Card from '$lib/components/ui/card';
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import * as Select from '$lib/components/ui/select';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { toast } from 'svelte-sonner';

  let clients = $state<any[]>([]);
  let products = $state<any[]>([]);
  let loading = $state(true);
  let saving = $state(false);

  // Form state
  let selectedClientId = $state('');
  let title = $state('');
  let description = $state('');
  let selectedProducts = $state<string[]>([]);
  let totalAmount = $state(0);
  let currency = $state('SAR');
  let status = $state<'draft' | 'quote' | 'generated' | 'sent' | 'partially_paid' | 'paid' | 'overdue'>('draft');

  // Load clients and products on mount
  onMount(async () => {
    try {
      const companyId = get(activeCompanyId);

      await Promise.all([
        clientManagementStore.loadClients(),
        productsStore.loadProducts()
      ]);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data');
    } finally {
      loading = false;
    }
  });

  // Subscribe to stores
  $effect(() => {
    const unsubscribeClients = clientManagementStore.subscribe((state) => {
      if (state.clients) {
        clients = state.clients;
      }
    });

    const unsubscribeProducts = productsStore.subscribe((state) => {
      if (state.data) {
        products = state.data.filter(p => p.isActive);
      }
    });

    return () => {
      unsubscribeClients();
      unsubscribeProducts();
    };
  });

  // Calculate total amount based on selected products
  $effect(() => {
    totalAmount = selectedProducts.reduce((sum, productId) => {
      const product = products.find(p => p.id === productId);
      return sum + (product?.price || 0);
    }, 0);
  });



  async function handleSubmit() {
    if (!selectedClientId || !title || selectedProducts.length === 0) {
      toast.error('Please fill in all required fields and select at least one product');
      return;
    }

    saving = true;
    try {
      const companyId = get(activeCompanyId);
      if (!companyId) {
        throw new Error('No active company found');
      }

      const userId = ''; // This should be set from auth context

      const orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "companyId"> = {
        clientId: selectedClientId,
        title,
        description,
        selectedProducts,
        status,
        documents: [],
        totalAmount,
        paidAmount: 0,
        outstandingAmount: totalAmount,
        payments: [],
        createdBy: userId,
      };

      await ordersStore.createOrder(orderData);
      toast.success('Order created successfully');
      goto('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    goto('/orders');
  }
</script>

<div class="w-full p-6 max-w-4xl mx-auto">
  <!-- Page Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Create Order</h1>
      <p class="text-muted-foreground mt-1">Create a new order for your business</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" onclick={handleCancel} disabled={saving}>
        Cancel
      </Button>
      <Button onclick={handleSubmit} disabled={saving}>
        {#if saving}
          <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Creating...
        {:else}
          Create Order
        {/if}
      </Button>
    </div>
  </div>

  <!-- Order Form -->
  <Card.Root class="mb-6">
    <Card.Header>
      <Card.Title>Order Details</Card.Title>
      <Card.Description>Enter the details for the new order</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-6">
      <!-- Client Selection and Title -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="client">Client *</Label>
          <Select.Root type="single" bind:value={selectedClientId} disabled={loading}>
            <Select.Trigger class="w-full">
              {selectedClientId ? (clients.find(c => c.uid === selectedClientId)?.displayName || clients.find(c => c.uid === selectedClientId)?.email || 'Unknown Client') : 'Select a client'}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">Select a client</Select.Item>
              {#each clients as client}
                <Select.Item value={client.uid}>
                  {client.displayName || client.email || 'Unknown Client'}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        <div class="space-y-2">
          <Label for="title">Order Title *</Label>
          <Input
            id="title"
            bind:value={title}
            placeholder="e.g., Website Development Project"
            required
          />
        </div>
      </div>

      <!-- Description -->
      <div class="space-y-2">
        <Label for="description">Description</Label>
        <Textarea
          id="description"
          bind:value={description}
          placeholder="Order description or notes"
          rows={3}
        />
      </div>

      <!-- Product Selection -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <Label>Products & Services</Label>
          <Button
            variant="outline"
            size="sm"
            onclick={() => {
              if (products.length > 0) {
                selectedProducts = [...selectedProducts, products[0].id];
              }
            }}
            disabled={products.length === 0}
          >
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Product
          </Button>
        </div>

        {#if selectedProducts.length === 0}
          <Card.Root class="bg-muted/50">
            <Card.Content class="p-8 text-center">
              <svg class="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <h3 class="text-lg font-medium mb-2">No products selected</h3>
              <p class="text-muted-foreground">Add products or services to this order</p>
            </Card.Content>
          </Card.Root>
        {:else}
          <div class="space-y-2">
            {#each selectedProducts as productId, index}
              {@const product = products.find(p => p.id === productId)}
              <Card.Root class="p-4">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <Select.Root type="single" bind:value={selectedProducts[index]}>
                        <Select.Trigger class="w-full">
                          {product ? product.name : 'Select product'}
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="">Select product</Select.Item>
                          {#each products as prod}
                            <Select.Item value={prod.id}>
                              {prod.name} - {prod.category} ({prod.price ? formatCurrency(prod.price) : 'Contact for pricing'})
                            </Select.Item>
                          {/each}
                        </Select.Content>
                      </Select.Root>
                    </div>
                    {#if product}
                      <div class="text-sm text-muted-foreground">
                        {product.category} • {product.price ? formatCurrency(product.price) : 'Contact for pricing'}
                      </div>
                    {/if}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => selectedProducts = selectedProducts.filter((_, i) => i !== index)}
                    class="text-destructive hover:text-destructive"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </Button>
                </div>
              </Card.Root>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Total Amount (calculated from products) -->
      <div class="space-y-2">
        <Label for="totalAmount">Total Amount</Label>
        <div class="text-lg font-semibold p-3 bg-muted rounded-md">
          {formatCurrency(totalAmount)}
        </div>
        <p class="text-sm text-muted-foreground">
          Total is calculated from selected products. Add products above to update this amount.
        </p>
      </div>

      <!-- Status -->
      <div class="space-y-2">
        <Label for="status">Status</Label>
        <Select.Root type="single" bind:value={status}>
          <Select.Trigger class="w-full">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="draft">Draft</Select.Item>
            <Select.Item value="quote">Quote</Select.Item>
            <Select.Item value="generated">Generated</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </Card.Content>
  </Card.Root>
</div>