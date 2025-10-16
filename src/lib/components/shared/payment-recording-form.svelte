<script lang="ts">
import { createEventDispatcher } from "svelte";
import { Button } from "$lib/components/ui/button";
import { Input } from "$lib/components/ui/input";
 import * as Select from "$lib/components/ui/select/index.js";
import { Label } from "$lib/components/ui/label";
import { Textarea } from "$lib/components/ui/textarea";
import Icon from "@iconify/svelte";
 import type { Payment, DocumentFile } from "$lib/types/document";
 import { Timestamp } from "firebase/firestore";
 import { uploadMultipleFiles } from "$lib/services/firebaseStorage";
 import { companyContext } from "$lib/stores/companyContext";
 import { auth } from "$lib/firebase";
 import { get } from "svelte/store";

  interface Props {
    orderId: string;
    outstandingAmount: number;
    clientId: string;
    onSave: (payment: Omit<Payment, "id" | "createdAt" | "updatedAt">) => void;
    onCancel: () => void;
  }

  let { orderId, outstandingAmount, clientId, onSave, onCancel }: Props = $props();

  let formData = $state({
    amount: outstandingAmount,
    paymentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    paymentMethod: "",
    reference: "",
    notes: "",
  });

  let fileInput = $state<FileList | undefined>(undefined);

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

   async function handleSave() {
     if (!validateForm()) {
       return;
     }

     // Get auth and company context
     const companyContextValue = get(companyContext);
     const userId = auth.currentUser?.uid;
     
     if (!companyContextValue.data || !userId) {
       console.error("Authentication or company context required");
       return;
     }

     let proofFilesData: DocumentFile[] | undefined;

     // Upload proof files if any
     if (fileInput && fileInput.length > 0) {
       try {
         const uploadResults = await uploadMultipleFiles(
           Array.from(fileInput),
           `payment-proof-${orderId}`,
           { path: `companies/${companyContextValue.data.companyId}/payments/proof` }
         );

         proofFilesData = uploadResults
           .filter(result => result.success)
           .map((result, index) => ({
             id: `proof-${Date.now()}-${index}`,
             companyId: companyContextValue.data!.companyId,
             fileName: fileInput![index].name,
             fileUrl: result.url!,
             fileType: fileInput![index].type,
             fileSize: fileInput![index].size,
             uploadedAt: Timestamp.now(),
             uploadedBy: userId,
           }));
       } catch (error) {
         console.error("Failed to upload proof files:", error);
         // Continue without proof files, or show error
       }
     }

      const payment: Omit<Payment, "id" | "createdAt" | "updatedAt"> = {
        orderId,
       companyId: companyContextValue.data!.companyId,
       clientId,
       amount: formData.amount,
       paymentDate: Timestamp.fromDate(new Date(formData.paymentDate)),
       paymentMethod: formData.paymentMethod,
       ...(formData.reference && { reference: formData.reference }),
       ...(formData.notes && { notes: formData.notes }),
       ...(proofFilesData && { proofFiles: proofFilesData }),
       recordedBy: userId,
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
    <Select.Root type="single" bind:value={formData.paymentMethod}>
      <Select.Trigger class="w-full">
        {paymentMethods.find(m => m.value === formData.paymentMethod)?.label || "Select payment method"}
      </Select.Trigger>
      <Select.Content>
        {#each paymentMethods as method (method.value)}
          <Select.Item value={method.value}>
            {method.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
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

  <div class="space-y-2">
    <Label for="proof-files">Payment Proof (Optional)</Label>
    <Input
      id="proof-files"
      type="file"
      multiple
      accept="image/*,application/pdf"
      bind:files={fileInput}
    />
    <p class="text-sm text-muted-foreground">
      Upload receipts, bank statements, or other proof of payment (PDF, JPG, PNG)
    </p>
    {#if fileInput && fileInput.length > 0}
      <div class="mt-2">
        <p class="text-sm font-medium">Selected files:</p>
        <ul class="text-sm text-muted-foreground">
          {#each Array.from(fileInput) as file (file.name)}
            <li>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
          {/each}
        </ul>
      </div>
    {/if}
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