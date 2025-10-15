<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { requireCompany } from '$lib/utils/auth';
  import { clientManagementStore } from '$lib/stores/clientManagement';
  import { clientInvoicesStore } from '$lib/stores/clientInvoices';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Label } from '$lib/components/ui/label';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import { toast } from 'svelte-sonner';
  import PaymentModal from '$lib/components/app/client/PaymentModal.svelte';
  import type { UserProfile } from '$lib/types/user';
  import type { ClientInvoice } from '$lib/stores/clientInvoices';

  // Define missing types until proper stores are implemented
  interface PaymentRecord {
    id: string;
    amount: number;
    method: string;
    date: Date;
    reference: string;
    status: string;
  }

  interface DocumentRecord {
    id: string;
    name: string;
    type: string;
    sentDate: Date;
    status: string;
  }

  interface EmailRecord {
    id: string;
    subject: string;
    sentDate: Date;
    status: string;
    opened: boolean;
  }

  // Company access is checked at layout level

  const clientStore = clientManagementStore;
  const invoiceStore = clientInvoicesStore;
  const clientId = $page.params.id as string;
  const invoiceId = $page.params.invoiceId as string;

  let client = $state<UserProfile | undefined>(undefined);
  let invoice = $state<ClientInvoice | undefined>(undefined);
  let loading = $state(true);
  let activeTab = $state('details');
  let showPaymentModal = $state(false);

  let payments = $state<PaymentRecord[]>([]);

  let relatedDocuments = $state<DocumentRecord[]>([]);
  let relatedEmails = $state<EmailRecord[]>([]);

  onMount(async () => {
    try {
      // Load client data
      client = clientStore.getClient(clientId);
      if (!client) {
        toast.error('Client not found');
        goto('/clients');
        return;
      }

      // TODO: Load invoice data from store
      // For now, show empty state until invoice store is implemented
      invoice = undefined;

    } catch (error) {
      console.error('Error loading invoice data:', error);
      toast.error('Failed to load invoice data');
    } finally {
      loading = false;
    }
  });

  function handleBack() {
    goto(`/clients/${clientId}`);
  }

  function getStatusBadge(status: string) {
    const variants = {
      paid: 'default',
      partially_paid: 'secondary',
      pending: 'outline',
      overdue: 'destructive',
      sent: 'secondary',
      delivered: 'default',
      completed: 'default',
      opened: 'secondary',
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

  function getPaidAmount() {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  function getOutstandingAmount() {
    return (invoice?.amount || 0) - getPaidAmount();
  }

  function handleRecordPayment() {
    showPaymentModal = true;
  }

  function handlePaymentComplete() {
    toast.success('Payment recorded successfully');
    showPaymentModal = false;
    // Refresh data would go here
  }
</script>

<svelte:head>
  <title>{invoice?.number || 'Invoice'} - {client?.displayName || 'Client'} - CRM</title>
</svelte:head>

{#if loading}
  <div class="flex items-center justify-center min-h-[400px]">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span class="ml-2">Loading invoice...</span>
  </div>
{:else if !invoice || !client}
  <div class="flex flex-col items-center justify-center min-h-[400px]">
    <h2 class="text-2xl font-bold">Invoice Not Found</h2>
    <p class="text-muted-foreground mt-2">The requested invoice could not be found.</p>
    <Button onclick={handleBack} class="mt-4">Back to Client</Button>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumb.Root>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="/clients">Clients</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Link href={`/clients/${clientId}`}>{client?.displayName || 'Client'}</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Page>{invoice?.number || 'Invoice'}</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <Button variant="ghost" onclick={handleBack}>
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to {client.displayName}
        </Button>
        <div>
          <h1 class="text-3xl font-bold">{invoice.number}</h1>
          <p class="text-muted-foreground">{client.displayName} • {invoice.description}</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <Button variant="outline" onclick={handleRecordPayment} disabled={getOutstandingAmount() <= 0}>
          Record Payment
        </Button>
        <Button variant="outline">
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m-3 3V4"/>
          </svg>
          Download PDF
        </Button>
      </div>
    </div>

    <!-- Invoice Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card.Root>
        <Card.Header class="pb-3">
          <Card.Title class="text-sm font-medium">Total Amount</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{formatCurrency(invoice.amount)}</div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="pb-3">
          <Card.Title class="text-sm font-medium">Paid</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold text-green-600">{formatCurrency(getPaidAmount())}</div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="pb-3">
          <Card.Title class="text-sm font-medium">Outstanding</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold text-red-600">{formatCurrency(getOutstandingAmount())}</div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="pb-3">
          <Card.Title class="text-sm font-medium">Status</Card.Title>
        </Card.Header>
        <Card.Content>
          <Badge variant={getStatusBadge(invoice.status)} class="text-sm">
            {invoice.status.replace('_', ' ')}
          </Badge>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Tabs -->
    <Tabs.Root bind:value={activeTab}>
      <Tabs.List>
        <Tabs.Trigger value="details">Details</Tabs.Trigger>
        <Tabs.Trigger value="payments">Payment History</Tabs.Trigger>
        <Tabs.Trigger value="documents">Related Documents</Tabs.Trigger>
        <Tabs.Trigger value="emails">Related Emails</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="details" class="space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title>Invoice Details</Card.Title>
          </Card.Header>
          <Card.Content class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <Label class="text-sm font-medium">Invoice Number</Label>
                <p class="text-sm">{invoice.number}</p>
              </div>
              <div class="space-y-2">
                <Label class="text-sm font-medium">Status</Label>
                <Badge variant={getStatusBadge(invoice.status)}>
                  {invoice.status.replace('_', ' ')}
                </Badge>
              </div>
              <div class="space-y-2">
                <Label class="text-sm font-medium">Issue Date</Label>
                <p class="text-sm">{formatDate(invoice.createdAt)}</p>
              </div>
              <div class="space-y-2">
                <Label class="text-sm font-medium">Due Date</Label>
                <p class="text-sm">{formatDate(invoice.dueDate)}</p>
              </div>
              <div class="space-y-2">
                <Label class="text-sm font-medium">Client</Label>
                <p class="text-sm">{client.displayName}</p>
              </div>
              <div class="space-y-2">
                <Label class="text-sm font-medium">Description</Label>
                <p class="text-sm">{invoice.description}</p>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <Tabs.Content value="payments" class="space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title>Payment History</Card.Title>
            <Card.Description>
              All payments recorded for this invoice
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              {#each payments as payment}
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex-1">
                    <h4 class="font-medium">{formatCurrency(payment.amount)}</h4>
                    <p class="text-sm text-muted-foreground">
                      {payment.method} • {payment.reference} • {formatDate(payment.date)}
                    </p>
                  </div>
                  <Badge variant={getStatusBadge(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              {/each}
              {#if payments.length === 0}
                <div class="text-center py-8 text-muted-foreground">
                  <p>No payments recorded for this invoice.</p>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <Tabs.Content value="documents" class="space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title>Related Documents</Card.Title>
            <Card.Description>
              Documents sent with or related to this invoice
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              {#each relatedDocuments as doc}
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center space-x-3">
                    <svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <div>
                      <h4 class="font-medium">{doc.name}</h4>
                      <p class="text-sm text-muted-foreground">
                        {doc.type} • Sent {formatDate(doc.sentDate)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusBadge(doc.status)}>
                    {doc.status}
                  </Badge>
                </div>
              {/each}
              {#if relatedDocuments.length === 0}
                <div class="text-center py-8 text-muted-foreground">
                  <p>No documents found for this invoice.</p>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <Tabs.Content value="emails" class="space-y-6">
        <Card.Root>
          <Card.Header>
            <Card.Title>Related Emails</Card.Title>
            <Card.Description>
              Email communications related to this invoice
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              {#each relatedEmails as email}
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex-1">
                    <h4 class="font-medium">{email.subject}</h4>
                    <p class="text-sm text-muted-foreground">
                      Sent {formatDate(email.sentDate)}
                      {#if email.opened}
                        <span class="ml-2 text-green-600">• Opened</span>
                      {/if}
                    </p>
                  </div>
                  <Badge variant={getStatusBadge(email.status)}>
                    {email.status}
                  </Badge>
                </div>
              {/each}
              {#if relatedEmails.length === 0}
                <div class="text-center py-8 text-muted-foreground">
                  <p>No emails found for this invoice.</p>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>

    <!-- Payment Modal -->
    <PaymentModal
      invoice={invoice}
      open={showPaymentModal}
      onPaymentComplete={handlePaymentComplete}
    />
  </div>
{/if}