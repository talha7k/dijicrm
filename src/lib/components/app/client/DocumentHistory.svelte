 <script lang="ts">
   import { Badge } from '$lib/components/ui/badge';
   import * as Card from '$lib/components/ui/card';
   import Button from '$lib/components/ui/button/button.svelte';

   interface EmailRecord {
     id: string;
     subject: string;
     sentDate: Date;
     status: 'sent' | 'delivered' | 'opened' | 'bounced' | 'complained';
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

   interface DocumentSummary {
     id: string;
     name: string;
     type: 'template' | 'generated' | 'uploaded';
     sentDate: Date;
     status: 'sent' | 'delivered' | 'opened' | 'failed';
     fileSize?: number;
     downloadUrl?: string;
     previewUrl?: string;
     emailId: string;
     emailSubject: string;
   }

   interface Props {
     emails: EmailRecord[];
     loading?: boolean;
     onDownload?: (document: DocumentSummary) => void;
     onPreview?: (document: DocumentSummary) => void;
     onResend?: (emailId: string) => void;
   }

   let { emails, loading = false, onDownload, onPreview, onResend }: Props = $props();

   // Extract document summaries from email attachments
   let documentSummaries = $derived.by(() => {
     const summaries: DocumentSummary[] = [];
     emails.forEach(email => {
       if (email.attachments && email.attachments.length > 0) {
         email.attachments.forEach(attachment => {
           summaries.push({
             id: `${email.id}-${attachment.filename}`,
             name: attachment.filename,
             type: attachment.documentType === 'template' ? 'template' : attachment.documentType === 'generated' ? 'generated' : 'uploaded',
             sentDate: email.sentDate,
             status: email.status === 'sent' ? 'sent' : email.status === 'delivered' ? 'delivered' : email.status === 'opened' ? 'opened' : 'failed',
             fileSize: attachment.size,
             downloadUrl: '#', // TODO: Implement actual download URL
             previewUrl: email.status === 'delivered' ? '#' : undefined,
             emailId: email.id,
             emailSubject: email.subject
           });
         });
       }
     });
     return summaries;
   });

  function getStatusBadge(status: string) {
    const variants = {
      sent: 'secondary',
      delivered: 'default',
      opened: 'default',
      failed: 'destructive',
    } as const;

    return variants[status as keyof typeof variants] || 'outline';
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  function getFileIcon(type: string) {
    switch (type) {
      case 'template':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'generated':
        return 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'uploaded':
        return 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12';
      default:
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'template':
        return 'Template';
      case 'generated':
        return 'Generated';
      case 'uploaded':
        return 'Uploaded';
      default:
        return type;
    }
  }
</script>

   <Card.Root>
   <Card.Header>
     <Card.Title>Document History</Card.Title>
     <Card.Description>
       Summary of documents sent via email to this client
     </Card.Description>
   </Card.Header>
   <Card.Content>
     {#if loading}
       <div class="flex items-center justify-center p-8">
         <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
         <span class="ml-2 text-sm">Loading documents...</span>
       </div>
     {:else if documentSummaries.length === 0}
       <div class="text-center py-8 text-muted-foreground">
         <svg class="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
         </svg>
         <p>No documents found for this client.</p>
         <p class="text-sm">Documents sent to this client will appear here.</p>
       </div>
     {:else}
       <div class="space-y-4">
         {#each documentSummaries as document}
          <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div class="flex items-center space-x-3 flex-1 min-w-0">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getFileIcon(document.type)}/>
                </svg>
              </div>
               <div class="flex-1 min-w-0">
                 <h4 class="font-medium text-sm truncate">{document.name}</h4>
                 <p class="text-xs text-muted-foreground">
                   {getTypeLabel(document.type)} • Sent {formatDate(document.sentDate)}
                   {#if document.fileSize}
                     • {formatFileSize(document.fileSize)}
                   {/if}
                 </p>
                 <p class="text-xs text-muted-foreground">
                   From email: {document.emailSubject}
                 </p>
               </div>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0">
              <Badge variant={getStatusBadge(document.status)} class="text-xs">
                {document.status}
              </Badge>
              <div class="flex space-x-1">
                {#if onPreview && document.previewUrl}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => onPreview(document)}
                    class="h-8 w-8 p-0"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </Button>
                {/if}
                {#if onDownload && document.downloadUrl}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => onDownload(document)}
                    class="h-8 w-8 p-0"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m-3 3V4"/>
                    </svg>
                  </Button>
                {/if}
                {#if onResend && document.status === 'failed'}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => onResend(document.id)}
                    class="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </Button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>