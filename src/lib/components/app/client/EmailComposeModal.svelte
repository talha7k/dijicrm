<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { documentTypesStore } from '$lib/stores/documentTypes';
  import { toast } from 'svelte-sonner';
  import type { DocumentType } from '$lib/stores/documentTypes';

  interface Props {
    clientId: string;
    clientEmail: string;
    clientName: string;
    open: boolean;
    onSendComplete?: () => void;
  }

  let { clientId, clientEmail, clientName, open = $bindable(false), onSendComplete }: Props = $props();

  let emailSubject = $state('');
  let emailMessage = $state('');
  let loading = $state(false);
  let documentTypes = $state<DocumentType[]>([]);

  // Attachments with document types
  let attachments = $state<Array<{
    file: File;
    documentType: string;
    fileName: string;
    fileSize: number;
  }>>([]);

  // Load document types on mount
  $effect(() => {
    if (open) {
      documentTypesStore.loadDocumentTypes();
      const unsubscribe = documentTypesStore.subscribe((state) => {
        documentTypes = state.data || [];
      });
      return unsubscribe;
    }
  });

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (file.type !== 'application/pdf') {
          toast.error(`${file.name} is not a PDF file`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        // Add to attachments with default document type
        attachments = [...attachments, {
          file,
          documentType: 'Invoice', // Default
          fileName: file.name,
          fileSize: file.size,
        }];
      }
    }
  }

  function removeAttachment(index: number) {
    attachments = attachments.filter((_, i) => i !== index);
  }

  function updateAttachmentType(index: number, documentType: string) {
    attachments = attachments.map((att, i) =>
      i === index ? { ...att, documentType } : att
    );
  }

  async function handleSend() {
    if (!emailSubject.trim()) {
      emailSubject = `Documents from ${clientName}`;
    }

    if (!emailMessage.trim()) {
      emailMessage = `Please find attached the requested documents.`;
    }

    if (attachments.length === 0) {
      toast.error('Please attach at least one PDF document');
      return;
    }

    loading = true;

    try {
      // Import the email history store
      const { emailHistoryStore } = await import('$lib/stores/emailHistory');

      const result = await emailHistoryStore.sendEmail({
        subject: emailSubject,
        message: emailMessage,
        recipient: clientEmail,
        attachments: attachments.map(att => ({
          file: att.file,
          documentType: att.documentType,
          filename: att.fileName,
        })),
      });

      if (result.success) {
        toast.success(`Email sent successfully to ${clientName} with ${attachments.length} attachment(s)`);

        // Reset form
        emailSubject = '';
        emailMessage = '';
        attachments = [];
        open = false;

        onSendComplete?.();
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    emailSubject = '';
    emailMessage = '';
    attachments = [];
    open = false;
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Compose Email to {clientName}</Dialog.Title>
      <Dialog.Description>
        Write a message and attach PDF documents with document type categorization.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-6">
      <!-- Email Details -->
      <div class="space-y-4">
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
      </div>

      <!-- File Attachments -->
      <div class="space-y-3">
        <Label class="text-base font-medium">PDF Attachments</Label>

        {#if attachments.length > 0}
          <div class="space-y-2">
            {#each attachments as attachment, index (attachment.fileName)}
              <div class="flex items-center gap-3 p-3 border rounded-lg">
                <div class="flex-1">
                  <p class="text-sm font-medium">{attachment.fileName}</p>
                  <p class="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
                </div>

                <Select.Root
                  type="single"
                  value={attachment.documentType}
                  onValueChange={(value) => updateAttachmentType(index, value)}
                >
                  <Select.Trigger class="w-32">
                    {attachment.documentType}
                  </Select.Trigger>
                  <Select.Content>
                    {#each documentTypes.filter(dt => dt.isActive) as docType}
                      <Select.Item value={docType.name}>
                        {docType.name}
                      </Select.Item>
                    {/each}
                    <Select.Item value="Other">Other</Select.Item>
                  </Select.Content>
                </Select.Root>

                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() => removeAttachment(index)}
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </Button>
              </div>
            {/each}
          </div>
        {/if}

        <!-- File Upload -->
        <div class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <input
            type="file"
            id="pdf-attachments"
            accept=".pdf"
            multiple
            class="hidden"
            onchange={handleFileSelect}
          />
          <div class="space-y-2">
            <svg class="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <p class="text-sm font-medium">Drop PDF files here or click to browse</p>
            <p class="text-xs text-muted-foreground">Multiple PDFs supported, max 10MB each</p>
            <Button
              variant="outline"
              onclick={() => document.getElementById('pdf-attachments')?.click()}
            >
              Choose Files
            </Button>
          </div>
        </div>
      </div>

      <!-- Preview -->
      {#if emailSubject || emailMessage || attachments.length > 0}
        <div class="border rounded-lg p-4 bg-muted/50">
          <h4 class="font-medium mb-2">Preview</h4>
          <div class="space-y-1 text-sm">
            <p><strong>To:</strong> {clientEmail}</p>
            <p><strong>Subject:</strong> {emailSubject || 'Documents from [Your Company]'}</p>
            <p><strong>Attachments:</strong> {attachments.length} PDF(s)</p>
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={handleCancel} disabled={loading}>
        Cancel
      </Button>
      <Button onclick={handleSend} disabled={loading || attachments.length === 0}>
        {loading ? 'Sending...' : 'Send Email'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>