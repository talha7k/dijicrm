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
  import { emailService } from '$lib/services/emailService';
  import { get } from 'svelte/store';
  import { companyContext } from '$lib/stores/companyContext';
  import Icon from '@iconify/svelte';
  import ProgressDialog from '$lib/components/ui/progress-dialog.svelte';
  import { createLogManager, type LogManager, type LogEntry } from '$lib/utils/logManager';
  import { untrack } from 'svelte';

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
      let processingFiles = $state(false);

   // Progress dialog state
   let showProgressDialog = $state(false);
   let progressValue = $state(0);
   let isProcessComplete = $state(false);
   let logManager = $state<LogManager | null>(null);
   let currentLogs = $state<LogEntry[]>([]);

  // Attachments with document types
  let attachments = $state<Array<{
    file: File;
    documentType: string;
    fileName: string;
    fileSize: number;
  }>>([]);

     let docTypesUnsubscribe: (() => void) | null = null;
     let subjectTimeout: number | null = null;
     let messageTimeout: number | null = null;

      // Update current logs when log manager changes (proper Svelte 5 approach)
      $effect(() => {
        if (logManager) {
          const unsubscribe = logManager.store.subscribe(logs => {
            currentLogs = logs;
          });
          return unsubscribe;
        } else {
          currentLogs = [];
        }
      });

     // Initialize when modal opens
      function initializeModal() {
        if (!open) return;
        
        console.log("📧 [EMAIL COMPOSE MODAL] Initializing modal...");
        
        // Initialize log manager
        logManager = createLogManager({ maxEntries: 50 });
        
        // Set default subject (keep prefilled as it's useful)
        if (!emailSubject.trim()) {
          emailSubject = `Documents from ${clientName}`;
          console.log("📧 [EMAIL COMPOSE MODAL] Set default subject:", emailSubject);
        }
        
        // Set default message (prefilled value)
        if (!emailMessage.trim()) {
          emailMessage = `Hi ${clientName},

I hope this email finds you well. Please find the requested documents attached for your review.

If you have any questions or need any clarification on any of the documents, please don't hesitate to reach out.

Best regards`;
          console.log("📧 [EMAIL COMPOSE MODAL] Set default message");
        }
        
        // Load document types
        console.log("📧 [EMAIL COMPOSE MODAL] Loading document types...");
        documentTypesStore.loadDocumentTypes();
        
        // Log initial state
        console.log("📧 [EMAIL COMPOSE MODAL] Modal opened for client:", clientName, clientEmail);
        logManager.info("Email compose modal opened");
        logManager.info(`Composing email to ${clientName} (${clientEmail})`);
        
        // Set up subscriptions
        docTypesUnsubscribe = documentTypesStore.subscribe((state) => {
          documentTypes = state.data || [];
          console.log("📧 [EMAIL COMPOSE MODAL] Document types updated:", documentTypes.length, "types loaded");
        });
        
        console.log("📧 [EMAIL COMPOSE MODAL] Initialization complete");
     }

     // Clean up when modal closes
     function cleanupModal() {
       if (docTypesUnsubscribe) {
         docTypesUnsubscribe();
         docTypesUnsubscribe = null;
       }
       if (subjectTimeout) {
         clearTimeout(subjectTimeout);
         subjectTimeout = null;
       }
       if (messageTimeout) {
         clearTimeout(messageTimeout);
         messageTimeout = null;
       }
       currentLogs = [];
     }

    // Handle modal open/close changes imperatively
    function handleOpenChange() {
      if (open) {
        initializeModal();
      } else {
        cleanupModal();
      }
    }

    // Log email composition changes with debouncing
    function logSubjectChange() {
      if (!logManager || !open) return;
      
      if (subjectTimeout) {
        clearTimeout(subjectTimeout);
      }
      subjectTimeout = setTimeout(() => {
        if (logManager && emailSubject) {
          logManager.info(`📝 Email subject updated: "${emailSubject}"`);
        }
      }, 500) as unknown as number;
    }

    function logMessageChange() {
      if (!logManager || !open) return;
      
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
      messageTimeout = setTimeout(() => {
        if (logManager && emailMessage) {
          logManager.info(`📝 Email message updated: ${emailMessage.length} characters`);
        }
      }, 500) as unknown as number;
    }

    // Handle email input changes directly
    function handleSubjectInput() {
      console.log("📧 [EMAIL COMPOSE MODAL] Subject input changed:", emailSubject);
      logSubjectChange();
    }

    function handleMessageInput() {
      console.log("📧 [EMAIL COMPOSE MODAL] Message input changed:", emailMessage.length, "characters");
      logMessageChange();
    }

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files) {
      processingFiles = true;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type (common document and media types)
        const allowedTypes = [
          // Documents
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'application/rtf',

          // Images
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'image/bmp',
          'image/tiff',

          // Archives
          'application/zip',
          'application/x-zip-compressed',
          'application/x-rar-compressed',

          // Other common types
          'application/json',
          'application/xml',
          'text/xml'
        ];

        // Check file extension as fallback for files without proper MIME types
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const allowedExtensions = [
          'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf',
          'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif',
          'zip', 'rar',
          'json', 'xml'
        ];

        const isValidType = allowedTypes.includes(file.type) ||
                           (fileExtension && allowedExtensions.includes(fileExtension));

        if (!isValidType) {
          toast.error(`${file.name} is not a supported file type. Please use common document, image, or archive files.`);
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
      // Small delay to show processing state
      await new Promise(resolve => setTimeout(resolve, 100));
      processingFiles = false;

      // Clear the file input
      target.value = '';
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
    console.log("🚀 [EMAIL COMPOSE MODAL] ===== SEND BUTTON CLICKED =====");
    console.log("📧 [EMAIL COMPOSE MODAL] Attachments:", attachments.length);
    console.log("📧 [EMAIL COMPOSE MODAL] Subject:", emailSubject);
    console.log("📧 [EMAIL COMPOSE MODAL] Message length:", emailMessage.length);
    console.log("📧 [EMAIL COMPOSE MODAL] Recipient:", clientEmail);
    
    if (!logManager) {
      console.log("📧 [EMAIL COMPOSE MODAL] Creating new log manager");
      logManager = createLogManager({ maxEntries: 50 });
    }

    // Reset progress state
    console.log("📧 [EMAIL COMPOSE MODAL] Showing progress dialog...");
    showProgressDialog = true;
    progressValue = 0;
    isProcessComplete = false;
    logManager.clear();

    console.log("📧 [EMAIL COMPOSE MODAL] Progress dialog shown, adding initial log");
    logManager.info("Starting email sending process...");
    console.log("📧 [EMAIL COMPOSE MODAL] Added initial log");

    if (!emailSubject.trim()) {
      emailSubject = `Documents from ${clientName}`;
      logManager.info("Using default email subject");
      console.log("📧 [EMAIL COMPOSE MODAL] Added subject log");
    }

    if (!emailMessage.trim()) {
      emailMessage = `Please find attached the requested documents.`;
      logManager.info("Using default email message");
      console.log("📧 [EMAIL COMPOSE MODAL] Added message log");
    }

    logManager.info(`Preparing to send email with ${attachments.length} attachments`);
    console.log("📧 [EMAIL COMPOSE MODAL] Added attachments log");
    logManager.info(`Recipient: ${clientEmail}`);
    console.log("📧 [EMAIL COMPOSE MODAL] Added recipient log");
    logManager.info(`Subject: ${emailSubject}`);
    console.log("📧 [EMAIL COMPOSE MODAL] Added subject log");
    logManager.info(`Message length: ${emailMessage.length} characters`);
    console.log("📧 [EMAIL COMPOSE MODAL] Added message length log");

    // Calculate total attachment size
    const totalSize = attachments.reduce((sum, att) => sum + att.fileSize, 0);
    logManager.info(`Total attachment size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

    loading = true;

    try {
      progressValue = 50; // 50% preparing

      // Import the email history store
      console.log("📧 [EMAIL COMPOSE MODAL] Importing email history store...");
      const { emailHistoryStore } = await import('$lib/stores/emailHistory');

      const emailStartTime = Date.now();
      console.log("📧 [EMAIL COMPOSE MODAL] Starting email send request...");
      console.log("📧 [EMAIL COMPOSE MODAL] Email payload:", {
        subject: emailSubject,
        messageLength: emailMessage.length,
        recipient: clientEmail,
        attachmentCount: attachments.length
      });
      logManager.info("Sending email...");

       console.log("📧 [EMAIL COMPOSE MODAL] Making API call to sendEmail...");
       const result = await emailHistoryStore.sendEmail({
         subject: emailSubject,
         message: emailMessage,
         recipient: clientEmail,
         attachments: attachments.map(att => ({
           file: att.file,
           documentType: att.documentType,
           filename: att.fileName,
         })),
       }, (message: string) => {
         if (logManager) {
           logManager.info(message);
         }
       });

      const emailDuration = Date.now() - emailStartTime;
      console.log("📧 [EMAIL COMPOSE MODAL] Email send completed:", {
        duration: `${emailDuration}ms`,
        success: result.success,
        result: result
      });

      if (result.success) {
        logManager.success(`Email sent successfully in ${emailDuration}ms`);
        logManager.info(`Email sent to ${clientName} with ${attachments.length} attachment(s)`);
        progressValue = 100;

        toast.success(`Email sent successfully to ${clientName} with ${attachments.length} attachment(s)`);

        // Mark process as complete after a small delay to ensure logs are captured
        setTimeout(() => {
          isProcessComplete = true;
          if (logManager) {
            logManager.info("Email composition completed successfully!");
          }
          console.log("📧 [EMAIL COMPOSE MODAL] Process marked as complete");
        }, 100);

        // Keep dialog open for user to review logs
        // User can manually close via Cancel or Close button
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('🚨 [EMAIL COMPOSE MODAL] ERROR SENDING EMAIL:', error);
      console.error('🚨 [EMAIL COMPOSE MODAL] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      logManager.error(`Process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      console.log("📧 [EMAIL COMPOSE MODAL] Send process completed, loading set to false");
      loading = false;
    }
  }

  function handleCancel() {
    // Clear any ongoing processes
    if (logManager) {
      logManager.clear();
    }

    emailSubject = '';
    emailMessage = '';
    attachments = [];
    showProgressDialog = false;
    progressValue = 0;
    isProcessComplete = false;
    open = false;
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getFileIcon(fileName: string) {
    const extension = fileName.toLowerCase().split('.').pop();

    switch (extension) {
      // Documents
      case 'pdf':
        return 'lucide:file-text';
      case 'doc':
      case 'docx':
        return 'lucide:file-text';
      case 'xls':
      case 'xlsx':
        return 'lucide:file-spreadsheet';
      case 'ppt':
      case 'pptx':
        return 'lucide:presentation';
      case 'txt':
        return 'lucide:file-text';
      case 'csv':
        return 'lucide:file-spreadsheet';
      case 'rtf':
        return 'lucide:file-text';

      // Images
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
      case 'bmp':
      case 'tiff':
      case 'tif':
        return 'lucide:image';

      // Archives
      case 'zip':
      case 'rar':
        return 'lucide:archive';

      // Other
      case 'json':
      case 'xml':
        return 'lucide:code';

      default:
        return 'lucide:file';
    }
  }
</script>

<Dialog.Root open={open} onOpenChange={(isOpen) => { open = isOpen; handleOpenChange(); }}>
  <Dialog.Content class="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Compose Email to {clientName}</Dialog.Title>
      <Dialog.Description>
        Write a message and attach files with document type categorization.
      </Dialog.Description>
    </Dialog.Header>

      <div class="space-y-6">

       <!-- Email Details -->
       <div class="space-y-4">
         <div class="space-y-2">
           <Label for="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                oninput={(e) => { const target = e.target as HTMLInputElement; emailSubject = target.value; handleSubjectInput(); }}
                placeholder="Documents from [Your Company]"
              />
         </div>

         <div class="space-y-2">
           <Label for="message">Message</Label>
              <Textarea
                id="message"
                value={emailMessage}
                oninput={(e) => { const target = e.target as HTMLTextAreaElement; emailMessage = target.value; handleMessageInput(); }}
                placeholder="Type your message here..."
                rows={6}
              />
         </div>
       </div>

        <!-- File Attachments -->
        <div class="space-y-3">
          <Label class="text-base font-medium">File Attachments</Label>

            {#if processingFiles}
              <div class="p-3 bg-muted rounded-lg text-center text-muted-foreground">
                <div class="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p>Processing files... ({attachments.length} files)</p>
              </div>
            {:else}
         {#if attachments.length > 0}
           <div class="space-y-2">
             {#each attachments as attachment, index (attachment.fileName)}
                <div class="flex items-center gap-3 p-3 border rounded-lg">
                  <Icon icon="lucide:file" class="h-8 w-8 text-muted-foreground flex-shrink-0" />
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
            id="file-attachments"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.zip,.rar,.json,.xml"
            multiple
            class="hidden"
            onchange={handleFileSelect}
          />
          <div class="space-y-2">
            <svg class="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <p class="text-sm font-medium">Drop files here or click to browse</p>
            <p class="text-xs text-muted-foreground">Multiple files supported, max 10MB each</p>
            <Button
              variant="outline"
              onclick={() => document.getElementById('file-attachments')?.click()}
            >
              Choose Files
            </Button>
          </div>
         </div>
         {/if}
       </div>

       <!-- Preview -->
       {#if emailSubject || emailMessage || attachments.length > 0}
         <div class="border rounded-lg p-4 bg-muted/50">
           <h4 class="font-medium mb-2">Preview</h4>
           <div class="space-y-1 text-sm">
             <p><strong>To:</strong> {clientEmail}</p>
             <p><strong>Subject:</strong> {emailSubject || 'Documents from [Your Company]'}</p>
             <p><strong>Attachments:</strong> {attachments.length} file(s)</p>
           </div>
         </div>
       {/if}

       <!-- Debug Panel -->
       <div class="border rounded-lg p-4 bg-blue-50 border-blue-200">
         <h4 class="font-medium mb-2 text-blue-800">Debug Info</h4>
         <div class="space-y-1 text-xs font-mono">
           <p><strong>Modal Open:</strong> {open ? "Yes" : "No"}</p>
           <p><strong>Log Manager:</strong> {logManager ? "Initialized" : "Not initialized"}</p>
           <p><strong>Document Types:</strong> {documentTypes.length} loaded</p>
           <p><strong>Current Logs:</strong> {currentLogs.length} entries</p>
           {#if currentLogs.length > 0}
             <div class="mt-2 max-h-20 overflow-y-auto bg-white rounded p-2 border">
               {#each currentLogs as log}
                 <div class="text-xs {log.level === 'error' ? 'text-red-600' : log.level === 'success' ? 'text-green-600' : 'text-gray-600'}">
                   [{log.level.toUpperCase()}] {log.message}
                 </div>
               {/each}
             </div>
           {/if}
         </div>
       </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={handleCancel} disabled={loading}>
        Cancel
      </Button>
        <Button onclick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : 'Send Email'}
        </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Progress Dialog -->
{#if logManager}
  <ProgressDialog
    open={showProgressDialog}
    title="Sending Email"
    progress={progressValue}
    logs={currentLogs}
    isComplete={isProcessComplete}
    completionMessage="Email sent successfully!"
    onClose={() => {
      showProgressDialog = false;
      handleCancel();
    }}
  />
{/if}