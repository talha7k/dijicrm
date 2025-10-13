<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Progress } from "$lib/components/ui/progress";

  import Icon from "@iconify/svelte";
  import type { DocumentDelivery } from "$lib/types/document";

  interface Props {
    deliveries: DocumentDelivery[];
    onRetry?: (deliveryId: string) => void;
  }

  let { deliveries, onRetry }: Props = $props();

  let deliveryStats = $derived(() => {
    const total = deliveries.length;
    const sent = deliveries.filter(d => d.status === "sent").length;
    const delivered = deliveries.filter(d => d.status === "delivered").length;
    const bounced = deliveries.filter(d => d.status === "bounced").length;
    const complained = deliveries.filter(d => d.status === "complained").length;

    return { total, sent, delivered, bounced, complained };
  });

  let progressPercentage = $derived(() => {
    const stats = deliveryStats();
    if (stats.total === 0) return 0;
    return Math.round((stats.sent / stats.total) * 100);
  });

  function getStatusColor(status: DocumentDelivery['status']): string {
    switch (status) {
      case "sent": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "bounced": return "bg-red-100 text-red-800";
      case "complained": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusIcon(status: DocumentDelivery['status']): string {
    switch (status) {
      case "sent": return "lucide:send";
      case "delivered": return "lucide:check-circle";
      case "bounced": return "lucide:x-circle";
      case "complained": return "lucide:alert-triangle";
      case "pending": return "lucide:clock";
      default: return "lucide:help-circle";
    }
  }

  function formatDate(date: any): string {
    if (!date) return "N/A";
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  }
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <Icon icon="lucide:send" class="h-5 w-5" />
      Document Delivery Status
    </CardTitle>
    <CardDescription>
      Track the delivery status of sent documents
    </CardDescription>
  </CardHeader>
  <CardContent class="space-y-6">
    <!-- Overall Progress -->
    {#if deliveryStats().total > 0}
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>Delivery Progress</span>
          <span>{deliveryStats().sent} of {deliveryStats().total} sent</span>
        </div>
        <Progress value={progressPercentage()} class="w-full" />
        <div class="flex gap-4 text-xs text-muted-foreground">
          <span class="flex items-center gap-1">
            <Icon icon="lucide:check-circle" class="h-3 w-3 text-green-500" />
            {deliveryStats().delivered} delivered
          </span>
          <span class="flex items-center gap-1">
            <Icon icon="lucide:x-circle" class="h-3 w-3 text-red-500" />
            {deliveryStats().bounced} bounced
          </span>
          {#if deliveryStats().complained > 0}
            <span class="flex items-center gap-1">
              <Icon icon="lucide:alert-triangle" class="h-3 w-3 text-yellow-500" />
              {deliveryStats().complained} complaints
            </span>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Individual Deliveries -->
    {#if deliveries.length > 0}
      <div class="space-y-3">
        <h4 class="text-sm font-medium">Delivery Details</h4>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          {#each deliveries as delivery (delivery.id)}
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div class="flex items-center gap-3">
                 <Icon
                   icon={getStatusIcon(delivery.status)}
                   class="h-4 w-4 {getStatusColor(delivery.status)}"
                 />
                <div>
                  <p class="text-sm font-medium">{delivery.recipientEmail}</p>
                  <p class="text-xs text-muted-foreground">
                    Document: {delivery.documentId}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Badge class={getStatusColor(delivery.status)}>
                  {delivery.status}
                </Badge>

                {#if delivery.status === "bounced" && delivery.retryCount < delivery.maxRetries && onRetry}
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => onRetry(delivery.id)}
                  >
                    <Icon icon="lucide:rotate-cw" class="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                {/if}

                {#if delivery.sentAt}
                  <span class="text-xs text-muted-foreground">
                    {formatDate(delivery.sentAt)}
                  </span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="text-center py-6 text-muted-foreground">
        <Icon icon="lucide:inbox" class="h-8 w-8 mx-auto mb-2" />
        <p>No documents have been sent yet</p>
      </div>
    {/if}

    <!-- Error Summary -->
    {#if deliveryStats().bounced > 0}
      <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center gap-2 text-red-800">
          <Icon icon="lucide:alert-triangle" class="h-4 w-4" />
          <span class="text-sm font-medium">
            {deliveryStats().bounced} delivery failure{deliveryStats().bounced > 1 ? 's' : ''}
          </span>
        </div>
        <p class="text-xs text-red-700 mt-1">
          Some documents could not be delivered. Check the recipient email addresses or try again later.
        </p>
      </div>
    {/if}
  </CardContent>
</Card>