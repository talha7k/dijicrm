<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
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
  import { doc, getDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import { paymentsStore } from '$lib/stores/payments';
  import type { Payment } from '$lib/types/document';

  let clients = $state<any[]>([]);
  let products = $state<any[]>([]);
  let loading = $state(true);
  let saving = $state(false);
  let order = $state<Order | null>(null);
  let payments = $state<Payment[]>([]);
  let loadingPayments = $state(false);

  // Payment modal state
  let showPaymentModal = $state(false);
  let showEditPaymentModal = $state(false);
  let editingPayment = $state<Payment | null>(null);

  // Payment form state
  let newPaymentAmount = $state(0);
  let newPaymentDate = $state('');
  let newPaymentMethod = $state('');
  let newPaymentReference = $state('');
  let newPaymentNotes = $state('');

  let editPaymentAmount = $state(0);
  let editPaymentDate = $state('');
  let editPaymentMethod = $state('');
  let editPaymentReference = $state('');
  let editPaymentNotes = $state('');

  // Payment loading states
  let addingPayment = $state(false);
  let updatingPayment = $state(false);

  // Form state
  let selectedClientId = $state('');
  let title = $state('');
  let description = $state('');
  let selectedProducts = $state<string[]>([]);
  let totalAmount = $state(0);
  let currency = $state('SAR');
  let status = $state<'draft' | 'quote' | 'generated' | 'sent' | 'partially_paid' | 'paid' | 'overdue'>('draft');

  // Load clients, products, and order data on mount
  onMount(async () => {
    try {
      const companyId = get(activeCompanyId);

      await Promise.all([
        clientManagementStore.loadClients(),
        productsStore.loadProducts()
      ]);

      // Load the order data
      const orderId = page.params.orderId;
      if (orderId) {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          const orderData = orderDoc.data() as Order;
          if (orderData.companyId === companyId) {
            order = orderData;
            // Pre-populate form fields
            selectedClientId = orderData.clientId || '';
            title = orderData.title || '';
            description = orderData.description || '';
            selectedProducts = orderData.selectedProducts || [];
            totalAmount = orderData.totalAmount || 0;
            status = orderData.status || 'draft';

            // Load payments for this order
            loadPayments();
          } else {
            toast.error('Order not found or access denied');
            goto('/orders');
            return;
          }
        } else {
          toast.error('Order not found');
          goto('/orders');
          return;
        }
      }
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

      const orderId = page.params.orderId;
      if (!orderId) {
        throw new Error('No order ID found');
      }

      const orderData: Partial<Order> = {
        clientId: selectedClientId,
        title,
        description,
        selectedProducts,
        status,
        totalAmount,
        outstandingAmount: totalAmount - (order?.paidAmount || 0),
        updatedAt: Timestamp.now(),
      };

      await ordersStore.updateOrder(orderId, orderData);
      toast.success('Order updated successfully');
      goto(`/orders/${orderId}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      saving = false;
    }
  }

  async function loadPayments() {
    if (!order) return;

    loadingPayments = true;
    try {
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('orderId', '==', order.id)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      payments = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Failed to load payments');
    } finally {
      loadingPayments = false;
    }
  }

  async function handlePaymentSave(paymentData: any) {
    if (!order) return;

    try {
      // Record the payment
      const savedPayment = await paymentsStore.recordPayment(paymentData);

      // Calculate new financial values
      const newPaidAmount = order.paidAmount + paymentData.amount;
      const newOutstandingAmount = Math.max(0, order.totalAmount - newPaidAmount);
      const newStatus = newOutstandingAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partially_paid' : order.status;

      // Update order
      await ordersStore.updateOrder(order.id, {
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstandingAmount,
        status: newStatus,
        payments: [...order.payments, savedPayment.id],
        updatedAt: Timestamp.now(),
      });

      // Update local order state
      order = {
        ...order,
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstandingAmount,
        status: newStatus,
        payments: [...order.payments, savedPayment.id],
      };

      // Reload payments
      await loadPayments();

      toast.success('Payment recorded successfully');
      showPaymentModal = false;
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  }

  async function handleEditPayment(payment: Payment) {
    editingPayment = payment;
    // Initialize edit form with payment data
    editPaymentAmount = payment.amount;
    editPaymentDate = new Date(payment.paymentDate.toDate()).toISOString().split('T')[0];
    editPaymentMethod = payment.paymentMethod;
    editPaymentReference = payment.reference || '';
    editPaymentNotes = payment.notes || '';
    showEditPaymentModal = true;
  }

  async function handleEditPaymentSave(paymentData: any) {
    if (!editingPayment) return;

    try {
      // Calculate the difference in amount
      const amountDifference = paymentData.amount - editingPayment.amount;

      // Update payment
      await paymentsStore.updatePayment(editingPayment.id, paymentData);

      // Update order financials
      if (order) {
        const newPaidAmount = order.paidAmount + amountDifference;
        const newOutstandingAmount = Math.max(0, order.totalAmount - newPaidAmount);
        const newStatus = newOutstandingAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partially_paid' : order.status;

        await ordersStore.updateOrder(order.id, {
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstandingAmount,
          status: newStatus,
          updatedAt: Timestamp.now(),
        });

        // Update local order state
        order = {
          ...order,
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstandingAmount,
          status: newStatus,
        };
      }

      // Reload payments
      await loadPayments();

      toast.success('Payment updated successfully');
      showEditPaymentModal = false;
      editingPayment = null;
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    }
  }

  async function handleDeletePayment(payment: Payment) {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      // Delete payment
      await paymentsStore.deletePayment(payment.id);

      // Update order financials
      if (order) {
        const newPaidAmount = order.paidAmount - payment.amount;
        const newOutstandingAmount = Math.max(0, order.totalAmount - newPaidAmount);
        const newStatus = newOutstandingAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partially_paid' : order.status;

        await ordersStore.updateOrder(order.id, {
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstandingAmount,
          status: newStatus,
          payments: order.payments.filter(id => id !== payment.id),
          updatedAt: Timestamp.now(),
        });

        // Update local order state
        order = {
          ...order,
          paidAmount: newPaidAmount,
          outstandingAmount: newOutstandingAmount,
          status: newStatus,
          payments: order.payments.filter(id => id !== payment.id),
        };
      }

      // Reload payments
      await loadPayments();

      toast.success('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  }

  function openPaymentModal() {
    if (!order) return;

    // Initialize form with default values
    newPaymentAmount = order.outstandingAmount;
    newPaymentDate = new Date().toISOString().split('T')[0];
    newPaymentMethod = '';
    newPaymentReference = '';
    newPaymentNotes = '';
    showPaymentModal = true;
  }

  async function handleAddPayment() {
    if (!order || !newPaymentAmount || !newPaymentDate || !newPaymentMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newPaymentAmount > order.outstandingAmount) {
      toast.error('Payment amount cannot exceed outstanding balance');
      return;
    }

    addingPayment = true;
    try {
      const paymentData: any = {
        orderId: order.id,
        companyId: order.companyId,
        clientId: order.clientId,
        amount: newPaymentAmount,
        paymentDate: Timestamp.fromDate(new Date(newPaymentDate)),
        paymentMethod: newPaymentMethod,
        recordedBy: '', // This should be set from auth context
      };

      // Only include optional fields if they have values
      if (newPaymentReference) {
        paymentData.reference = newPaymentReference;
      }
      if (newPaymentNotes) {
        paymentData.notes = newPaymentNotes;
      }

      await handlePaymentSave(paymentData);

      // Reset form
      newPaymentAmount = 0;
      newPaymentDate = '';
      newPaymentMethod = '';
      newPaymentReference = '';
      newPaymentNotes = '';
      showPaymentModal = false;
    } catch (error) {
      console.error('Error adding payment:', error);
    } finally {
      addingPayment = false;
    }
  }

  async function handleUpdatePayment() {
    if (!editingPayment || !editPaymentAmount || !editPaymentDate || !editPaymentMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    updatingPayment = true;
    try {
      const paymentData: any = {
        amount: editPaymentAmount,
        paymentDate: Timestamp.fromDate(new Date(editPaymentDate)),
        paymentMethod: editPaymentMethod,
      };

      // Only include optional fields if they have values
      if (editPaymentReference) {
        paymentData.reference = editPaymentReference;
      }
      if (editPaymentNotes) {
        paymentData.notes = editPaymentNotes;
      }

      await handleEditPaymentSave(paymentData);

      // Reset form
      editPaymentAmount = 0;
      editPaymentDate = '';
      editPaymentMethod = '';
      editPaymentReference = '';
      editPaymentNotes = '';
      showEditPaymentModal = false;
      editingPayment = null;
    } catch (error) {
      console.error('Error updating payment:', error);
    } finally {
      updatingPayment = false;
    }
  }

  function handleCancel() {
    goto(`/orders/${page.params.orderId}`);
  }
</script>

<div class="w-full p-6 max-w-4xl mx-auto">
  <!-- Page Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Edit Order</h1>
      <p class="text-muted-foreground mt-1">Update order details</p>
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
          Updating...
        {:else}
          Update Order
        {/if}
      </Button>
    </div>
  </div>

  <!-- Order Form -->
  <Card.Root class="mb-6">
    <Card.Header>
      <Card.Title>Order Details</Card.Title>
      <Card.Description>Update the details for this order</Card.Description>
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
          <div class="text-center py-8 text-muted-foreground border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <svg class="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <h3 class="text-lg font-medium mb-2">No products selected</h3>
            <p class="text-muted-foreground">Add products or services to this order</p>
          </div>
        {:else}
          <div class="border rounded-lg overflow-hidden">
            <div class="bg-muted/60 px-4 py-3 border-b">
              <h5 class="text-sm font-semibold text-foreground">Selected Products & Services</h5>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-muted/40">
                  <tr class="border-b">
                    <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th class="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                    <th class="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-muted/30">
                  {#each selectedProducts as productId, index}
                    {@const product = products.find(p => p.id === productId)}
                    <tr class="hover:bg-muted/20 transition-colors">
                      <td class="px-4 py-3">
                        <Select.Root type="single" bind:value={selectedProducts[index]}>
                          <Select.Trigger class="w-full bg-transparent border-none p-0 h-auto text-sm font-medium text-foreground hover:bg-transparent focus:ring-0">
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
                      </td>
                      <td class="px-4 py-3 text-sm text-muted-foreground">
                        {product?.category || '-'}
                      </td>
                      <td class="px-4 py-3 text-right text-sm font-medium text-foreground">
                        {product?.price ? formatCurrency(product.price) : 'Contact for pricing'}
                      </td>
                      <td class="px-4 py-3 text-center">
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
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
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
            <Select.Item value="sent">Sent</Select.Item>
            <Select.Item value="partially_paid">Partially Paid</Select.Item>
            <Select.Item value="paid">Paid</Select.Item>
            <Select.Item value="overdue">Overdue</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>

      <!-- Payment Management -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <Label>Payment Management</Label>
          <Button
            variant="outline"
            size="sm"
            onclick={openPaymentModal}
          >
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Payment
          </Button>
        </div>

        <!-- Payment Summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{formatCurrency(order?.totalAmount || 0)}</div>
            <div class="text-sm text-muted-foreground">Total Amount</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{formatCurrency(order?.paidAmount || 0)}</div>
            <div class="text-sm text-muted-foreground">Paid Amount</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{formatCurrency(order?.outstandingAmount || 0)}</div>
            <div class="text-sm text-muted-foreground">Outstanding</div>
          </div>
        </div>

        <!-- Payments List -->
        {#if loadingPayments}
          <div class="flex items-center justify-center py-8">
            <svg class="animate-spin h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="ml-3 text-sm text-muted-foreground">Loading payments...</span>
          </div>
        {:else if payments.length === 0}
          <div class="text-center py-8 text-muted-foreground">
            <svg class="h-12 w-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
            </svg>
            <p>No payments recorded yet</p>
          </div>
        {:else}
          <div class="space-y-2">
            {#each payments as payment}
              <div class="flex items-center justify-between p-4 border rounded-lg">
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <div class="text-sm font-medium text-foreground">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {new Date(payment.paymentDate.toDate()).toLocaleDateString()}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                    </div>
                    {#if payment.reference}
                      <div class="text-sm text-muted-foreground">
                        Ref: {payment.reference}
                      </div>
                    {/if}
                  </div>
                  {#if payment.notes}
                    <div class="text-sm text-muted-foreground mt-1">
                      {payment.notes}
                    </div>
                  {/if}
                </div>
                <div class="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => handleEditPayment(payment)}
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => handleDeletePayment(payment)}
                    class="text-destructive hover:text-destructive"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>
</div>

<!-- Payment Modals -->
{#if showPaymentModal && order}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Record Payment</h2>
          <button
            onclick={() => showPaymentModal = false}
            class="text-muted-foreground hover:text-foreground"
            aria-label="Close payment modal"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Payment Form -->
        <div class="space-y-4">
          <div class="space-y-2">
            <label for="payment-amount" class="text-sm font-medium">Payment Amount *</label>
            <input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={order.outstandingAmount}
              bind:value={newPaymentAmount}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="0.00"
              disabled={addingPayment}
            />
            <p class="text-sm text-muted-foreground">
              Outstanding balance: {formatCurrency(order.outstandingAmount)}
            </p>
          </div>

          <div class="space-y-2">
            <label for="payment-date" class="text-sm font-medium">Payment Date *</label>
            <input
              id="payment-date"
              type="date"
              bind:value={newPaymentDate}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={addingPayment}
            />
          </div>

          <div class="space-y-2">
            <label for="payment-method" class="text-sm font-medium">Payment Method *</label>
            <select
              id="payment-method"
              bind:value={newPaymentMethod}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={addingPayment}
            >
              <option value="">Select payment method</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="paypal">PayPal</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="space-y-2">
            <label for="payment-reference" class="text-sm font-medium">Reference Number (Optional)</label>
            <input
              id="payment-reference"
              bind:value={newPaymentReference}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Check number, transaction ID, etc."
              disabled={addingPayment}
            />
          </div>

          <div class="space-y-2">
            <label for="payment-notes" class="text-sm font-medium">Notes (Optional)</label>
            <textarea
              id="payment-notes"
              bind:value={newPaymentNotes}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
              rows="3"
              placeholder="Additional payment details or notes"
              disabled={addingPayment}
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button variant="outline" onclick={() => showPaymentModal = false} disabled={addingPayment}>
              Cancel
            </Button>
            <Button onclick={handleAddPayment} disabled={addingPayment}>
              {#if addingPayment}
                <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Recording...
              {:else}
                Record Payment
              {/if}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showEditPaymentModal && editingPayment}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Edit Payment</h2>
          <button
            onclick={() => { showEditPaymentModal = false; editingPayment = null; }}
            class="text-muted-foreground hover:text-foreground"
            aria-label="Close edit payment modal"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Edit Payment Form -->
        <div class="space-y-4">
          <div class="space-y-2">
            <label for="edit-payment-amount" class="text-sm font-medium">Payment Amount *</label>
            <input
              id="edit-payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              bind:value={editPaymentAmount}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="0.00"
              disabled={updatingPayment}
            />
          </div>

          <div class="space-y-2">
            <label for="edit-payment-date" class="text-sm font-medium">Payment Date *</label>
            <input
              id="edit-payment-date"
              type="date"
              bind:value={editPaymentDate}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={updatingPayment}
            />
          </div>

          <div class="space-y-2">
            <label for="edit-payment-method" class="text-sm font-medium">Payment Method *</label>
            <select
              id="edit-payment-method"
              bind:value={editPaymentMethod}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={updatingPayment}
            >
              <option value="">Select payment method</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="paypal">PayPal</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="space-y-2">
            <label for="edit-payment-reference" class="text-sm font-medium">Reference Number (Optional)</label>
            <input
              id="edit-payment-reference"
              bind:value={editPaymentReference}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Check number, transaction ID, etc."
              disabled={updatingPayment}
            />
          </div>

          <div class="space-y-2">
            <label for="edit-payment-notes" class="text-sm font-medium">Notes (Optional)</label>
            <textarea
              id="edit-payment-notes"
              bind:value={editPaymentNotes}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
              rows="3"
              placeholder="Additional payment details or notes"
              disabled={updatingPayment}
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button variant="outline" onclick={() => { showEditPaymentModal = false; editingPayment = null; }} disabled={updatingPayment}>
              Cancel
            </Button>
            <Button onclick={handleUpdatePayment} disabled={updatingPayment}>
              {#if updatingPayment}
                <svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              {:else}
                Update Payment
              {/if}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}