<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import DashboardLayout from '$lib/components/shared/dashboard-layout.svelte';
  import MetricCard from '$lib/components/shared/metric-card.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { requireCompany } from '$lib/utils/auth';
  import { formatDateTime } from '$lib/utils';
  import { useCompanyMetrics, type CompanyMetrics } from '$lib/hooks/useCompanyMetrics';
  import Icon from '@iconify/svelte';

  let mounted = $state(false);

   onMount(() => {
     mounted = true;
     // Company access is checked at layout level
   });

  let metrics = useCompanyMetrics();

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  function getActivityIcon(type: CompanyMetrics['recentActivity'][0]['type']) {
    switch (type) {
      case 'invoice_created': return 'lucide:file-text';
      case 'payment_received': return 'lucide:credit-card';
      case 'client_added': return 'lucide:user-plus';
      case 'client_invited': return 'lucide:mail';
      case 'client_activated': return 'lucide:user-check';
      default: return 'lucide:activity';
    }
  }
</script>

{#if mounted}
  <DashboardLayout title="Company Dashboard" description="Manage your business operations and client relationships">
    <!-- Metrics Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <MetricCard
        title="Total Invoices"
        value={$metrics.data?.totalInvoices || 0}
        icon="lucide:file-text"
      />
      <MetricCard
        title="Outstanding Amount"
        value={formatCurrency($metrics.data?.outstandingAmount || 0)}
        icon="lucide:dollar-sign"
      />
      <MetricCard
        title="Active Clients"
        value={$metrics.data?.activeClients || 0}
        icon="lucide:users"
      />
      <MetricCard
        title="Invited Clients"
        value={$metrics.data?.invitedClients || 0}
        icon="lucide:mail"
      />
      <MetricCard
        title="Overdue Invoices"
        value={$metrics.data?.overdueInvoices || 0}
        icon="lucide:alert-triangle"
      />
    </div>

    <!-- Recent Activity -->
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your business operations</CardDescription>
      </CardHeader>
      <CardContent>
        {#if $metrics.loading}
          <div class="text-center py-4">Loading activity...</div>
        {:else if $metrics.data?.recentActivity && $metrics.data.recentActivity.length > 0}
          <div class="space-y-4">
            {#each $metrics.data.recentActivity as activity}
              <div class="flex items-start space-x-4 p-4 border rounded-lg">
                <div class="flex-shrink-0">
                  <Icon icon={getActivityIcon(activity.type)} class="h-5 w-5 text-muted-foreground" />
                </div>
                <div class="flex-1 space-y-1">
                  <p class="text-sm font-medium">{activity.description}</p>
                  <p class="text-xs text-muted-foreground">{formatDateTime(activity.timestamp)}</p>
                </div>
                {#if activity.amount}
                  <div class="text-right">
                    <p class="text-sm font-medium">{formatCurrency(activity.amount)}</p>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-4 text-muted-foreground">
            No recent activity
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Quick Actions -->
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to manage your business</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button onclick={() => goto('/invoices')} class="h-20 flex-col">
            <Icon icon="lucide:plus" class="h-6 w-6 mb-2" />
            Create Invoice
          </Button>
          <Button onclick={() => goto('/clients')} variant="outline" class="h-20 flex-col">
            <Icon icon="lucide:users" class="h-6 w-6 mb-2" />
            Manage Clients
          </Button>
          <Button onclick={() => goto('/invoices')} variant="outline" class="h-20 flex-col">
            <Icon icon="lucide:file-text" class="h-6 w-6 mb-2" />
            View Invoices
          </Button>
          <Button onclick={() => goto('/billing')} variant="outline" class="h-20 flex-col">
            <Icon icon="lucide:settings" class="h-6 w-6 mb-2" />
            Billing Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  </DashboardLayout>
{/if}