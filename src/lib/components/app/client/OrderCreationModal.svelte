<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { productsStore } from '$lib/stores/products';
  import { toast } from 'svelte-sonner';
  import type { Product } from '$lib/stores/products';

  interface Props {
    clientId: string;
    open: boolean;
    onCreateOrder?: (order: any) => void;
  }

  let { clientId, open = $bindable(false), onCreateOrder }: Props = $props();

  let products: Product[] = $state([]);
  let selectedProductId = $state('');
  let quantity = $state(1);
  let notes = $state('');
  let loading = $state(false);

  // Load products on mount
  $effect(() => {
    if (open) {
      productsStore.loadProducts('company-1'); // Mock company ID
      const unsubscribe = productsStore.subscribe((state) => {
        products = state.data || [];
      });
      return unsubscribe;
    }
  });

  function handleSubmit() {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    loading = true;

    try {
      const selectedProduct = products.find(p => p.id === selectedProductId);
      if (!selectedProduct) {
        throw new Error('Selected product not found');
      }

      const order = {
        id: `order-${Date.now()}`,
        clientId,
        productId: selectedProductId,
        productName: selectedProduct.name,
        quantity,
        amount: (selectedProduct.price || 0) * quantity,
        notes: notes.trim() || undefined,
        status: 'pending',
        createdAt: new Date(),
      };

      onCreateOrder?.(order);
      toast.success('Order created successfully');

      // Reset form
      selectedProductId = '';
      quantity = 1;
      notes = '';
      open = false;
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    selectedProductId = '';
    quantity = 1;
    notes = '';
    open = false;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Create New Order</Dialog.Title>
      <Dialog.Description>
        Create a new order for this client by selecting a product and quantity.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="product">Product *</Label>
        <Select.Root type="single" bind:value={selectedProductId}>
          <Select.Trigger>
            {products.find(p => p.id === selectedProductId)?.name || "Select a product"}
          </Select.Trigger>
          <Select.Content>
            {#each products.filter(p => p.isActive) as product}
              <Select.Item value={product.id}>
                {product.name} - {formatCurrency(product.price || 0)}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <Label for="quantity">Quantity *</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          bind:value={quantity}
          placeholder="1"
        />
      </div>

      {#if selectedProductId}
        {@const selectedProduct = products.find(p => p.id === selectedProductId)}
        {#if selectedProduct}
          <Card.Root>
            <Card.Content class="pt-4">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">Total Amount:</span>
                <span class="text-lg font-bold">
                  {formatCurrency((selectedProduct.price || 0) * quantity)}
                </span>
              </div>
            </Card.Content>
          </Card.Root>
        {/if}
      {/if}

      <div class="space-y-2">
        <Label for="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          bind:value={notes}
          placeholder="Any special instructions or notes..."
          rows={3}
        />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={handleCancel} disabled={loading}>
        Cancel
      </Button>
      <Button onclick={handleSubmit} disabled={loading || !selectedProductId}>
        {loading ? 'Creating...' : 'Create Order'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>