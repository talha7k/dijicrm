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
   import { updateInvoiceAfterPayment, type InvoiceData } from "$lib/utils/paymentCalculations";
  import PaymentRecordingForm from "$lib/components/shared/payment-recording-form.svelte";
  import PaymentHistory from "$lib/components/shared/payment-history.svelte";
  import type { Payment } from "$lib/types/document";
  import { goto } from "$app/navigation";

   let invoiceId = $derived($page.params.id);
   let mounted = $state(false);
   let showPaymentDialog = $state(false);
   let loading = $state(true);
   let error = $state<string | null>(null);

   // Invoice data - will be loaded from Firebase
   let invoice = $state<InvoiceData | null>(null);

   onMount(async () => {
     mounted = true;
     // Company access is checked at layout level

     // TODO: Load invoice from Firebase
     // For now, simulate loading and set to null (not found)
     setTimeout(() => {
       loading = false;
       // If invoice not found, set error
       if (!invoiceId) {
         error = "Invalid invoice ID";
       } else {
         error = "Invoice not found";
       }
     }, 500);
   });

  // Load payments for this invoice
  $effect(() => {
    if (mounted && invoiceId) {
      paymentsStore.loadPaymentsForInvoice(invoiceId);
    }
  });

  function handleRecordPayment(payment: Omit<Payment, "id" | "createdAt" | "updatedAt">) {
    if (!invoice) return;
    // Update invoice using utility function
    invoice = updateInvoiceAfterPayment(invoice, payment.amount);

    // Record the payment
    paymentsStore.recordPayment(payment);

    showPaymentDialog = false;
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
      {:else if error || !invoice}
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
              <CardTitle class="text-2xl">{invoice.id}</CardTitle>
              <CardDescription class="mt-2">
                {invoice.clientName} • {invoice.clientEmail}
              </CardDescription>
            </div>
            <div class="flex items-center gap-4">
              <Badge class={getStatusColor(invoice.status)}>
                {invoice.status.replace("_", " ").toUpperCase()}
              </Badge>
              {#if invoice.outstandingAmount > 0}
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
                        Record a payment for invoice {invoice.id}
                      </DialogDescription>
                    </DialogHeader>
                     <PaymentRecordingForm
                       invoiceId={invoice.id}
                       outstandingAmount={invoice.outstandingAmount}
                       clientId={invoice.clientId}
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
              <p class="text-2xl font-bold">{formatCurrency(invoice.amount)}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">Paid Amount</p>
              <p class="text-2xl font-bold text-green-600">{formatCurrency(invoice.paidAmount)}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">Outstanding</p>
              <p class="text-2xl font-bold text-red-600">{formatCurrency(invoice.outstandingAmount)}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">Due Date</p>
              <p class="text-lg font-semibold">{formatDateShort(invoice.dueDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Invoice Items -->
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead class="text-right">Quantity</TableHead>
                <TableHead class="text-right">Price</TableHead>
                <TableHead class="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each invoice.items as item (item.productName)}
                <TableRow>
                  <TableCell class="font-medium">{item.productName}</TableCell>
                  <TableCell class="text-right">{item.quantity}</TableCell>
                  <TableCell class="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell class="text-right">{formatCurrency(item.total)}</TableCell>
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
           <PaymentHistory
             payments={$paymentsStore.data || []}
             loading={$paymentsStore.loading}
           />
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