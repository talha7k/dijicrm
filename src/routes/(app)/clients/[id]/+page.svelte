<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { requireCompany } from '$lib/utils/auth';
   import { clientManagementStore } from '$lib/stores/clientManagement';
   import { productsStore } from '$lib/stores/products';

      import { ordersStore } from '$lib/stores/orders';

     import { getVatConfig } from '$lib/utils/vat';
    import { collection, query, where, getDocs } from 'firebase/firestore';
    import { db } from '$lib/firebase';
   import Button from '$lib/components/ui/button/button.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';

  import { toast } from 'svelte-sonner';
   import OrderCreationModal from '$lib/components/app/client/OrderCreationModal.svelte';
   import DocumentSendModal from '$lib/components/app/client/DocumentSendModal.svelte';
   import PDFUploadModal from '$lib/components/app/client/PDFUploadModal.svelte';
   import EmailComposeModal from '$lib/components/app/client/EmailComposeModal.svelte';
   import PaymentModal from '$lib/components/app/client/PaymentModal.svelte';
    import EmailHistory from '$lib/components/app/client/EmailHistory.svelte';
       import DocumentHistory from '$lib/components/app/client/DocumentHistory.svelte';
       import OrderCard from '$lib/components/app/client/OrderCard.svelte';
       import PrivateDocuments from '$lib/components/app/client/PrivateDocuments.svelte';

    
    import { emailHistoryStore } from '$lib/stores/emailHistory';
    import { companyContext } from '$lib/stores/companyContext';
    import { auth } from '$lib/firebase';
    import { get } from 'svelte/store';
     import type { UserProfile } from '$lib/types/user';
     import type { Product } from '$lib/stores/products';

     import type { Order } from '$lib/types/document';
     import type { EmailRecord } from '$lib/stores/emailHistory';

    interface DocumentRecord {
      id: string;
      name: string;
      type: 'template' | 'generated' | 'uploaded';
      sentDate: Date;
      status: 'sent' | 'delivered' | 'opened' | 'failed' | 'complained';
      fileSize?: number;
      downloadUrl?: string;
      previewUrl?: string;
    }

  // Company access is checked at layout level

     const clientStore = clientManagementStore;
     const productStore = productsStore;
   const orderStore = ordersStore;

  const clientId = page.params.id as string;

  let client = $state<UserProfile | undefined>(undefined);
  let products = $state<Product[]>([]);
   let orders = $state<Order[]>([]);
  let loading = $state(true);
  let activeTab = $state('overview');

   let clientOrders = $state<Order[]>([]);


    let clientDocuments = $state<DocumentRecord[]>([]);

    // Transform email history to document records for Documents tab
    $effect(() => {
      if (client?.email && emailHistory.data.length > 0) {
        clientDocuments = emailHistory.data
          .filter(email => email.attachments && email.attachments.length > 0)
          .flatMap(email => 
            email.attachments!.map((attachment, index) => ({
              id: `${email.id}-${index}`,
              name: attachment.filename,
              type: attachment.documentType as any || 'generated' as const,
              sentDate: email.sentDate,
              status: email.status === 'bounced' ? 'failed' : email.status as any,
              fileSize: attachment.size,
              downloadUrl: '#', // TODO: Implement download URL from email service
              previewUrl: email.status === 'delivered' ? '#' : undefined,
            }))
          );
      }
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
    let showDocumentPreviewModal = $state(false);
    let showDocumentGenerationModal = $state(false);
    let documentToPreview = $state<any>(null);
   let selectedOrder = $state<Order | null>(null);

  onMount(async () => {
    try {
      // Load clients first
      await clientStore.loadClients();
      
      // Load products and orders
      await productStore.loadProducts();
      productStore.subscribe((state) => {
        products = state.data || [];
      });

        // Note: orders variable is for ClientInvoice type, not Order type
        // This subscription is handled by the clientInvoicesStore

       // Load orders for this client
       await orderStore.loadClientOrders(clientId);
       orderStore.subscribe((state) => {
         clientOrders = state.data || [];
       });

    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Failed to load client data');
    } finally {
      loading = false;
    }
  });
  
  // Reactive effect to get client data
  $effect(() => {
    const unsubscribe = clientStore.subscribe((state) => {
      if (!state.loading) {
        const foundClient = state.clients.find((c) => c.uid === clientId);
        if (foundClient) {
          client = foundClient;
          // Load email history for this client
          if (foundClient.email && emailHistory.data.length === 0) {
            emailHistoryStore.loadEmailsForClient(foundClient.email);
          }
        } else if (!state.error && state.clients.length > 0) {
          // Client not found but clients are loaded
          toast.error('Client not found');
          goto('/clients');
        }
      }
    });
    
    return unsubscribe;
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
        const companyContextValue = get(companyContext);
        const userId = auth.currentUser?.uid;

        if (!companyContextValue.data || !userId) {
          toast.error('Authentication or company context required');
          return;
        }

        // Create items array
        const items = order.selectedProducts.map((productId: string) => {
          const product = products.find(p => p.id === productId);
          return {
            description: product?.name || 'Unknown Product',
            quantity: 1,
            rate: product?.price || 0,
            amount: (product?.price || 0) * 1
          };
        });

        // Calculate financials
        const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
        const vatConfig = getVatConfig();
        const taxAmount = subtotal * vatConfig.rate;
        const totalAmountWithTax = subtotal + taxAmount;

        await orderStore.createOrder({
          clientId,
          title: order.title,
          description: order.description,
          selectedProducts: order.selectedProducts,
          items,
          subtotal,
          taxAmount,
          status: "draft",
          documents: [],
          totalAmount: totalAmountWithTax,
          paidAmount: 0,
          outstandingAmount: totalAmountWithTax,
          payments: [],
          createdBy: userId,
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
      goto(`/orders/${order.id}`);
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

  function handleRecordPayment(order: Order) {
    selectedOrder = order;
    showPaymentModal = true;
  }

   function handlePaymentComplete() {
     // Update order status or refresh data
     toast.success('Payment recorded successfully');
   }

   function handleGenerateDocument() {
     showDocumentGenerationModal = true;
   }

   async function handleDocumentGenerationComplete(result: any) {
     try {
       console.log('Document generation result:', result);
       
       // Here you would typically:
       // 1. Call the document generation API
       // 2. Save the generated document
       // 3. Update the document delivery store
       
       toast.success('Document generated successfully!');
       showDocumentGenerationModal = false;
       
       // TODO: Integrate with actual document generation API
       // For now, just show success message
     } catch (error) {
       console.error('Failed to generate document:', error);
       toast.error('Failed to generate document');
     }
   }

   async function handleInviteClient() {
     if (!client) return;

     try {
       const userId = auth.currentUser?.uid;
       if (!userId) {
         toast.error('User not authenticated');
         return;
       }

       await clientStore.inviteClient(client.uid, userId);
       // Update local client state
       client = { ...client, metadata: { ...client.metadata, accountStatus: 'invited' } };
       // No need to show toast here - the store already shows appropriate notifications
     } catch (error) {
       console.error('Error inviting client:', error);
       // Error toast is already shown by the store, but we'll show one here for UI consistency
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
          <Button onclick={() => goto(`/orders/create?clientId=${clientId}`)}>
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Create Invoice
          </Button>
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
          {:else}
            <div>
              <Label class="text-sm font-medium">Phone</Label>
              <p class="text-sm text-muted-foreground italic">No phone number</p>
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
          {:else}
            <div>
              <Label class="text-sm font-medium">Address</Label>
              <p class="text-sm text-muted-foreground italic">No address on file</p>
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
          {#if orders.length === 0}
            <div class="text-center py-4">
              <lucide:receipt class="h-8 w-8 mx-auto text-muted-foreground mb-2"></lucide:receipt>
              <p class="text-sm text-muted-foreground">No orders yet</p>
              <Button variant="outline" size="sm" onclick={() => goto(`/orders/create?clientId=${clientId}`)} class="mt-2">
                <svg class="mr-2 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Create Invoice
              </Button>
            </div>
          {:else}
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-sm">Total Invoiced</span>
                <span class="text-sm font-medium">
                  {formatCurrency(orders.reduce((sum, ord) => sum + ord.totalAmount, 0))}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm">Paid</span>
                <span class="text-sm font-medium text-green-600">
                  {formatCurrency(orders.filter(ord => ord.status === 'paid').reduce((sum, ord) => sum + ord.totalAmount, 0))}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm">Outstanding</span>
                <span class="text-sm font-medium text-red-600">
                  {formatCurrency(orders.filter(ord => ord.status !== 'paid').reduce((sum, ord) => sum + ord.totalAmount, 0))}
                </span>
              </div>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

     <!-- Tabs -->
     <Tabs.Root bind:value={activeTab}>
        <Tabs.List class="grid w-full grid-cols-5 gap-1">
         <Tabs.Trigger value="overview" class="text-xs sm:text-sm">
           <svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
           </svg>
           Overview
         </Tabs.Trigger>
         <Tabs.Trigger value="orders" class="text-xs sm:text-sm">
           <svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
           </svg>
           Orders
         </Tabs.Trigger>
         <Tabs.Trigger value="emails" class="text-xs sm:text-sm">
           <svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
           </svg>
           Emails
         </Tabs.Trigger>
          <Tabs.Trigger value="documents" class="text-xs sm:text-sm">
            <svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Documents
          </Tabs.Trigger>
           <Tabs.Trigger value="private-documents" class="text-xs sm:text-sm">
             <svg class="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
             </svg>
             Private Documents
           </Tabs.Trigger>
       </Tabs.List>

      <Tabs.Content value="overview" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Recent Orders -->
          <Card.Root>
            <Card.Header>
              <Card.Title>Recent Orders</Card.Title>
            </Card.Header>
            <Card.Content>
              {#if clientOrders.length === 0}
                <div class="text-center py-6">
                  <lucide:shopping-cart class="h-8 w-8 mx-auto text-muted-foreground mb-3"></lucide:shopping-cart>
                  <p class="text-sm text-muted-foreground">No orders yet</p>
                  <Button variant="outline" size="sm" onclick={handleNewOrder} class="mt-2">
                    <svg class="mr-2 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Create Order
                  </Button>
                </div>
              {:else}
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
              {/if}
            </Card.Content>
          </Card.Root>

          <!-- Recent Documents -->
          <Card.Root>
            <Card.Header>
              <Card.Title>Recent Documents</Card.Title>
            </Card.Header>
            <Card.Content>
              {#if clientDocuments.length === 0}
                <div class="text-center py-6">
                  <lucide:file-text class="h-8 w-8 mx-auto text-muted-foreground mb-3"></lucide:file-text>
                  <p class="text-sm text-muted-foreground">No documents sent</p>
                  <Button variant="outline" size="sm" onclick={handleSendDocument} class="mt-2">
                    <svg class="mr-2 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                    Send Document
                  </Button>
                </div>
              {:else}
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
              {/if}
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
             {#if clientOrders.length === 0}
               <div class="text-center py-8">
                 <lucide:shopping-cart class="h-12 w-12 mx-auto text-muted-foreground mb-4"></lucide:shopping-cart>
                 <h3 class="text-lg font-medium mb-2">No orders yet</h3>
                 <p class="text-muted-foreground mb-4">
                   This client hasn't placed any orders yet. Create their first order to get started.
                 </p>
                 <Button onclick={handleNewOrder}>
                   <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                   </svg>
                   Create First Order
                 </Button>
               </div>
             {:else}
               <div class="space-y-3">
                   {#each clientOrders as order}
                     <OrderCard
                       {order}
                       onClick={() => handleOrderClick(order)}
                       onRecordPayment={handleRecordPayment}
                       clientName={client.displayName || client.email || 'Unknown Client'}
                    />
                  {/each}
                </div>
             {/if}
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
           emails={emailHistory.data}
           onDownload={(document) => {
             // TODO: Implement download functionality
             console.log('Download document:', document);
             toast.success('Download started');
           }}
 onPreview={(document) => {
              documentToPreview = document;
              showDocumentPreviewModal = true;
            }}
           onResend={(emailId) => {
             // TODO: Implement resend functionality
             console.log('Resend email:', emailId);
             toast.success('Email resent successfully');
           }}
         />
      </Tabs.Content>

        <Tabs.Content value="private-documents" class="space-y-6">
          <PrivateDocuments {clientId} />
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



<!-- Payment Modal -->
     <PaymentModal
       order={selectedOrder}
       open={showPaymentModal}
       onPaymentComplete={handlePaymentComplete}
     />

      <!-- Document Preview Modal -->
      <Dialog.Root bind:open={showDocumentPreviewModal}>
        <Dialog.Content class="max-w-4xl max-h-[80vh] overflow-auto">
          <Dialog.Header>
            <Dialog.Title>Document Preview</Dialog.Title>
            <Dialog.Description>
              Preview of the document sent to the client
            </Dialog.Description>
          </Dialog.Header>
         {#if documentToPreview}
           <div class="mt-4 space-y-4">
             <div class="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <span class="font-medium">Document Name:</span>
                 <p class="text-muted-foreground">{documentToPreview.name}</p>
               </div>
               <div>
                 <span class="font-medium">Type:</span>
                 <p class="text-muted-foreground">{documentToPreview.type}</p>
               </div>
               <div>
                 <span class="font-medium">Status:</span>
                 <p class="text-muted-foreground">{documentToPreview.status}</p>
               </div>
               <div>
                 <span class="font-medium">Sent Date:</span>
                 <p class="text-muted-foreground">{formatDate(documentToPreview.sentDate)}</p>
               </div>
             </div>
             
             <div class="border rounded-lg p-6 bg-muted/50">
               <h4 class="font-medium mb-2">Document Content</h4>
               <p class="text-sm text-muted-foreground">
                 This is a preview of the document that was sent to the client. 
                 The actual document content would be displayed here based on the document type.
               </p>
               {#if documentToPreview.type === 'generated'}
                 <div class="mt-4 p-4 bg-white rounded border">
                   <p class="text-sm">Generated document content would appear here...</p>
                 </div>
               {:else if documentToPreview.type === 'uploaded'}
                 <div class="mt-4 p-4 bg-white rounded border text-center">
                   <svg class="h-12 w-12 mx-auto mb-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                   </svg>
                   <p class="text-sm">Uploaded PDF document</p>
                 </div>
               {:else}
                 <div class="mt-4 p-4 bg-white rounded border">
                   <p class="text-sm">Template-based document content would appear here...</p>
                 </div>
               {/if}
             </div>
           </div>
         {/if}
        </Dialog.Content>
      </Dialog.Root>

     <!-- Document Generation Modal -->
     {#if showDocumentGenerationModal}
       <Dialog.Root bind:open={showDocumentGenerationModal}>
         <Dialog.Content class="max-w-6xl max-h-[90vh] overflow-auto">
           <Dialog.Header>
             <Dialog.Title>Generate Document</Dialog.Title>
             <Dialog.Description>
               Select a template and provide custom data to generate a document for {client.displayName || `${client.firstName} ${client.lastName}`}
             </Dialog.Description>
           </Dialog.Header>
           <div class="mt-4">
              <div class="text-center text-muted-foreground py-8">
                Document data form coming soon...
              </div>
           </div>
         </Dialog.Content>
       </Dialog.Root>
     {/if}
   </div>
 {/if}