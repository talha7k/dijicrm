<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
   import { Checkbox } from '$lib/components/ui/checkbox/index.js';
   import { documentTemplatesStore } from '$lib/stores/documentTemplates';
   import { clientDocumentsStore } from '$lib/stores/clientDocuments';
   import { toast } from 'svelte-sonner';

  interface Props {
    clientId: string;
    clientEmail: string;
    clientName: string;
    open: boolean;
    onSendComplete?: () => void;
  }

  let { clientId, clientEmail, clientName, open = $bindable(false), onSendComplete }: Props = $props();

   let selectedTemplates = $state<string[]>([]);
   let selectedCustomDocs = $state<string[]>([]);
   let emailSubject = $state('');
   let emailMessage = $state('');
   let loading = $state(false);

   // Template data from store
   let availableTemplates = $state<{ id: string; name: string; description: string }[]>([]);

   // Custom documents from store
   let customDocuments = $state<{ id: string; name: string; uploadedAt: Date }[]>([]);

   // Load data when modal opens
   $effect(() => {
     if (open) {
       // Subscribe to templates store
       const unsubscribeTemplates = documentTemplatesStore.subscribe((state) => {
         availableTemplates = state.data.map(template => ({
           id: template.id,
           name: template.name,
           description: template.description || '',
         }));
       });

       // Subscribe to client documents store
       const unsubscribeDocuments = clientDocumentsStore.subscribe((state) => {
         customDocuments = state.documents.map(doc => ({
           id: doc.id,
           name: doc.data?.documentName || doc.data?.title || `Document ${doc.id.slice(-6)}`,
           uploadedAt: doc.generatedAt?.toDate() || new Date(),
         }));
       });

       // Load client documents
       clientDocumentsStore.loadClientDocuments(clientId);

       return () => {
         unsubscribeTemplates();
         unsubscribeDocuments();
       };
     }
   });

  function handleTemplateToggle(templateId: string, checked: boolean) {
    if (checked) {
      selectedTemplates = [...selectedTemplates, templateId];
    } else {
      selectedTemplates = selectedTemplates.filter(id => id !== templateId);
    }
  }

  function handleCustomDocToggle(docId: string, checked: boolean) {
    if (checked) {
      selectedCustomDocs = [...selectedCustomDocs, docId];
    } else {
      selectedCustomDocs = selectedCustomDocs.filter(id => id !== docId);
    }
  }

  async function handleSend() {
    if (selectedTemplates.length === 0 && selectedCustomDocs.length === 0) {
      toast.error('Please select at least one document to send');
      return;
    }

    if (!emailSubject.trim()) {
      emailSubject = `Documents from ${clientName}`;
    }

    if (!emailMessage.trim()) {
      emailMessage = `Please find attached the requested documents.`;
    }

    loading = true;

    try {
      // Mock document sending - in real implementation, this would:
      // 1. Generate PDFs from selected templates
      // 2. Attach custom documents
      // 3. Send via email service

      const totalDocuments = selectedTemplates.length + selectedCustomDocs.length;

      console.log('Sending documents:', {
        clientId,
        clientEmail,
        clientName,
        selectedTemplates,
        selectedCustomDocs,
        emailSubject,
        emailMessage,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(`Successfully sent ${totalDocuments} document${totalDocuments > 1 ? 's' : ''} to ${clientName}`);

      // Reset form
      selectedTemplates = [];
      selectedCustomDocs = [];
      emailSubject = '';
      emailMessage = '';
      open = false;

      onSendComplete?.();
    } catch (error) {
      console.error('Error sending documents:', error);
      toast.error('Failed to send documents');
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    selectedTemplates = [];
    selectedCustomDocs = [];
    emailSubject = '';
    emailMessage = '';
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Send Documents to {clientName}</Dialog.Title>
      <Dialog.Description>
        Select documents to send and customize the email message.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-6">
       <!-- Template Documents -->
       {#if availableTemplates.length > 0}
         <div class="space-y-3">
           <Label class="text-base font-medium">Template Documents</Label>
           <div class="space-y-2">
             {#each availableTemplates as template}
               {@const isSelected = selectedTemplates.includes(template.id)}
               <div class="flex items-center space-x-3 p-3 border rounded-lg">
                 <Checkbox
                   id="template-{template.id}"
                   checked={isSelected}
                   onchange={() => handleTemplateToggle(template.id, !isSelected)}
                 />
                 <div class="flex-1">
                   <Label for="template-{template.id}" class="font-medium cursor-pointer">
                     {template.name}
                   </Label>
                   <p class="text-sm text-muted-foreground">{template.description}</p>
                 </div>
               </div>
             {/each}
           </div>
         </div>
       {/if}

      <!-- Custom Documents -->
      <div class="space-y-3">
        <Label class="text-base font-medium">Custom Documents</Label>
        <div class="space-y-2">
          {#each customDocuments as doc}
            {@const isSelected = selectedCustomDocs.includes(doc.id)}
            <div class="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id="custom-{doc.id}"
                checked={isSelected}
                onchange={() => handleCustomDocToggle(doc.id, !isSelected)}
              />
              <div class="flex-1">
                <Label for="custom-{doc.id}" class="font-medium cursor-pointer">
                  {doc.name}
                </Label>
                <p class="text-sm text-muted-foreground">
                  Uploaded {doc.uploadedAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Email Customization -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-base">Email Message</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="space-y-2">
            <Label for="subject">Subject</Label>
            <Input
              id="subject"
              bind:value={emailSubject}
              placeholder="Documents from [Your Company]"
            />
          </div>
          <div class="space-y-2">
            <Label for="message">Message</Label>
            <Textarea
              id="message"
              bind:value={emailMessage}
              placeholder="Please find attached the requested documents..."
              rows={4}
            />
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Preview -->
      {#if selectedTemplates.length > 0 || selectedCustomDocs.length > 0}
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-base">Preview</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="space-y-2">
              <p class="text-sm"><strong>To:</strong> {clientEmail}</p>
              <p class="text-sm"><strong>Subject:</strong> {emailSubject || 'Documents from [Your Company]'}</p>
              <p class="text-sm"><strong>Attachments:</strong> {selectedTemplates.length + selectedCustomDocs.length} document(s)</p>
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={handleCancel} disabled={loading}>
        Cancel
      </Button>
      <Button onclick={handleSend} disabled={loading || (selectedTemplates.length === 0 && selectedCustomDocs.length === 0)}>
        {loading ? 'Sending...' : 'Send Documents'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>