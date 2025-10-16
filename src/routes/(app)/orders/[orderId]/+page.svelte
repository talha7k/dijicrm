<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { doc, getDoc } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import type { Order } from '$lib/types/document';
  import { activeCompanyId } from '$lib/stores/companyContext';

  let order = $state<Order | null>(null);
  let loading = $state(true);
  let error = $state('');

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

    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        const data = orderDoc.data() as Order;
        if (data.companyId === companyId) {
          order = data;
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
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>{error}</p>
{:else if order}
  <h1>{order.title}</h1>
  <p>Status: {order.status}</p>
  <p>Total: {order.totalAmount}</p>
  <p>Paid: {order.paidAmount}</p>
  <p>Outstanding: {order.outstandingAmount}</p>
  <p>Description: {order.description || 'N/A'}</p>
{:else}
  <p>Order not found</p>
{/if}