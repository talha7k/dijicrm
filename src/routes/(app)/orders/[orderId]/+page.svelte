<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
   import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
   import { db } from '$lib/firebase';
   import type { Order } from '$lib/types/document';
    import type { UserProfile } from '$lib/types/user';
   import { activeCompanyId } from '$lib/stores/companyContext';
   import { productsStore } from '$lib/stores/products';
   import OrderDetail from '$lib/components/app/client/OrderDetail.svelte';
   import PaymentModal from '$lib/components/app/client/PaymentModal.svelte';
   import { toast } from 'svelte-sonner';

   let order = $state<Order | null>(null);
   let clientName = $state<string>('Unknown Client');
   let loading = $state(true);
   let error = $state('');

  // Payment modal state
  let showPaymentModal = $state(false);
  let selectedOrder = $state<Order | null>(null);

   onMount(async () => {
     const orderId = page.params.orderId;
     if (!orderId) {
       error = 'Invalid order ID';
       loading = false;
       return;
     }
     const companyId = $activeCompanyId;

     if (!companyId) {
       error = 'No active company';
       loading = false;
       return;
     }

     // Load products data to ensure product details are available
     try {
       await productsStore.loadProducts();
     } catch (productError) {
       console.error('Error loading products:', productError);
       // Continue even if products fail to load
     }

     try {
       const orderDoc = await getDoc(doc(db, 'orders', orderId));
       if (orderDoc.exists()) {
         const data = orderDoc.data() as Order;
         if (data.companyId === companyId) {
           order = data;

           // Fetch client information
           if (data.clientId) {
             try {
               const clientDoc = await getDoc(doc(db, 'users', data.clientId));
               if (clientDoc.exists()) {
                 const clientData = clientDoc.data() as UserProfile;
                 clientName = clientData.displayName || clientData.email || 'Unknown Client';
               }
             } catch (clientError) {
               console.error('Error loading client:', clientError);
               // Keep default clientName
             }
           }
         } else {
           error = 'Order not found';
         }
       } else {
         error = 'Order not found';
       }
    } catch (err) {
      console.error('Error loading order:', err);
      error = 'Failed to load order';
    }
    loading = false;
  });

  function handleRecordPayment(order: Order) {
    selectedOrder = order;
    showPaymentModal = true;
  }

  function handlePaymentComplete() {
    // Refresh the order data after payment
    toast.success('Payment recorded successfully');
    showPaymentModal = false;
    // Optionally reload the page or update the order data
    window.location.reload();
  }
</script>

<div class="max-w-6xl mx-auto p-6">
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="ml-3 text-lg text-muted-foreground">Loading order details...</span>
    </div>
  {:else if error}
    <div class="text-center py-12">
      <svg class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <h2 class="text-xl font-semibold text-foreground mb-2">Error Loading Order</h2>
      <p class="text-muted-foreground">{error}</p>
    </div>
  {:else if order}
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Order Details</h1>
          <p class="text-muted-foreground">View and manage order information</p>
        </div>
      </div>

       <!-- Order Detail View -->
       <OrderDetail
         {order}
         onRecordPayment={handleRecordPayment}
         {clientName}
       />
    </div>
  {:else}
    <div class="text-center py-12">
      <svg class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h2 class="text-xl font-semibold text-foreground mb-2">Order Not Found</h2>
      <p class="text-muted-foreground">The order you're looking for doesn't exist or has been deleted.</p>
    </div>
  {/if}
</div>

<!-- Payment Modal -->
{#if showPaymentModal && selectedOrder}
  <PaymentModal
    order={selectedOrder}
    open={showPaymentModal}
    onPaymentComplete={handlePaymentComplete}
  />
{/if}