<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import PaymentRecordingForm from '$lib/components/shared/payment-recording-form.svelte';
  import type { Order } from '$lib/types/document';
  import { paymentsStore } from '$lib/stores/payments';
  import { ordersStore } from '$lib/stores/orders';
  import { companyContext, activeCompanyId } from '$lib/stores/companyContext';
  import { auth } from '$lib/firebase';
  import { get } from 'svelte/store';
  import { toast } from 'svelte-sonner';
  import { Timestamp } from 'firebase/firestore';

  interface Props {
    order: Order | null;
    open: boolean;
    onPaymentComplete?: () => void;
  }

  let { order, open = $bindable(false), onPaymentComplete }: Props = $props();

  async function handlePaymentSave(payment: any) {
    console.log('🔄 Starting payment recording process...');
    console.log('💰 Payment details:', payment);

    try {
      // Check Firebase auth state
      if (!auth.currentUser) {
        console.error('❌ No authenticated user');
        toast.error('User not authenticated');
        return;
      }
      console.log('✅ User authenticated:', auth.currentUser.uid);

      // Check company context
      const currentCompanyId = get(activeCompanyId);
      console.log('🏢 Active company ID:', currentCompanyId);

      if (!currentCompanyId) {
        console.error('❌ No active company context');
        toast.error('No active company context');
        return;
      }

      // Record the payment and get the saved payment object
      console.log('💳 Calling paymentsStore.recordPayment...');
      const savedPayment = await paymentsStore.recordPayment(payment);
      console.log('✅ Payment recorded successfully:', savedPayment);

      // Calculate new financial values
      const newPaidAmount = order!.paidAmount + payment.amount;
      const newOutstandingAmount = Math.max(0, order!.totalAmount - newPaidAmount);
      const newStatus = newOutstandingAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partially_paid' : order!.status;

      console.log('🔢 Financial calculations:', {
        oldPaidAmount: order!.paidAmount,
        newPaidAmount,
        newOutstandingAmount,
        newStatus
      });

      // Update order with complete payment information
      console.log('📝 Updating order with payment information...');
      await ordersStore.updateOrder(order!.id, {
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstandingAmount,
        status: newStatus,
        payments: [...order!.payments, savedPayment.id],
        updatedAt: Timestamp.now(),
      });
      console.log('✅ Order updated successfully');

      toast.success('Payment recorded successfully');
      open = false;
      onPaymentComplete?.();
    } catch (error) {
      console.error('❌ Error recording payment:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? error.message
        : 'Unknown error';
      toast.error(`Failed to record payment: ${errorMessage}`);
    }
  }

  function handleCancel() {
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[500px] scrollbar-hide">
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