<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import * as Select from '$lib/components/ui/select';
    import EmailCard from './EmailCard.svelte';
    import { documentTypesStore } from '$lib/stores/documentTypes';
    import type { DocumentType } from '$lib/stores/documentTypes';

    interface EmailRecord {
      id: string;
      subject: string;
      sentDate: Date;
      status: 'sent' | 'delivered' | 'opened' | 'bounced';
      recipient: string;
      opened?: boolean;
      preview?: string;
      attachments?: Array<{
        filename: string;
        size: number;
        type: string;
        documentType?: string;
      }>;
    }

    interface Props {
      emails: EmailRecord[];
      loading?: boolean;
      onResend?: (emailId: string) => void;
      onViewDetails?: (email: EmailRecord) => void;
    }

    let { emails, loading = false, onResend, onViewDetails }: Props = $props();

    let documentTypes = $state<DocumentType[]>([]);
    let selectedDocumentTypeFilter = $state<string>('all');
    let filteredEmails = $state<EmailRecord[]>([]);
    let expandedEmails = $state<Set<string>>(new Set());

    // Load document types for filtering and filter emails
    $effect(() => {
      const unsubscribe = documentTypesStore.subscribe((state) => {
        documentTypes = state.data || [];
      });
      documentTypesStore.loadDocumentTypes();
      return unsubscribe;
    });

    // Filter emails based on selected document type
    $effect(() => {
      if (selectedDocumentTypeFilter === 'all') {
        filteredEmails = emails;
      } else {
        filteredEmails = emails.filter(email => {
          if (!email.attachments) return false;
          return email.attachments.some(att => att.documentType === selectedDocumentTypeFilter);
        });
      }
    });

   function toggleEmailExpanded(emailId: string) {
     const newExpanded = new Set(expandedEmails);
     if (newExpanded.has(emailId)) {
       newExpanded.delete(emailId);
     } else {
       newExpanded.add(emailId);
     }
     expandedEmails = newExpanded;
   }
</script>

 <Card.Root>
   <Card.Header>
     <div class="flex items-center justify-between">
       <div>
         <Card.Title>Email History</Card.Title>
         <Card.Description>
           All emails sent to this client
         </Card.Description>
       </div>
      {#if emails.length > 0}
        <div class="flex items-center space-x-2">
          <span class="text-sm text-muted-foreground">Filter by type:</span>
          <Select.Root type="single" bind:value={selectedDocumentTypeFilter}>
            <Select.Trigger class="w-32">
              {selectedDocumentTypeFilter === 'all' ? 'All Types' : selectedDocumentTypeFilter}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All Types</Select.Item>
              {#each documentTypes.filter(dt => dt.isActive) as docType}
                <Select.Item value={docType.name}>
                  {docType.name}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      {/if}
    </div>
  </Card.Header>
  <Card.Content>
    {#if loading}
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span class="ml-2 text-sm">Loading emails...</span>
      </div>
    {:else if emails.length === 0}
      <div class="text-center py-8 text-muted-foreground">
        <svg class="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        <p>No emails found for this client.</p>
        <p class="text-sm">Emails sent to this client will appear here.</p>
      </div>
     {:else}
       <div class="space-y-3">
         {#each filteredEmails as email}
           {@const isExpanded = expandedEmails.has(email.id)}
           <EmailCard
             {email}
             {isExpanded}
             onToggle={() => toggleEmailExpanded(email.id)}
             {onResend}
             {onViewDetails}
           />
         {/each}
       </div>
     {/if}
  </Card.Content>
</Card.Root>

