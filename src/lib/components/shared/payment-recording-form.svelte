<script lang="ts">
import { createEventDispatcher } from "svelte";
import { Button } from "$lib/components/ui/button";
import { Input } from "$lib/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
import { Label } from "$lib/components/ui/label";
import { Textarea } from "$lib/components/ui/textarea";
import Icon from "@iconify/svelte";
import type { Payment } from "$lib/types/document";
import { Timestamp } from "firebase/firestore";

  interface Props {
    invoiceId: string;
    outstandingAmount: number;
    onSave: (payment: Omit<Payment, "id" | "createdAt" | "updatedAt">) => void;
    onCancel: () => void;
  }

  let { invoiceId, outstandingAmount, onSave, onCancel }: Props = $props();

  let formData = $state({
    amount: outstandingAmount,
    paymentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    paymentMethod: "",
    reference: "",
    notes: "",
  });

  let errors = $state({
    amount: "",
    paymentDate: "",
    paymentMethod: "",
  });

  const paymentMethods = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "credit_card", label: "Credit Card" },
    { value: "debit_card", label: "Debit Card" },
    { value: "check", label: "Check" },
    { value: "cash", label: "Cash" },
    { value: "paypal", label: "PayPal" },
    { value: "other", label: "Other" },
  ];

  function validateForm(): boolean {
    errors = { amount: "", paymentDate: "", paymentMethod: "" };
    let isValid = true;

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = "Payment amount must be greater than 0";
      isValid = false;
    }

    if (formData.amount > outstandingAmount) {
      errors.amount = `Payment amount cannot exceed outstanding balance of $${outstandingAmount.toFixed(2)}`;
      isValid = false;
    }

    if (!formData.paymentDate) {
      errors.paymentDate = "Payment date is required";
      isValid = false;
    } else {
      const paymentDate = new Date(formData.paymentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (paymentDate > today) {
        errors.paymentDate = "Payment date cannot be in the future";
        isValid = false;
      }
    }

    if (!formData.paymentMethod) {
      errors.paymentMethod = "Payment method is required";
      isValid = false;
    }

    return isValid;
  }

  function handleSave() {
    if (!validateForm()) {
      return;
    }

    const payment: Omit<Payment, "id" | "createdAt" | "updatedAt"> = {
      invoiceId,
      companyId: "company-1", // TODO: Get from auth context
      clientId: "client-1", // TODO: Get from invoice context
      amount: formData.amount,
      paymentDate: Timestamp.fromDate(new Date(formData.paymentDate)),
      paymentMethod: formData.paymentMethod,
      reference: formData.reference || undefined,
      notes: formData.notes || undefined,
      recordedBy: "user-1", // TODO: Get from auth context
    };

    onSave(payment);
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
</script>

<div class="space-y-6">
  <div class="space-y-2">
    <Label for="amount">Payment Amount *</Label>
    <Input
      id="amount"
      type="number"
      step="0.01"
      min="0.01"
      max={outstandingAmount}
      bind:value={formData.amount}
      placeholder="0.00"
    />
    {#if errors.amount}
      <p class="text-sm text-destructive">{errors.amount}</p>
    {/if}
    <p class="text-sm text-muted-foreground">
      Outstanding balance: {formatCurrency(outstandingAmount)}
    </p>
  </div>

  <div class="space-y-2">
    <Label for="payment-date">Payment Date *</Label>
    <Input
      id="payment-date"
      type="date"
      bind:value={formData.paymentDate}
    />
    {#if errors.paymentDate}
      <p class="text-sm text-destructive">{errors.paymentDate}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="payment-method">Payment Method *</Label>
    <Select type="single" bind:value={formData.paymentMethod}>
      <SelectTrigger>
        <SelectValue placeholder="Select payment method" />
      </SelectTrigger>
      <SelectContent>
        {#each paymentMethods as method (method.value)}
          <SelectItem value={method.value}>
            {method.label}
          </SelectItem>
        {/each}
      </SelectContent>
    </Select>
    {#if errors.paymentMethod}
      <p class="text-sm text-destructive">{errors.paymentMethod}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="reference">Reference Number (Optional)</Label>
    <Input
      id="reference"
      bind:value={formData.reference}
      placeholder="Check number, transaction ID, etc."
    />
  </div>

  <div class="space-y-2">
    <Label for="notes">Notes (Optional)</Label>
    <Textarea
      id="notes"
      bind:value={formData.notes}
      placeholder="Additional payment details or notes"
      rows={3}
    />
  </div>

  <div class="flex justify-end gap-2">
    <Button variant="outline" onclick={onCancel}>
      Cancel
    </Button>
    <Button onclick={handleSave}>
      <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
      Record Payment
    </Button>
  </div>
</div>