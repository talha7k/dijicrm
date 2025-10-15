<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "$lib/components/ui/dialog";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";

  import Icon from "@iconify/svelte";
   import { requireCompany } from "$lib/utils/auth";
   import { formatDateShort } from "$lib/utils";
    import { paymentsStore } from "$lib/stores/payments";
   import { ordersStore } from "$lib/stores/orders";
   import { clientManagementStore } from "$lib/stores/clientManagement";
   import { updateInvoiceAfterPayment, type InvoiceData } from "$lib/utils/paymentCalculations";
  import PaymentRecordingForm from "$lib/components/shared/payment-recording-form.svelte";
  import PaymentHistory from "$lib/components/shared/payment-history.svelte";
  import type { Payment } from "$lib/types/document";
  import type { Order } from "$lib/types/document";
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";

   let invoiceId = $derived($page.params.id);
   let mounted = $state(false);
   let showPaymentDialog = $state(false);
   let loading = $state(true);
   let error = $state<string | null>(null);

   // Invoice and client data
   let order = $state<Order | null>(null);
   let client = $state<any>(null);
   let payments = $state<Payment[]>([]);

   const orderStore = ordersStore;
   const clientStore = clientManagementStore;

   onMount(async () => {
     mounted = true;
     // Company access is checked at layout level

     try {
       if (!invoiceId) {
         error = "Invalid invoice ID";
         return;
       }

// Load all orders and find the specific one
        await orderStore.loadOrders("company-1"); // TODO: Get from auth
        const orderState = orderStore.getState();
        const allOrders = orderState?.data || [];
        order = allOrders.find((o: any) => o.id === invoiceId) || null;

       if (!order) {
         error = "Invoice not found";
         return;
       }

       // Load client data
       await clientStore.loadClients();
       const clientState = clientStore.getState();
       const allClients = clientState?.clients || [];
       client = allClients.find((c: any) => c.uid === order?.clientId) || null;

       // Load payments for this invoice
       await paymentsStore.loadPaymentsForInvoice(invoiceId);

     } catch (err) {
       console.error("Error loading invoice:", err);
       error = "Failed to load invoice";
     } finally {
       loading = false;
     }
   });

// Subscribe to payments changes
   $effect(() => {
     if (mounted) {
       paymentsStore.subscribe((state) => {
         payments = state.data?.filter(p => p.invoiceId === invoiceId) || [];
       });
     }
   });

async function handleRecordPayment(payment: Omit<Payment, "id" | "createdAt" | "updatedAt">) {
     if (!order) return;

     try {
       // Record the payment
       await paymentsStore.recordPayment(payment);

       // Calculate new payment totals
       const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;
       
       // Update order status based on payment
       let newStatus = order.status;
       if (totalPaid >= order.totalAmount) {
         newStatus = 'paid';
       } else if (totalPaid > 0) {
         newStatus = 'partially_paid';
       }

       // Update order if status changed
       if (newStatus !== order.status) {
         await orderStore.updateOrder(order.id, { status: newStatus });
         toast.success(`Payment recorded and status updated to ${newStatus.replace('_', ' ')}`);
       } else {
         toast.success('Payment recorded successfully');
       }

       showPaymentDialog = false;
     } catch (error) {
       console.error('Error recording payment:', error);
       toast.error('Failed to record payment');
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
  <DashboardLayout title="Invoice Details" description="View invoice information and manage payments">
    <div class="space-y-6">
      {#if loading}
        <Card>
          <CardContent class="text-center py-8">
            <Icon icon="lucide:loader" class="h-8 w-8 mx-auto text-muted-foreground mb-4 animate-spin" />
            <p class="text-muted-foreground">Loading invoice...</p>
          </CardContent>
        </Card>
      {:else if error || !order}
        <Card>
          <CardContent class="text-center py-8">
            <Icon icon="lucide:file-x" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 class="text-lg font-medium mb-2">Invoice Not Found</h3>
            <p class="text-muted-foreground mb-4">
              {error || "The requested invoice could not be found."}
            </p>
            <Button variant="outline" onclick={() => goto("/invoices")}>
              <Icon icon="lucide:arrow-left" class="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </CardContent>
        </Card>
      {:else}
      <!-- Invoice Header -->
      <Card>
        <CardHeader>
          <div class="flex items-start justify-between">
            <div>
              <CardTitle class="text-2xl">{order.title}</CardTitle>
              <CardDescription class="mt-2">
                {client ? (client.displayName || `${client.firstName} ${client.lastName}`) : 'Unknown Client'} • {client?.email || 'No email'}
              </CardDescription>
            </div>
            <div class="flex items-center gap-4">
              <Badge class={getStatusColor(order.status)}>
                {order.status.replace("_", " ").toUpperCase()}
              </Badge>
              {#if order.outstandingAmount > 0}
                <Dialog bind:open={showPaymentDialog}>
                  <DialogTrigger>
                    <Button>
                      <Icon icon="lucide:credit-card" class="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent class="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Record Payment</DialogTitle>
                      <DialogDescription>
                        Record a payment for invoice {order.id}
                      </DialogDescription>
                    </DialogHeader>
                     <PaymentRecordingForm
                       invoiceId={order.id}
                       outstandingAmount={order.outstandingAmount}
                       clientId={order.clientId}
                       onSave={handleRecordPayment}
                       onCancel={() => showPaymentDialog = false}
                     />
                  </DialogContent>
                </Dialog>
              {/if}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p class="text-2xl font-bold">{formatCurrency(order.totalAmount)}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">Paid Amount</p>
              <p class="text-2xl font-bold text-green-600">{formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">Outstanding</p>
              <p class="text-2xl font-bold text-red-600">{formatCurrency(order.outstandingAmount)}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">Created Date</p>
              <p class="text-lg font-semibold">{formatDateShort(order.createdAt?.toDate())}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Invoice Items -->
      <Card>
        <CardHeader>
          <CardTitle>Products/Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product ID</TableHead>
                <TableHead class="text-right">Quantity</TableHead>
                <TableHead class="text-right">Price</TableHead>
                <TableHead class="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each order.selectedProducts as productId (productId)}
                <TableRow>
                  <TableCell class="font-medium">{productId}</TableCell>
                  <TableCell class="text-right">1</TableCell>
                  <TableCell class="text-right">{formatCurrency(0)}</TableCell>
                  <TableCell class="text-right">{formatCurrency(0)}</TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

<!-- Payment History -->
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>All payments recorded for this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            {#if payments.length === 0}
              <p class="text-muted-foreground text-center py-4">No payments recorded yet</p>
            {:else}
              <div class="space-y-3">
                {#each payments as payment}
                  <div class="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p class="font-medium">{formatCurrency(payment.amount)}</p>
                      <p class="text-sm text-muted-foreground">
                        {payment.paymentMethod?.replace('_', ' ') || 'Unknown'} • {formatDateShort(payment.paymentDate?.toDate())}
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
          </CardContent>
        </Card>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <Button variant="outline" onclick={() => goto("/invoices")}>
            <Icon icon="lucide:arrow-left" class="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      {/if}
    </div>
  </DashboardLayout>
{/if}