<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";
  import Icon from "@iconify/svelte";
  import { requireCompany } from "$lib/utils/auth";
  import { formatDateShort } from "$lib/utils";
  import type { InvoiceData } from "$lib/utils/paymentCalculations";

  let invoiceId = $derived($page.params.id);
  let mounted = $state(false);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let saving = $state(false);

  // Invoice data - will be loaded from Firebase
  let invoice = $state<InvoiceData | null>(null);

  // Form data
  let formData = $state({
    number: "",
    description: "",
    status: "draft" as "draft" | "sent" | "paid" | "overdue" | "cancelled" | "generated" | "partially_paid",
    dueDate: "",
    notes: ""
  });

  onMount(async () => {
    mounted = true;
    
    if (!requireCompany()) {
      return;
    }

    await loadInvoice();
  });

  async function loadInvoice() {
    try {
      loading = true;
      // TODO: Load invoice from Firebase
      // For now, create mock data
      invoice = {
        id: invoiceId,
        number: `INV-${invoiceId.slice(-6).toUpperCase()}`,
        description: "Sample invoice description",
        status: "sent",
        dueDate: new Date(),
        createdAt: new Date(),
        items: [
          {
            id: "1",
            description: "Web Development Service",
            quantity: 1,
            unitPrice: 1000,
            total: 1000
          }
        ],
        subtotal: 1000,
        taxAmount: 80,
        totalAmount: 1080,
        paidAmount: 0,
        outstandingAmount: 1080,
        clientId: "client-1",
        clientName: "Sample Client",
        companyName: "Sample Company"
      };

      // Populate form data
      if (invoice) {
        formData.number = invoice.number;
        formData.description = invoice.description;
        formData.status = invoice.status;
        formData.dueDate = invoice.dueDate.toISOString().split('T')[0];
        formData.notes = invoice.notes || "";
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load invoice";
    } finally {
      loading = false;
    }
  }

  async function handleSave() {
    if (!invoice) return;

    try {
      saving = true;
      
      // TODO: Update invoice in Firebase
      console.log("Saving invoice:", {
        ...invoice,
        ...formData,
        dueDate: new Date(formData.dueDate)
      });

      // Navigate back to invoice detail
      if (invoiceId) {
        goto(`/invoices/${invoiceId}`);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to save invoice";
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    goto(`/invoices/${invoiceId}`);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

{#if mounted}
  <DashboardLayout title="Edit Invoice" description="Update invoice details">
    {#if loading}
      <div class="text-center py-8">
        <Icon icon="lucide:loader-2" class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading invoice...</p>
      </div>
    {:else if error}
      <div class="text-center py-8">
        <Icon icon="lucide:alert-circle" class="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p class="text-red-500">{error}</p>
        <Button class="mt-4" onclick={() => goto(`/invoices/${invoiceId}`)}>
          Back to Invoice
        </Button>
      </div>
    {:else if invoice}
      <div class="space-y-6">
        <!-- Basic Information -->
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update the basic details of this invoice</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label for="invoice-number">Invoice Number</Label>
                <Input
                  id="invoice-number"
                  bind:value={formData.number}
                  placeholder="INV-001"
                />
              </div>
              <div>
                <Label for="invoice-status">Status</Label>
                <Select.Root type="single" bind:value={formData.status}>
                  <Select.Trigger class="w-full">
                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1).replace('_', ' ')}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="draft">Draft</Select.Item>
                    <Select.Item value="generated">Generated</Select.Item>
                    <Select.Item value="sent">Sent</Select.Item>
                    <Select.Item value="partially_paid">Partially Paid</Select.Item>
                    <Select.Item value="paid">Paid</Select.Item>
                    <Select.Item value="overdue">Overdue</Select.Item>
                    <Select.Item value="cancelled">Cancelled</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
            </div>

            <div>
              <Label for="invoice-description">Description</Label>
              <Textarea
                id="invoice-description"
                bind:value={formData.description}
                placeholder="Invoice description or purpose"
                rows={3}
              />
            </div>

            <div>
              <Label for="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                bind:value={formData.dueDate}
              />
            </div>

            <div>
              <Label for="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                bind:value={formData.notes}
                placeholder="Additional notes for the client"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <!-- Invoice Items -->
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
            <CardDescription>Line items included in this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead class="text-right">Quantity</TableHead>
                  <TableHead class="text-right">Unit Price</TableHead>
                  <TableHead class="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {#each invoice.items as item}
                  <TableRow>
                    <TableCell>{item.description}</TableCell>
                    <TableCell class="text-right">{item.quantity}</TableCell>
                    <TableCell class="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell class="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                {/each}
              </TableBody>
            </Table>
            
            <div class="mt-4 space-y-2 text-right">
              <div class="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div class="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div class="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <Button variant="outline" onclick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onclick={handleSave} disabled={saving}>
            {#if saving}
              <Icon icon="lucide:loader-2" class="h-4 w-4 mr-2 animate-spin" />
            {:else}
              <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
            {/if}
            Save Changes
          </Button>
        </div>
      </div>
    {/if}
  </DashboardLayout>
{/if}