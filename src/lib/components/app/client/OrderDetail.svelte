<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import Button from '$lib/components/ui/button/button.svelte';
  import { productsStore } from '$lib/stores/products';
  import { paymentsStore } from '$lib/stores/payments';
  import { formatCurrency } from '$lib/utils/currency';
  import type { Payment } from '$lib/types/document';

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  import type { Order } from '$lib/types/document';
  import type { Product } from '$lib/stores/products';

  // Get products data
  let products: Product[] = [];
  productsStore.subscribe(store => {
    if (store.data) {
      products = store.data;
    }
  });

  function getProductDetails(productId: string) {
    return products.find(p => p.id === productId);
  }

  interface Props {
    order: Order;
    onRecordPayment?: (order: Order) => void;
    clientName?: string;
  }

  let { order, onRecordPayment, clientName }: Props = $props();

  let showPaymentDetails = $state(false);
  let paymentDetails = $state<Payment[]>([]);
  let loadingPayments = $state(false);

  // Subscribe to payments store to get payment data
  paymentsStore.subscribe(store => {
    if (store.data && order.payments && order.payments.length > 0) {
      // Filter payments for this specific order
      paymentDetails = store.data.filter(payment => payment.orderId === order.id);
    } else {
      paymentDetails = [];
    }
    loadingPayments = store.loading;
  });

  // Load payment details when component mounts
  $effect(() => {
    if (order.payments && order.payments.length > 0) {
      loadPaymentDetails();
    }
  });

  async function loadPaymentDetails() {
    if (!order.payments || order.payments.length === 0) return;

    try {
      await paymentsStore.loadPaymentsForOrder(order.id);
    } catch (error) {
      console.error('Failed to load payment details:', error);
    }
  }

  function getOrderStatusIcon(status: string) {
    switch (status) {
      case 'draft':
        return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
      case 'quote':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'generated':
        return 'M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z';
      case 'sent':
        return 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8';
      case 'partially_paid':
        return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1';
      case 'paid':
        return 'M5 13l4 4L19 7';
      case 'overdue':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      default:
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
  }

  function getPaymentStatus(order: Order) {
    if (order.status === 'paid') return 'Paid';
    if (order.paidAmount > 0) return 'Partially Paid';
    return 'Unpaid';
  }

  function getPaymentStatusColor(order: Order) {
    if (order.status === 'paid') return 'default';
    if (order.paidAmount > 0) return 'secondary';
    return 'outline';
  }

  function getStatusBadge(status: string) {
    const variants = {
      completed: 'default',
      in_progress: 'secondary',
      pending: 'outline',
      cancelled: 'destructive',
      paid: 'default',
      overdue: 'destructive',
      sent: 'secondary',
      delivered: 'default',
    } as const;

    return variants[status as keyof typeof variants] || 'outline';
  }
</script>

<div class="border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg bg-card shadow-sm">
  <!-- Invoice Header -->
  <div class="p-6 border-b bg-gradient-to-r from-muted/30 to-muted/20">
    <div class="flex justify-between items-start">
      <div class="space-y-1">
        <h4 class="text-lg font-bold text-foreground">Invoice #{order.id.slice(-6)}</h4>
        <p class="text-sm text-muted-foreground">{formatDate(order.createdAt?.toDate() || new Date())}</p>
        <p class="text-xs text-muted-foreground">Order ID: {order.id}</p>
      </div>
      <div class="text-right space-y-2">
        <Badge variant={getStatusBadge(order.status)} class="text-xs font-medium px-2 py-1">
          {order.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>
    </div>
  </div>

  <!-- Invoice Body -->
  <div class="p-6 space-y-6">
    <!-- Order Description (Full Width) -->
    {#if order.description}
      <div class="bg-muted/30 p-5 rounded-xl mb-6 border">
        <h5 class="text-sm font-medium mb-2 text-foreground">Order Notes</h5>
        <p class="text-sm text-muted-foreground">{order.description}</p>
      </div>
    {/if}

    <!-- Two Column Layout for Larger Screens -->
    <div class="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-8">
      <!-- Left Column: Items & Services -->
      <div class="space-y-6">
        <!-- Products/Services Table -->
        <div class="border rounded-xl overflow-hidden shadow-sm">
          <div class="bg-muted/60 px-5 py-4 border-b">
            <h5 class="text-sm font-semibold text-foreground">Items & Services</h5>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-muted/40">
                <tr class="border-b">
                  <th class="px-5 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                  <th class="px-5 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                  <th class="px-5 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Unit Price</th>
                  <th class="px-5 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-muted/30">
                {#if order.selectedProducts && order.selectedProducts.length > 0}
                  {#each order.selectedProducts as productId, index}
                    {@const product = getProductDetails(productId)}
                    {@const quantity = 1}
                    {@const unitPrice = order.totalAmount / order.selectedProducts.length}
                    <tr class="hover:bg-muted/20 transition-colors">
                      <td class="px-5 py-4">
                        <div class="flex items-center space-x-3">
                          <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span class="text-xs font-medium text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <p class="text-sm font-medium text-foreground">
                              {product?.name || `Product/Service`}
                            </p>
                            {#if product?.description}
                              <p class="text-xs text-muted-foreground">{product.description}</p>
                            {:else}
                              <p class="text-xs text-muted-foreground">ID: {productId.slice(-6)}</p>
                            {/if}
                          </div>
                        </div>
                      </td>
                      <td class="px-5 py-4 text-center">
                        <span class="text-sm text-foreground">{quantity}</span>
                      </td>
                      <td class="px-5 py-4 text-right">
                        <span class="text-sm text-foreground">{formatCurrency(unitPrice)}</span>
                      </td>
                      <td class="px-5 py-4 text-right">
                        <span class="text-sm font-medium text-foreground">{formatCurrency(unitPrice * quantity)}</span>
                      </td>
                    </tr>
                  {/each}
                {:else}
                  <tr>
                    <td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
                      <svg class="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                      <p class="text-sm">No items specified</p>
                    </td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Order Metadata -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/30 p-5 rounded-xl border">
          <div>
            <span class="font-medium text-foreground">Order ID:</span>
            <p class="text-muted-foreground font-mono text-xs mt-1 break-all">{order.id}</p>
          </div>
          <div>
            <span class="font-medium text-foreground">Last Updated:</span>
            <p class="text-muted-foreground">{formatDate(order.updatedAt?.toDate() || order.createdAt?.toDate() || new Date())}</p>
          </div>
        </div>
      </div>

      <!-- Right Column: Invoice Summary -->
      <div class="space-y-6">
        <!-- Invoice Totals -->
        <div class="border rounded-xl overflow-hidden shadow-sm">
          <div class="bg-muted/60 px-5 py-4 border-b">
            <h5 class="text-sm font-semibold text-foreground">Invoice Summary</h5>
          </div>
          <div class="p-5 space-y-5">
            <!-- Amount Breakdown Table -->
            <div class="space-y-3">
              <div class="flex justify-between items-center py-2 border-b border-dashed">
                <span class="text-sm text-muted-foreground">Subtotal</span>
                <span class="text-sm font-medium">{formatCurrency(order.totalAmount)}</span>
              </div>

              {#if order.paidAmount > 0}
                <div class="flex justify-between items-center py-2 border-b border-dashed">
                  <span class="text-sm text-green-600">Payments Received</span>
                  <span class="text-sm font-medium text-green-600">-{formatCurrency(order.paidAmount)}</span>
                </div>
              {/if}

              <div class="flex justify-between items-center py-3 border-t-2 border-solid bg-muted/20 -mx-4 px-4">
                <span class="text-base font-semibold text-foreground">
                  {order.outstandingAmount > 0 ? 'Amount Due' : 'Total Paid'}
                </span>
                <span class="text-base font-bold text-foreground">
                  {formatCurrency(order.outstandingAmount > 0 ? order.outstandingAmount : order.totalAmount)}
                </span>
              </div>
            </div>

            <!-- Payment Progress Bar -->
            {#if order.totalAmount > 0}
              <div class="space-y-3 pt-2 border-t">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-foreground">Payment Progress</span>
                  <span class="text-sm text-muted-foreground">{Math.round((order.paidAmount / order.totalAmount) * 100)}% Paid</span>
                </div>
                <div class="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style="width: {Math.min((order.paidAmount / order.totalAmount) * 100, 100)}%"
                  ></div>
                </div>
                <div class="flex justify-between text-xs text-muted-foreground">
                  <span>Paid: {formatCurrency(order.paidAmount)}</span>
                  <span>Outstanding: {formatCurrency(order.outstandingAmount)}</span>
                </div>
              </div>
            {/if}

            <!-- Payment Status -->
            <div class="flex items-center justify-between pt-3 border-t">
              <span class="text-sm font-medium text-foreground">Status</span>
              <Badge variant={getPaymentStatusColor(order)} class="text-xs font-medium">
                {getPaymentStatus(order)}
              </Badge>
            </div>
          </div>
        </div>

        <!-- Payment Details -->
        {#if paymentDetails.length > 0}
          <div class="border rounded-xl overflow-hidden shadow-sm">
            <div class="bg-muted/60 px-5 py-4 border-b">
              <h5 class="text-sm font-semibold text-foreground">Payment History</h5>
            </div>
            <div class="p-5">
              <div class="space-y-3">
                {#each paymentDetails as payment}
                  <div class="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div class="flex items-center space-x-3">
                      <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-foreground">
                          {payment.paymentMethod?.replace('_', ' ').toUpperCase() || 'Payment'}
                        </p>
                        <p class="text-xs text-muted-foreground">
                          {formatDate(payment.paymentDate?.toDate() || payment.createdAt?.toDate() || new Date())}
                        </p>
                        {#if payment.reference}
                          <p class="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                        {/if}
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium text-foreground">
                        {formatCurrency(payment.amount)}
                      </p>
                      {#if payment.notes}
                        <p class="text-xs text-muted-foreground max-w-24 truncate" title={payment.notes}>
                          {payment.notes}
                        </p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {:else if order.payments && order.payments.length > 0}
          <div class="border rounded-xl overflow-hidden shadow-sm">
            <div class="bg-muted/60 px-5 py-4 border-b">
              <h5 class="text-sm font-semibold text-foreground">Payment History</h5>
            </div>
            <div class="p-5">
              <div class="text-center py-4 text-muted-foreground">
                <svg class="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-sm">No payment details available</p>
              </div>
            </div>
          </div>
        {/if}

        <!-- Action Buttons -->
        {#if onRecordPayment && order.outstandingAmount > 0}
          <div class="bg-muted/30 p-5 rounded-xl border">
            <Button
              variant="default"
              size="sm"
              class="w-full"
              onclick={() => onRecordPayment(order)}
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
              </svg>
              Record Payment
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>