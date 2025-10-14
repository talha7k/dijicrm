<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { requireCompany } from '$lib/utils/auth';
   import { clientManagementStore } from '$lib/stores/clientManagement';
   import { productsStore } from '$lib/stores/products';
   import { clientInvoicesStore } from '$lib/stores/clientInvoices';
   import { ordersStore } from '$lib/stores/orders';
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
   import EmailComposeModal from '$lib/components/app/client/EmailComposeModal.svelte';
   import PaymentModal from '$lib/components/app/client/PaymentModal.svelte';
    import EmailHistory from '$lib/components/app/client/EmailHistory.svelte';
    import DocumentHistory from '$lib/components/app/client/DocumentHistory.svelte';
    import OrderDetailModal from '$lib/components/app/client/OrderDetailModal.svelte';
    import { emailHistoryStore } from '$lib/stores/emailHistory';
     import type { UserProfile } from '$lib/types/user';
     import type { Product } from '$lib/stores/products';
     import type { ClientInvoice } from '$lib/stores/clientInvoices';
     import type { Order } from '$lib/types/document';
     import type { EmailRecord } from '$lib/stores/emailHistory';

    interface DocumentRecord {
      id: string;
      name: string;
      type: 'template' | 'generated' | 'uploaded';
      sentDate: Date;
      status: 'sent' | 'delivered' | 'opened' | 'failed';
      fileSize?: number;
      downloadUrl?: string;
      previewUrl?: string;
    }

  // Company access is checked at layout level

   const clientStore = clientManagementStore;
   const productStore = productsStore;
   const invoiceStore = clientInvoicesStore;
   const orderStore = ordersStore;
   const deliveryStore = documentDeliveryStore;
  const clientId = $page.params.id as string;

  let client = $state<UserProfile | undefined>(undefined);
  let products = $state<Product[]>([]);
  let invoices = $state<ClientInvoice[]>([]);
  let loading = $state(true);
  let activeTab = $state('overview');

  // Mock client orders and products for now
   let clientOrders = $state<Order[]>([]);

   let clientDocuments = $state<DocumentRecord[]>([]);

   // Subscribe to document delivery store
   $effect(() => {
     const unsubscribe = deliveryStore.subscribe((state) => {
       // Transform deliveries to match DocumentHistory interface
       if (client?.email) {
         const deliveries = deliveryStore.getClientDeliveries(client.email);
         clientDocuments = deliveries.map(delivery => ({
           id: delivery.id,
           name: `Document-${delivery.documentId}.pdf`, // TODO: Get actual document name
           type: 'generated' as const, // TODO: Determine actual type
           sentDate: delivery.sentAt?.toDate() || new Date(),
           status: delivery.status === 'delivered' ? 'delivered' :
                   delivery.status === 'sent' ? 'sent' :
                   delivery.status === 'bounced' ? 'failed' : 'sent',
           fileSize: undefined, // TODO: Get actual file size
           downloadUrl: '#', // TODO: Implement download URL
           previewUrl: delivery.status === 'delivered' ? '#' : undefined,
         }));
       }
     });

     return unsubscribe;
   });

   let emailHistory = $state<{ data: EmailRecord[]; loading: boolean; error: string | null }>({ data: [], loading: false, error: null });

   // Subscribe to email history store
   $effect(() => {
     const unsubscribe = emailHistoryStore.subscribe((state) => {
       emailHistory = state;
     });

     return unsubscribe;
   });

    let showOrderModal = $state(false);
    let showDocumentModal = $state(false);
    let showPDFUploadModal = $state(false);
    let showEmailComposeModal = $state(false);
    let showPaymentModal = $state(false);
    let showOrderDetailModal = $state(false);
   let selectedInvoice = $state<ClientInvoice | null>(null);
   let selectedOrder = $state<Order | null>(null);

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

       // Load orders for this client
       await orderStore.loadClientOrders(clientId);
       orderStore.subscribe((state) => {
         clientOrders = state.data || [];
       });

      // Load email history for this client
      if (client.email) {
        await emailHistoryStore.loadEmailsForClient(client.email);
      }

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

   async function handleCreateOrder(order: any) {
     try {
       await orderStore.createOrder({
         companyId: "company-1", // TODO: Get from auth
         clientId,
         title: order.title,
         description: order.description,
         selectedProducts: order.selectedProducts,
         status: "draft",
         documents: [],
         totalAmount: order.totalAmount,
         paidAmount: 0,
         outstandingAmount: order.totalAmount,
         payments: [],
         createdBy: "user-1", // TODO: Get from auth
       });
       showOrderModal = false;
       toast.success('Order created successfully');
     } catch (error) {
       console.error('Error creating order:', error);
       toast.error('Failed to create order');
     }
   }

   function handleNewOrder() {
     showOrderModal = true;
   }

   function handleOrderClick(order: Order) {
     selectedOrder = order;
     showOrderDetailModal = true;
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

  async function handleInviteClient() {
    if (!client) return;

    try {
      await clientStore.inviteClient(client.uid, 'company-user-1'); // Mock invitedBy
      // Update local client state
      client = { ...client, metadata: { ...client.metadata, accountStatus: 'invited' } };
      toast.success('Invitation sent successfully');
    } catch (error) {
      console.error('Error inviting client:', error);
      toast.error('Failed to send invitation');
    }
  }

   async function handleOrderStatusChange(orderId: string, newStatus: string) {
     try {
       await orderStore.updateOrder(orderId, { status: newStatus as any });
       toast.success('Order status updated');
     } catch (error) {
       console.error('Error updating order status:', error);
       toast.error('Failed to update order status');
     }
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
      <div>
        <h1 class="text-3xl font-bold">{client.displayName}</h1>
        <p class="text-muted-foreground">{client.email}</p>
      </div>
        <div class="flex space-x-2">
          <Button variant="outline" onclick={() => showEmailComposeModal = true}>
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Compose Email
          </Button>
          <Button variant="outline" onclick={handleSendDocument}>
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            Send Document
          </Button>
         {#if client.metadata?.accountStatus === 'added'}
           <Button variant="outline" onclick={handleInviteClient}>
             <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
             </svg>
             Invite to Portal
           </Button>
         {/if}
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
             <Badge variant={client.metadata?.accountStatus === 'active' || client.metadata?.accountStatus === 'added' ? 'default' : client.metadata?.accountStatus === 'invited' ? 'secondary' : 'destructive'}>
               {client.metadata?.accountStatus ? client.metadata.accountStatus.charAt(0).toUpperCase() + client.metadata.accountStatus.slice(1) : 'Unknown'}
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
        <Tabs.Trigger value="orders">Orders</Tabs.Trigger>
        <Tabs.Trigger value="emails">Emails</Tabs.Trigger>
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
                       <p class="text-sm font-medium">{order.title}</p>
                       <p class="text-xs text-muted-foreground">{formatDate(order.createdAt.toDate())}</p>
                     </div>
                     <div class="text-right">
                       <p class="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
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
                      <p class="text-xs text-muted-foreground">{formatDate(doc.sentDate)}</p>
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

      <Tabs.Content value="orders" class="space-y-6">
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <Card.Title>Orders</Card.Title>
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
                  <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" role="button" tabindex="0" onclick={() => handleOrderClick(order)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleOrderClick(order); e.preventDefault(); } }}>
                   <div class="flex-1">
                     <h4 class="font-medium">{order.title}</h4>
                     <p class="text-sm text-muted-foreground">
                       Order #{order.id} • {formatDate(order.createdAt.toDate())}
                     </p>
                   </div>
                   <div class="flex items-center space-x-4">
                     <div class="text-right">
                       <p class="font-medium">{formatCurrency(order.totalAmount)}</p>
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
                           <Select.Item value="draft">Draft</Select.Item>
                           <Select.Item value="quote">Quote</Select.Item>
                           <Select.Item value="generated">Generated</Select.Item>
                           <Select.Item value="sent">Sent</Select.Item>
                           <Select.Item value="partially_paid">Partially Paid</Select.Item>
                           <Select.Item value="paid">Paid</Select.Item>
                           <Select.Item value="overdue">Overdue</Select.Item>
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



      <Tabs.Content value="emails" class="space-y-6">
        <EmailHistory
          emails={emailHistory.data}
          loading={emailHistory.loading}
          onViewDetails={(email) => {
            // TODO: Open email detail modal
            console.log('View email details:', email);
          }}
          onResend={async (emailId) => {
            const result = await emailHistoryStore.resendEmail(emailId);
            if (result.success) {
              toast.success('Email resent successfully');
            } else {
              toast.error(result.error || 'Failed to resend email');
            }
          }}
        />
      </Tabs.Content>

      <Tabs.Content value="documents" class="space-y-6">
        <div class="flex justify-end space-x-2 mb-4">
          <Button size="sm" variant="outline" onclick={handleSendDocument}>
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
            Send Document
          </Button>
          <Button size="sm" onclick={handleUploadDocument}>
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            Upload
          </Button>
        </div>
        <DocumentHistory
          documents={clientDocuments}
          onDownload={(document) => {
            // TODO: Implement download functionality
            console.log('Download document:', document);
            toast.success('Download started');
          }}
          onPreview={(document) => {
            // TODO: Implement preview functionality
            console.log('Preview document:', document);
          }}
          onResend={(documentId) => {
            // TODO: Implement resend functionality
            console.log('Resend document:', documentId);
            toast.success('Document resent successfully');
          }}
        />
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

    <!-- Email Compose Modal -->
    <EmailComposeModal
      {clientId}
      clientEmail={client.email}
      clientName={client.displayName || `${client.firstName} ${client.lastName}`}
      open={showEmailComposeModal}
      onSendComplete={() => {
        toast.success('Email sent successfully');
        showEmailComposeModal = false;
      }}
    />

     <!-- PDF Upload Modal -->
     <PDFUploadModal
       {clientId}
       open={showPDFUploadModal}
       onUploadComplete={handlePDFUploadComplete}
     />

     <!-- Order Detail Modal -->
     <OrderDetailModal
       order={selectedOrder}
       open={showOrderDetailModal}
       onClose={() => showOrderDetailModal = false}
     />

     <!-- Payment Modal -->
    <PaymentModal
      invoice={selectedInvoice}
      open={showPaymentModal}
      onPaymentComplete={handlePaymentComplete}
    />
  </div>
{/if}