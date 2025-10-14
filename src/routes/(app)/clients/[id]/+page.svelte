<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { requireCompany } from '$lib/utils/auth';
  import { clientManagementStore } from '$lib/stores/clientManagement';
  import { productsStore } from '$lib/stores/products';
  import { clientInvoicesStore } from '$lib/stores/clientInvoices';
  import { documentDeliveryStore } from '$lib/stores/documentDelivery';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { toast } from 'svelte-sonner';
  import OrderCreationModal from '$lib/components/app/client/OrderCreationModal.svelte';
  import DocumentSendModal from '$lib/components/app/client/DocumentSendModal.svelte';
  import PDFUploadModal from '$lib/components/app/client/PDFUploadModal.svelte';
  import PaymentModal from '$lib/components/app/client/PaymentModal.svelte';
  import type { UserProfile } from '$lib/types/user';
  import type { Product } from '$lib/stores/products';
  import type { ClientInvoice } from '$lib/stores/clientInvoices';

  // Company access is checked at layout level

  const clientStore = clientManagementStore;
  const productStore = productsStore;
  const invoiceStore = clientInvoicesStore;
  const deliveryStore = documentDeliveryStore;
  const clientId = $page.params.id as string;

  let client = $state<UserProfile | undefined>(undefined);
  let products = $state<Product[]>([]);
  let invoices = $state<ClientInvoice[]>([]);
  let loading = $state(true);
  let activeTab = $state('overview');

  // Mock client orders and products for now
  let clientOrders = $state([
    {
      id: 'order-1',
      productId: 'prod-1',
      productName: 'Web Development Service',
      quantity: 1,
      amount: 5000,
      status: 'completed',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'order-2',
      productId: 'prod-2',
      productName: 'SEO Package',
      quantity: 1,
      amount: 1500,
      status: 'in_progress',
      createdAt: new Date('2024-02-01'),
    },
  ]);

  let clientDocuments = $state([
    {
      id: 'doc-1',
      name: 'Service Agreement.pdf',
      type: 'template',
      uploadedAt: new Date('2024-01-15'),
      status: 'sent',
    },
    {
      id: 'doc-2',
      name: 'Invoice-001.pdf',
      type: 'generated',
      uploadedAt: new Date('2024-01-20'),
      status: 'delivered',
    },
  ]);

  let showOrderModal = $state(false);
  let showDocumentModal = $state(false);
  let showPDFUploadModal = $state(false);
  let showPaymentModal = $state(false);
  let selectedInvoice = $state<ClientInvoice | null>(null);

  onMount(async () => {
    try {
      // Load client data
      client = clientStore.getClient(clientId);
      if (!client) {
        toast.error('Client not found');
        goto('/clients');
        return;
      }

      // Load products and invoices
      await productStore.loadProducts('company-1'); // Mock company ID
      productStore.subscribe((state) => {
        products = state.data || [];
      });

      invoiceStore.subscribe((state) => {
        invoices = state.data || [];
      });

    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Failed to load client data');
    } finally {
      loading = false;
    }
  });

  function handleBack() {
    goto('/clients');
  }

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

  function handleCreateOrder(order: any) {
    // Add the new order to the client orders
    clientOrders = [...clientOrders, order];
    showOrderModal = false;
  }

  function handleNewOrder() {
    showOrderModal = true;
  }

  function handleSendDocument() {
    showDocumentModal = true;
  }

  function handleDocumentSendComplete() {
    // Refresh documents or update status
    toast.success('Documents sent successfully');
  }

  function handleUploadDocument() {
    showPDFUploadModal = true;
  }

  function handlePDFUploadComplete(document: any) {
    // Add the uploaded document to the client documents
    clientDocuments = [...clientDocuments, document];
    toast.success('Document uploaded successfully');
  }

  function handleRecordPayment(invoice: ClientInvoice) {
    selectedInvoice = invoice;
    showPaymentModal = true;
  }

  function handlePaymentComplete() {
    // Update invoice status or refresh data
    toast.success('Payment recorded successfully');
  }

  function handleOrderStatusChange(orderId: string, newStatus: string) {
    clientOrders = clientOrders.map(order =>
      order.id === orderId
        ? { ...order, status: newStatus }
        : order
    );
    toast.success('Order status updated');
  }
</script>

<svelte:head>
  <title>{client?.displayName || 'Client'} - CRM</title>
</svelte:head>

{#if loading}
  <div class="flex items-center justify-center min-h-[400px]">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span class="ml-2">Loading client...</span>
  </div>
{:else if !client}
  <div class="flex flex-col items-center justify-center min-h-[400px]">
    <h2 class="text-2xl font-bold">Client Not Found</h2>
    <p class="text-muted-foreground mt-2">The requested client could not be found.</p>
    <Button onclick={handleBack} class="mt-4">Back to Clients</Button>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <Button variant="ghost" onclick={handleBack}>
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Clients
        </Button>
        <div>
          <h1 class="text-3xl font-bold">{client.displayName}</h1>
          <p class="text-muted-foreground">{client.email}</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <Button variant="outline" onclick={handleSendDocument}>
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
          Send Document
        </Button>
        <Button variant="outline" onclick={() => goto(`/clients/${clientId}/edit`)}>
          Edit Client
        </Button>
      </div>
    </div>

    <!-- Client Info Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card.Root>
        <Card.Header>
          <Card.Title>Contact Information</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-2">
          <div>
            <Label class="text-sm font-medium">Email</Label>
            <p class="text-sm text-muted-foreground">{client.email}</p>
          </div>
          {#if client.phoneNumber}
            <div>
              <Label class="text-sm font-medium">Phone</Label>
              <p class="text-sm text-muted-foreground">{client.phoneNumber}</p>
            </div>
          {/if}
          {#if client.address}
            <div>
              <Label class="text-sm font-medium">Address</Label>
              <p class="text-sm text-muted-foreground">
                {client.address.street && `${client.address.street}, `}
                {client.address.city && `${client.address.city}, `}
                {client.address.state && `${client.address.state} `}
                {client.address.postalCode && client.address.postalCode}
              </p>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Account Status</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="flex items-center justify-between">
            <span class="text-sm">Status</span>
            <Badge variant={client.isActive ? 'default' : 'secondary'}>
              {client.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div class="flex items-center justify-between mt-2">
            <span class="text-sm">Last Login</span>
            <span class="text-sm text-muted-foreground">
              {client.lastLoginAt ? formatDate(client.lastLoginAt.toDate()) : 'Never'}
            </span>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Financial Summary</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm">Total Invoiced</span>
              <span class="text-sm font-medium">
                {formatCurrency(invoices.reduce((sum, inv) => sum + inv.amount, 0))}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm">Paid</span>
              <span class="text-sm font-medium text-green-600">
                {formatCurrency(invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0))}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm">Outstanding</span>
              <span class="text-sm font-medium text-red-600">
                {formatCurrency(invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0))}
              </span>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Tabs -->
    <Tabs.Root bind:value={activeTab}>
      <Tabs.List class="grid w-full grid-cols-4">
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="products">Products & Orders</Tabs.Trigger>
        <Tabs.Trigger value="invoices">Invoices & Payments</Tabs.Trigger>
        <Tabs.Trigger value="documents">Documents</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="overview" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Recent Orders -->
          <Card.Root>
            <Card.Header>
              <Card.Title>Recent Orders</Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="space-y-3">
                {#each clientOrders.slice(0, 3) as order}
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium">{order.productName}</p>
                      <p class="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium">{formatCurrency(order.amount)}</p>
                      <Badge variant={getStatusBadge(order.status)} class="text-xs">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                {/each}
              </div>
            </Card.Content>
          </Card.Root>

          <!-- Recent Documents -->
          <Card.Root>
            <Card.Header>
              <Card.Title>Recent Documents</Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="space-y-3">
                {#each clientDocuments.slice(0, 3) as doc}
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium">{doc.name}</p>
                      <p class="text-xs text-muted-foreground">{formatDate(doc.uploadedAt)}</p>
                    </div>
                    <Badge variant={getStatusBadge(doc.status)} class="text-xs">
                      {doc.status}
                    </Badge>
                  </div>
                {/each}
              </div>
            </Card.Content>
          </Card.Root>
        </div>
      </Tabs.Content>

      <Tabs.Content value="products" class="space-y-6">
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <Card.Title>Products & Orders</Card.Title>
              <Button size="sm" onclick={handleNewOrder}>
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                New Order
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              {#each clientOrders as order}
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex-1">
                    <h4 class="font-medium">{order.productName}</h4>
                    <p class="text-sm text-muted-foreground">
                      Order #{order.id} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div class="flex items-center space-x-4">
                    <div class="text-right">
                      <p class="font-medium">{formatCurrency(order.amount)}</p>
                      <Select.Root
                        type="single"
                        value={order.status}
                        onValueChange={(value) => handleOrderStatusChange(order.id, value)}
                      >
                        <Select.Trigger class="w-32">
                          <Badge variant={getStatusBadge(order.status)} class="w-full justify-center">
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="pending">Pending</Select.Item>
                          <Select.Item value="in_progress">In Progress</Select.Item>
                          <Select.Item value="completed">Completed</Select.Item>
                          <Select.Item value="cancelled">Cancelled</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <Tabs.Content value="invoices" class="space-y-6">
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <Card.Title>Invoices & Payments</Card.Title>
              <Button size="sm" variant="outline">
                Record Payment
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              {#each invoices as invoice}
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex-1">
                    <h4 class="font-medium">{invoice.number}</h4>
                    <p class="text-sm text-muted-foreground">
                      {invoice.description} • Due {formatDate(invoice.dueDate)}
                    </p>
                    <div class="flex items-center space-x-2 mt-1">
                      <Badge variant={getStatusBadge(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      {#if invoice.status === 'overdue'}
                        <span class="text-xs text-red-600 font-medium">
                          {Math.ceil((new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days overdue
                        </span>
                      {/if}
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="font-medium">{formatCurrency(invoice.amount)}</p>
                    <Button size="sm" variant="outline" class="mt-2" onclick={() => handleRecordPayment(invoice)}>
                      Record Payment
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>

      <Tabs.Content value="documents" class="space-y-6">
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <Card.Title>Documents</Card.Title>
              <Button size="sm" onclick={handleUploadDocument}>
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                Upload Document
              </Button>
            </div>
          </Card.Header>
          <Card.Content>
            <div class="space-y-4">
              {#each clientDocuments as doc}
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <div class="flex items-center space-x-3">
                    <svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <div>
                      <h4 class="font-medium">{doc.name}</h4>
                      <p class="text-sm text-muted-foreground">
                        {doc.type} • {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <Badge variant={getStatusBadge(doc.status)}>
                      {doc.status}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                      </svg>
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>

    <!-- Order Creation Modal -->
    <OrderCreationModal
      {clientId}
      open={showOrderModal}
      onCreateOrder={handleCreateOrder}
    />

    <!-- Document Send Modal -->
    <DocumentSendModal
      {clientId}
      clientEmail={client.email}
      clientName={client.displayName || `${client.firstName} ${client.lastName}`}
      open={showDocumentModal}
      onSendComplete={handleDocumentSendComplete}
    />

    <!-- PDF Upload Modal -->
    <PDFUploadModal
      {clientId}
      open={showPDFUploadModal}
      onUploadComplete={handlePDFUploadComplete}
    />

    <!-- Payment Modal -->
    <PaymentModal
      invoice={selectedInvoice}
      open={showPaymentModal}
      onPaymentComplete={handlePaymentComplete}
    />
  </div>
{/if}