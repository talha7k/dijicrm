<script lang="ts">
  import { goto } from '$app/navigation';
  import { Badge } from '$lib/components/ui/badge';

  function getStatusBadge(status: string) {
    const variants = {
      completed: 'default',
      in_progress: 'secondary',
      pending: 'outline',
      cancelled: 'destructive',
      paid: 'default',
      overdue: 'destructive',
      sent: 'secondary',
      delivered: 'default',
    } as const;

    return variants[status as keyof typeof variants] || 'outline';
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  import type { Order } from '$lib/types/document';

  interface Props {
    order: Order;
    onClick?: () => void;
    onRecordPayment?: (order: Order) => void;
    clientName?: string;
  }

  let { order, onClick, onRecordPayment, clientName }: Props = $props();
</script>

<div class="border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg bg-card shadow-sm">
  <div
    class="p-6 cursor-pointer hover:bg-muted/20 transition-colors"
    role="button"
    tabindex="0"
    onclick={() => goto(`/orders/${order.id}`)}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        goto(`/orders/${order.id}`);
        e.preventDefault();
      }
    }}
  >
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <h4 class="text-sm truncate text-foreground">{order.title}</h4>
        <div class="flex items-center space-x-2 mt-2">
          {#if order.selectedProducts && order.selectedProducts.length > 0}
            <Badge variant="secondary" class="text-xs">
              {order.selectedProducts.length} item{order.selectedProducts.length > 1 ? 's' : ''}
            </Badge>
          {/if}
          <Badge variant={getStatusBadge(order.status)} class="text-xs">
            {order.status.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" class="text-xs flex items-center space-x-1">
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1v22m5-18H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span>{formatCurrency(order.totalAmount)}</span>
          </Badge>
        </div>
        <div class="flex mt-2">
          <div class="space-y-1">
            <div class="flex items-center text-sm text-muted-foreground">
              <svg class="h-3 w-3 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Order #{order.id.slice(-6)}
            </div>
            <div class="flex items-center text-sm text-muted-foreground">
              <svg class="h-3 w-3 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              {clientName || 'Unknown Client'}
            </div>
            <div class="flex items-center text-sm text-muted-foreground">
              <svg class="h-3 w-3 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {formatDate(order.createdAt?.toDate() || new Date())}
            </div>
          </div>
          {#if order.description}
            <div class="flex-1 ml-4">
              <p class="text-xs text-muted-foreground line-clamp-2 pl-2">
                {order.description.slice(0, 120)}{order.description.length > 120 ? '...' : ''}
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>