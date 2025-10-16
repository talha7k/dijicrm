<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import PaymentRecordingForm from '$lib/components/shared/payment-recording-form.svelte';
  import type { Order } from '$lib/types/document';

  interface Props {
    order: Order | null;
    open: boolean;
    onPaymentComplete?: () => void;
  }

  let { order, open = $bindable(false), onPaymentComplete }: Props = $props();

  function handlePaymentSave(payment: any) {
    // In real implementation, this would save the payment
    console.log('Payment recorded:', payment);
    open = false;
    onPaymentComplete?.();
  }

  function handleCancel() {
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Record Payment</Dialog.Title>
       <Dialog.Description>
         Record a payment for order {order?.id}
       </Dialog.Description>
     </Dialog.Header>

      {#if order}
        <PaymentRecordingForm
          orderId={order.id}
          outstandingAmount={order.outstandingAmount}
          clientId={order.clientId}
          onSave={handlePaymentSave}
          onCancel={handleCancel}
        />
      {/if}
  </Dialog.Content>
</Dialog.Root>