<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import Icon from '@iconify/svelte';
  import { ordersStore } from '$lib/stores/orders';
  import { paymentsStore } from '$lib/stores/payments';
  import { documentGenerationStore } from '$lib/stores/documentGeneration';
  import type { Order, Payment } from '$lib/types/document';
  import { Timestamp } from 'firebase/firestore';
  import { toast } from 'svelte-sonner';
  import { companyContext } from '$lib/stores/companyContext';
  import { auth } from '$lib/firebase';
  import { get } from 'svelte/store';

  interface Props {
    order: Order | null;
    open: boolean;
    onClose?: () => void;
  }

  let { order, open = $bindable(false), onClose }: Props = $props();

  let activeTab = $state('overview');
  let paymentAmount = $state('');
  let paymentMethod = $state('bank_transfer');
  let paymentNotes = $state('');
  let generatingInvoice = $state(false);

  // Get payments for this order
  let orderPayments = $state<Payment[]>([]);

  $effect(() => {
    if (order && open) {
      // Load payments for this order (using orderId which references order)
      paymentsStore.subscribe((state) => {
        orderPayments = state.data?.filter(p => p.orderId === order.id) || [];
      });
      paymentsStore.loadPaymentsForOrder(order.id);
    }
  });

  function getStatusBadge(status: string) {
    const variants = {
      draft: 'secondary',
      quote: 'outline',
      sent: 'default',
      generated: 'default',
      partially_paid: 'secondary',
      paid: 'default',
      overdue: 'destructive',
      cancelled: 'destructive',
    } as const;

    return variants[status as keyof typeof variants] || 'outline';
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function formatDate(date: Date | any) {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  }

  async function handleRecordPayment() {
    if (!order || !paymentAmount) {
      toast.error('Please enter a payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    // Get auth and company context
    const companyContextValue = get(companyContext);
    const userId = auth.currentUser?.uid;
    
    if (!companyContextValue.data || !userId) {
      toast.error('Authentication or company context required');
      return;
    }

    try {
      await paymentsStore.recordPayment({
        orderId: order.id,
        clientId: order.clientId,
        amount,
        paymentDate: Timestamp.now(),
        paymentMethod,
        notes: paymentNotes,
        recordedBy: userId,
      });

      toast.success('Payment recorded successfully');

      // Reset form
      paymentAmount = '';
      paymentNotes = '';

      // Update order status if fully paid
      const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0) + amount;
      if (totalPaid >= order.totalAmount) {
        await ordersStore.updateOrder(order.id, { status: 'paid' });
      } else if (totalPaid > 0) {
        await ordersStore.updateOrder(order.id, { status: 'partially_paid' });
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  }

  async function handleGenerateInvoice() {
    if (!order) return;

    // Get auth and company context
    const companyContextValue = get(companyContext);
    if (!companyContextValue.data) {
      toast.error('Company context required');
      return;
    }

    generatingInvoice = true;
    try {
      // Generate order PDF using document generation
      const result = await documentGenerationStore.generateDocument(
        'order-template', // TODO: Use actual template ID
        {
          orderId: order.id,
          clientName: 'Client Name', // TODO: Get from client data
          clientEmail: 'client@example.com', // TODO: Get from client data
          items: order.selectedProducts.map(productId => ({
            productId,
            name: 'Product Name', // TODO: Get from products store
            quantity: 1,
            price: 100, // TODO: Get from products store
          })),
          totalAmount: order.totalAmount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        'pdf',
        companyContextValue.data.companyId
      );

      if (result.success) {
        toast.success('Invoice generated successfully');
        // Update order status
        await ordersStore.updateOrder(order.id, { status: 'generated' });
      } else {
        throw new Error(result.error || 'Failed to generate order');
      }
    } catch (error) {
      console.error('Error generating order:', error);
      toast.error('Failed to generate order');
    } finally {
      generatingInvoice = false;
    }
  }

  function handleClose() {
    open = false;
    activeTab = 'overview';
    onClose?.();
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Order Details</Dialog.Title>
      <Dialog.Description>
        {#if order}
          Order #{order.id} • {formatDate(order.createdAt)}
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    {#if order}
      <div class="space-y-6">
        <!-- Order Summary -->
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <Card.Title class="text-lg">{order.title}</Card.Title>
              <Badge variant={getStatusBadge(order.status)}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
          </Card.Header>
          <Card.Content>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label class="text-muted-foreground">Total Amount</Label>
                <p class="font-medium">{formatCurrency(order.totalAmount)}</p>
              </div>
              <div>
                <Label class="text-muted-foreground">Paid Amount</Label>
                <p class="font-medium text-green-600">
                  {formatCurrency(orderPayments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
              <div>
                <Label class="text-muted-foreground">Outstanding</Label>
                <p class="font-medium text-red-600">
                  {formatCurrency(order.outstandingAmount)}
                </p>
              </div>
              <div>
                <Label class="text-muted-foreground">Products</Label>
                <p class="font-medium">{order.selectedProducts.length}</p>
              </div>
            </div>
            {#if order.description}
              <div class="mt-4">
                <Label class="text-muted-foreground">Description</Label>
                <p class="text-sm">{order.description}</p>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>

        <!-- Tabs -->
        <Tabs.Root bind:value={activeTab}>
          <Tabs.List class="grid w-full grid-cols-3">
            <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
            <Tabs.Trigger value="payments">Payments</Tabs.Trigger>
            <Tabs.Trigger value="order">Invoice</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview" class="space-y-4">
            <!-- Products -->
            <Card.Root>
              <Card.Header>
                <Card.Title>Products/Services</Card.Title>
              </Card.Header>
              <Card.Content>
                <div class="space-y-2">
                  {#each order.selectedProducts as productId}
                    <div class="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p class="font-medium">Product/Service</p>
                        <p class="text-sm text-muted-foreground">ID: {productId}</p>
                      </div>
                      <Badge variant="outline">1 unit</Badge>
                    </div>
                  {/each}
                </div>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>

          <Tabs.Content value="payments" class="space-y-4">
            <!-- Payment History -->
            <Card.Root>
              <Card.Header>
                <Card.Title>Payment History</Card.Title>
              </Card.Header>
              <Card.Content>
                {#if orderPayments.length === 0}
                  <p class="text-muted-foreground text-center py-4">No payments recorded yet</p>
                {:else}
                  <div class="space-y-3">
                    {#each orderPayments as payment}
                      <div class="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p class="font-medium">{formatCurrency(payment.amount)}</p>
                          <p class="text-sm text-muted-foreground">
                            {payment.paymentMethod.replace('_', ' ')} • {formatDate(payment.createdAt)}
                          </p>
                          {#if payment.notes}
                            <p class="text-sm text-muted-foreground mt-1">{payment.notes}</p>
                          {/if}
                        </div>
                        <Badge variant="default">Paid</Badge>
                      </div>
                    {/each}
                  </div>
                {/if}
              </Card.Content>
            </Card.Root>

            <!-- Record Payment -->
            <Card.Root>
              <Card.Header>
                <Card.Title>Record Payment</Card.Title>
              </Card.Header>
              <Card.Content class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <Label for="payment-amount">Amount</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      bind:value={paymentAmount}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label for="payment-method">Payment Method</Label>
                    <Select.Root type="single" bind:value={paymentMethod}>
                      <Select.Trigger>
                        {paymentMethod.replace('_', ' ')}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="bank_transfer">Bank Transfer</Select.Item>
                        <Select.Item value="credit_card">Credit Card</Select.Item>
                        <Select.Item value="cash">Cash</Select.Item>
                        <Select.Item value="check">Check</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </div>
                </div>
                <div>
                  <Label for="payment-notes">Notes (Optional)</Label>
                  <Textarea
                    id="payment-notes"
                    bind:value={paymentNotes}
                    placeholder="Payment reference, check number, etc."
                    rows={2}
                  />
                </div>
                <Button onclick={handleRecordPayment} disabled={!paymentAmount}>
                  <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>

          <Tabs.Content value="order" class="space-y-4">
            <!-- Invoice Actions -->
            <Card.Root>
              <Card.Header>
                <Card.Title>Invoice Management</Card.Title>
              </Card.Header>
              <Card.Content class="space-y-4">
                {#if order.status === 'generated' || order.status === 'sent' || order.status === 'paid'}
                  <div class="flex items-center gap-4">
                    <Button variant="outline">
                      <Icon icon="lucide:download" class="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                    <Button variant="outline">
                      <Icon icon="lucide:send" class="h-4 w-4 mr-2" />
                      Send Invoice
                    </Button>
                  </div>
                {:else}
                  <Button onclick={handleGenerateInvoice} disabled={generatingInvoice}>
                    {#if generatingInvoice}
                      <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    {:else}
                      <Icon icon="lucide:file-text" class="h-4 w-4 mr-2" />
                      Generate Invoice
                    {/if}
                  </Button>
                {/if}
              </Card.Content>
            </Card.Root>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    {/if}

    <Dialog.Footer>
      <Button variant="outline" onclick={handleClose}>
        Close
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>