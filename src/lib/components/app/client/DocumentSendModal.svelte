<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import * as Select from "$lib/components/ui/select";
   import { documentTemplatesStore, getDocumentTemplate } from "$lib/stores/documentTemplates";
   import { clientDocumentsStore } from "$lib/stores/clientDocuments";
   import { documentGenerationStore } from "$lib/stores/documentGeneration";
   import { clientManagementStore } from "$lib/stores/clientManagement";
   import { companyContext } from "$lib/stores/companyContext";

   import { ordersStore } from "$lib/stores/orders";
  import { get } from "svelte/store";
  import { mapClientDataToTemplate } from "$lib/utils/client-data-mapping";

   import { downloadFileAsBase64 } from "$lib/services/firebaseStorage";
   import type { UserProfile } from "$lib/types/user";
   import type { DocumentTemplate } from "$lib/types/document";
   import { toast } from "svelte-sonner";
   import { emailService } from "$lib/services/emailService";
    import { onMount } from "svelte";
    import Icon from '@iconify/svelte';
    import TemplatePreviewDialog from '$lib/components/shared/template-preview-dialog.svelte';
    import ProgressDialog from '$lib/components/ui/progress-dialog.svelte';
    import { createLogManager, type LogManager, type LogEntry } from '$lib/utils/logManager';

  interface Props {
    clientId: string;
    clientEmail: string;
    clientName: string;
    open: boolean;
    onSendComplete?: () => void;
  }

  let {
    clientId,
    clientEmail,
    clientName,
    open = $bindable(false),
    onSendComplete,
  }: Props = $props();

   let selectedTemplates = $state<string[]>([]);
   let selectedCustomDocs = $state<string[]>([]);
    let selectedOrderId = $state<string>("");
    let emailSubject = $state("");
    let emailMessage = $state("");
    let loading = $state(false);

    // Legal fields for POA template
    let companyRegistration = $state("");
    let nationality = $state("");
    let principalCapacity = $state("");
    let passportNumber = $state("");
    let passportIssueDate = $state("");
    let passportExpirationDate = $state("");
    let passportIssuePlace = $state("");
    let attorneys = $state("");

    let generationProgress = $state({
      current: 0,
      total: 0,
      currentDocument: "",
    });

   // Client data and generated documents
   let client = $state<UserProfile | null>(null);
   let orders = $state<any[]>([]);
   let generatedDocuments = $state<
     Array<{ id: string; name: string; content: string; format: "pdf" | "html" }>
   >([]);
   let previewDocument = $state<{
     id: string;
     name: string;
     content: string;
  } | null>(null);
  let showPreview = $state(false);
  let previewLoading = $state(false);
  
  // Template preview dialog state
  let previewTemplate = $state<DocumentTemplate | null>(null);
  let showTemplatePreviewDialog = $state(false);

  // Template data from store
  let availableTemplates = $state<
    { id: string; name: string; description: string }[]
  >([]);

  // Custom documents from store
  let customDocuments = $state<
    { id: string; name: string; uploadedAt: Date; pdfUrl?: string; fileType?: string }[]
  >([]);
    let smtpConfigured = $state(false);
    let smtpLoading = $state(true);

    // Progress dialog state
    let showProgressDialog = $state(false);
    let progressValue = $state(0);
    let isProcessComplete = $state(false);
    let logManager = $state<LogManager | null>(null);
    let currentLogs = $state<LogEntry[]>([]);
    let deliveryCheckInterval = $state<NodeJS.Timeout | null>(null);
    let messageId = $state<string | null>(null);
    let deliveryCheckCount = $state(0);
    let maxDeliveryChecks = 30; // Stop checking after 5 minutes (30 * 10s)

    // Update current logs when log manager changes
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

    // Load data when modal opens
    $effect(() => {
      if (open) {
        console.log("📧 [DOCUMENT SEND MODAL] Modal opened, checking SMTP config...");

        // Initialize log manager for this session
        logManager = createLogManager({ maxEntries: 50 });

        // Check SMTP config from company context (one-time check, no listener)
        const companyData = get(companyContext);
        const smtpConfig = companyData?.data?.smtpConfig;
        console.log("📧 [DOCUMENT SEND MODAL] Full company context data:", companyData);
        console.log("📧 [DOCUMENT SEND MODAL] SMTP Config available on modal open:", !!smtpConfig);
        console.log("📧 [DOCUMENT SEND MODAL] SMTP Config details:", smtpConfig);
        console.log("📧 [DOCUMENT SEND MODAL] Company data loading:", companyData?.loading);
        smtpConfigured = !!smtpConfig;
        smtpLoading = companyData?.loading || false;

        // Load client orders
        ordersStore.loadClientOrders(clientId);

       // Subscribe to templates store
       const unsubscribeTemplates = documentTemplatesStore.subscribe((state) => {
         availableTemplates = state.data.map((template: any) => ({
           id: template.id,
           name: template.name,
           description: template.description || "",
         }));
       });

       // Subscribe to orders store
       const unsubscribeOrders = ordersStore.subscribe((state) => {
         orders = state.data || [];
       });

       // Subscribe to client documents store
      const unsubscribeDocuments = clientDocumentsStore.subscribe((state) => {
        customDocuments = state.documents.map((doc: any) => ({
          id: doc.id,
          name:
            doc.data?.documentName ||
            doc.data?.title ||
            `Document ${doc.id.slice(-6)}`,
          uploadedAt: doc.generatedAt?.toDate() || new Date(),
          pdfUrl: doc.pdfUrl,
          fileType: "application/pdf",
        }));
      });

       // Subscribe to client management store to get client data
       const unsubscribeClient = clientManagementStore.subscribe((state) => {
         client = state.clients.find((c: any) => c.uid === clientId) || null;
         // Prefill legal fields with client data
         if (client) {
           // name is already available from client data
         }
       });

      // Load templates and client documents
      documentTemplatesStore.loadTemplates();
      clientDocumentsStore.loadClientDocuments(clientId);

        return () => {
          unsubscribeTemplates();
          unsubscribeOrders();
          unsubscribeDocuments();
          unsubscribeClient();
        };
    }
  });

  function handleTemplateToggle(templateId: string, checked: boolean) {
    if (checked) {
      selectedTemplates = [...selectedTemplates, templateId];
    } else {
      selectedTemplates = selectedTemplates.filter((id) => id !== templateId);
    }
  }

   function handleCustomDocToggle(docId: string, checked: boolean) {
     if (checked) {
       selectedCustomDocs = [...selectedCustomDocs, docId];
     } else {
       selectedCustomDocs = selectedCustomDocs.filter((id) => id !== docId);
     }
   }

   function isOrderTypeTemplate(template: { id: string; name: string; description: string }): boolean {
     const name = template.name.toLowerCase();
     const description = template.description.toLowerCase();
     return name.includes('invoice') || name.includes('order') || description.includes('invoice') || description.includes('order');
   }

  function hasOrderTypeSelectedTemplates(): boolean {
    return selectedTemplates.some(templateId => {
      const template = availableTemplates.find(t => t.id === templateId);
      return template && isOrderTypeTemplate(template);
    });
  }

  function isPOATemplateSelected(): boolean {
    return selectedTemplates.some(templateId => {
      const template = availableTemplates.find(t => t.id === templateId);
      return template && template.name.toLowerCase().includes('power of attorney');
    });
  }

  function areLegalFieldsComplete(): boolean {
    return !!(
      companyRegistration &&
      nationality &&
      principalCapacity &&
      passportNumber &&
      passportIssueDate &&
      passportExpirationDate &&
      passportIssuePlace &&
      attorneys
    );
  }

  async function handlePreview(templateId: string) {
    if (!client) {
      toast.error("Client data not available");
      return;
    }

    previewLoading = true;
    try {
      // Get the full template object from the store, not just the basic data
      const fullTemplate = await getDocumentTemplate(templateId);
      if (!fullTemplate) {
        toast.error("Template not found");
        return;
      }

      // Get company information
      const companyId = get(companyContext).data?.companyId;
      const companyName =
        get(companyContext).data?.company?.name || "Your Company";

       // Get selected order if available
       const selectedOrder = orders.find(o => o.id === selectedOrderId);

        // Map client data to template variables
        const templateData = mapClientDataToTemplate(client, selectedOrder);

            // Override with actual company name
            templateData.companyName = companyName;

            // Add legal fields if provided
            if (companyRegistration) templateData.companyRegistration = companyRegistration;
            if (nationality) templateData.nationality = nationality;
            if (principalCapacity) templateData.principalCapacity = principalCapacity;
            if (passportNumber) templateData.passportNumber = passportNumber;
            if (passportIssueDate) templateData.passportIssueDate = passportIssueDate;
            if (passportExpirationDate) templateData.passportExpirationDate = passportExpirationDate;
            if (passportIssuePlace) templateData.passportIssuePlace = passportIssuePlace;
            if (attorneys) templateData.attorneys = attorneys;

            // Add VAT number for ZATCA QR code
           const companyVatNumber = get(companyContext).data?.company?.vatNumber;
           if (companyVatNumber) {
             templateData.vatRegistrationNumber = companyVatNumber;
             console.log("Added VAT number to template data:", companyVatNumber);
           } else {
             console.log("No VAT number found in company context");
           }

       // Generate HTML preview
        const result = await documentGenerationStore.previewDocument(
         templateId,
         templateData,
         companyId,
         selectedOrderId || undefined,
       );

      // Use the full template object which has all required properties
      previewTemplate = fullTemplate;
      // Update the htmlContent with the generated preview
      previewTemplate.htmlContent = result.content;
      showTemplatePreviewDialog = true;
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate preview");
    } finally {
      previewLoading = false;
    }
  }

  function closePreview() {
    showPreview = false;
    previewDocument = null;
    showTemplatePreviewDialog = false;
    previewTemplate = null;
  }



  async function downloadDocument(
    templateId: string,
    fileName: string,
    format: "html" | "pdf",
  ) {
    if (!client) {
      toast.error("Client data not available");
      return;
    }

    try {
      // Get company information
      const companyId = get(companyContext).data?.companyId;
      const companyName =
        get(companyContext).data?.company?.name || "Your Company";

       // Get selected order if available
       const selectedOrder = orders.find(o => o.id === selectedOrderId);

        // Map client data to template variables
        const templateData = mapClientDataToTemplate(client, selectedOrder);
        templateData.companyName = companyName;

        // Add legal fields if provided
        if (companyRegistration) templateData.companyRegistration = companyRegistration;
        if (nationality) templateData.nationality = nationality;
        if (principalCapacity) templateData.principalCapacity = principalCapacity;
        if (passportNumber) templateData.passportNumber = passportNumber;
        if (passportIssueDate) templateData.passportIssueDate = passportIssueDate;
        if (passportExpirationDate) templateData.passportExpirationDate = passportExpirationDate;
        if (passportIssuePlace) templateData.passportIssuePlace = passportIssuePlace;
        if (attorneys) templateData.attorneys = attorneys;

         // Add VAT number for ZATCA QR code
        const companyVatNumber = get(companyContext).data?.company?.vatNumber;
        if (companyVatNumber) {
          templateData.vatRegistrationNumber = companyVatNumber;
          console.log("Added VAT number to template data:", companyVatNumber);
        } else {
          console.log("No VAT number found in company context");
        }

      // Generate document
      const result = await documentGenerationStore.generateDocument(
        templateId,
        templateData,
        format,
        companyId,
      );

      // Create download link
      const blob =
        format === "pdf"
          ? base64ToBlob(result.content, "application/pdf")
          : new Blob([result.content], { type: "text/html" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        `${format.toUpperCase()} document downloaded successfully!`,
      );
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error(`Failed to download ${format} document`);
    }
  }

  function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  function extractStoragePathFromUrl(url: string): string | null {
    try {
      // Firebase Storage URLs look like:
      // https://firebasestorage.googleapis.com/v0/b/bucket-name.appspot.com/o/path%2Fto%2Ffile.pdf?alt=media&token=...
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/^\/v0\/b\/[^\/]+\/o\/(.+)$/);
      if (pathMatch) {
        // Decode URL-encoded path
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch {
      return null;
    }
  }

  async function handleSend() {
    if (!logManager) {
      logManager = createLogManager({ maxEntries: 50 });
    }

    // Reset progress state
    showProgressDialog = true;
    progressValue = 0;
    isProcessComplete = false;
    deliveryCheckCount = 0;
    logManager.clear();

    logManager.info("Starting document sending process...");

    if (selectedTemplates.length === 0 && selectedCustomDocs.length === 0) {
      logManager.error("No documents selected");
      toast.error("Please select at least one document to send");
      showProgressDialog = false;
      return;
    }

    if (!client) {
      logManager.error("Client data not available");
      toast.error("Client data not available");
      showProgressDialog = false;
      return;
    }

    logManager.info(`Sending documents to ${clientName} (${clientEmail})`);

    if (!emailSubject.trim()) {
      emailSubject = `Documents from ${clientName}`;
      logManager.info("Using default email subject");
    }

    if (!emailMessage.trim()) {
      emailMessage = `Please find attached the requested documents.`;
      logManager.info("Using default email message");
    }

    loading = true;
    generatedDocuments = [];

    logManager.info(`Selected ${selectedTemplates.length} templates and ${selectedCustomDocs.length} custom documents`);

    try {
      // Get company information
      const companyId = get(companyContext).data?.companyId;
      const companyName =
        get(companyContext).data?.company?.name || "Your Company";

      // Generate documents from selected templates
      generationProgress = {
        current: 0,
        total: selectedTemplates.length,
        currentDocument: "",
      };

      logManager.info(`Starting document generation for ${selectedTemplates.length} templates`);

      for (let i = 0; i < selectedTemplates.length; i++) {
        const templateId = selectedTemplates[i];
        const template = availableTemplates.find((t) => t.id === templateId);
        if (!template) {
          logManager.warning(`Template ${templateId} not found, skipping`);
          continue;
        }

        // Update progress before generation
        generationProgress = {
          current: i,
          total: selectedTemplates.length,
          currentDocument: template.name,
        };

        progressValue = (i / selectedTemplates.length) * 30; // 30% for document generation
        logManager.info(`Generating document: ${template.name}`);

        // Add a small delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
       // Get selected order if available
       const selectedOrder = orders.find(o => o.id === selectedOrderId);

       // Map client data to template variables
       const templateData = mapClientDataToTemplate(client, selectedOrder);

          // Override with actual company name
          templateData.companyName = companyName;

          logManager.info(`Making API call to generate document: ${template.name}`);
          const startTime = Date.now();

          // Generate PDF document
           const result = await documentGenerationStore.generateDocument(
             templateId,
             templateData,
             "pdf",
             companyId,
             selectedOrderId || undefined,
           );

          const duration = Date.now() - startTime;
          logManager.success(`Document generated successfully: ${template.name}.pdf (${duration}ms)`);

          generatedDocuments.push({
            id: templateId,
            name: `${template.name}.pdf`,
            content: result.content,
            format: "pdf",
          });

          // Update progress after successful generation
          generationProgress = {
            current: i + 1,
            total: selectedTemplates.length,
            currentDocument: template.name,
          };
         } catch (error) {
           console.error(
             `Failed to generate document from template ${templateId}:`,
             error,
           );
           logManager.error(`Failed to generate document: ${template.name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
           // Error toast is now handled by the document generation store
         }
      }

      logManager.info(`Document generation completed. Generated ${generatedDocuments.length} documents`);

      // Prepare attachments (generated documents + custom documents)
      const attachments = [
        ...generatedDocuments.map((doc) => ({
          filename: doc.name,
          content: doc.content,
          type: "application/pdf",
          encoding: "base64" as const,
        })),
      ];

      // Add custom documents
      logManager.info(`Preparing ${selectedCustomDocs.length} custom documents for attachment`);

      for (const customDocId of selectedCustomDocs) {
        const customDoc = customDocuments.find(doc => doc.id === customDocId);
        if (customDoc?.pdfUrl) {
          const storagePath = extractStoragePathFromUrl(customDoc.pdfUrl);
          if (storagePath) {
            try {
              logManager.info(`Making API call to download custom document: ${customDoc.name}`);
              const downloadStartTime = Date.now();
              const base64Content = await downloadFileAsBase64(storagePath);
              const downloadDuration = Date.now() - downloadStartTime;

              if (base64Content) {
                attachments.push({
                  filename: customDoc.name,
                  content: base64Content,
                  type: customDoc.fileType || "application/pdf",
                  encoding: "base64" as const,
                });
                logManager.success(`Custom document downloaded and attached: ${customDoc.name} (${downloadDuration}ms, ${(base64Content.length * 0.75 / 1024).toFixed(1)}KB)`);
              } else {
                logManager.warning(`Failed to download content for: ${customDoc.name}`);
              }
            } catch (error) {
              console.error(`Failed to download custom document ${customDocId}:`, error);
              logManager.error(`Failed to attach custom document: ${customDoc.name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
              toast.error(`Failed to attach ${customDoc.name}`);
            }
          } else {
            logManager.warning(`Invalid storage path for custom document: ${customDoc.name}`);
          }
        } else {
          logManager.warning(`Custom document not found or missing PDF URL: ${customDocId}`);
        }
      }

      progressValue = 60; // 60% after preparing attachments

      // Send email with attachments
      logManager.info(`Preparing to send email with ${attachments.length} attachments`);
      logManager.info(`Recipient: ${clientEmail}`);
      logManager.info(`Subject: ${emailSubject}`);
      logManager.info(`Message length: ${emailMessage.length} characters`);

      // Calculate total attachment size
      const totalSize = attachments.reduce((sum, att) => sum + (att.content.length * 0.75), 0);
      logManager.info(`Total attachment size: ${(totalSize / 1024).toFixed(1)}KB`);

      progressValue = 70; // 70% before email sending

      const { emailService } = await import("$lib/services/emailService");

      // Check SMTP config using reactive state
      if (!smtpConfigured) {
        logManager.error("SMTP configuration is required to send emails");
        toast.error("SMTP configuration is required to send emails. Please <a href='/settings' class='underline hover:no-underline'>configure your email settings</a> before sending documents.");
        showProgressDialog = false;
        return;
      }

      logManager.info("SMTP configuration verified, initiating email transmission...");

      progressValue = 80; // 80% during email sending

      const emailStartTime = Date.now();
      logManager.info("Making API call to email service...");

      const emailResult = await emailService.sendEmail({
        to: clientEmail,
        subject: emailSubject,
        htmlBody: emailMessage,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      const emailDuration = Date.now() - emailStartTime;

      if (emailResult.success) {
        logManager.success(`Email sent successfully in ${emailDuration}ms`);
        logManager.info(`Message ID: ${emailResult.messageId}`);
        logManager.info(`Delivery ID: ${emailResult.deliveryId}`);
        logManager.info("Email record stored in database for delivery tracking");

        // Store messageId for delivery tracking
        messageId = emailResult.messageId || null;
        logManager.info(`Will monitor delivery status for messageId: ${messageId}`);

        // Start checking delivery status every 10 seconds
        logManager.info("Starting delivery status monitoring (checks every 10s for 5 minutes)...");
        deliveryCheckInterval = setInterval(checkDeliveryStatus, 10000);

        // Initial check after a short delay
        setTimeout(checkDeliveryStatus, 2000);
      } else {
        logManager.error(`Email sending failed: ${emailResult.error}`);
        throw new Error(emailResult.error || "Email sending failed");
      }

      progressValue = 100; // 100% after successful sending

      const totalDocuments =
        generatedDocuments.length + selectedCustomDocs.length;
      logManager.success(`Process completed! Sent ${totalDocuments} document${totalDocuments > 1 ? "s" : ""} to ${clientName}`);

      toast.success(
        `Successfully sent ${totalDocuments} document${totalDocuments > 1 ? "s" : ""} to ${clientName}`,
      );

      // Mark process as complete
      isProcessComplete = true;
      logManager.info("All documents sent successfully! You can now close this dialog.");

      // Don't auto-close - let user control when to close
      // Reset form only when user explicitly closes the dialog
    } catch (error) {
      console.error("Error sending documents:", error);
      logManager.error(`Process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error("Failed to send documents");
      showProgressDialog = false;
    } finally {
      loading = false;
    }
  }

  // Check delivery status
  async function checkDeliveryStatus() {
    if (!messageId || !logManager) return;

    deliveryCheckCount++;
    const isLastCheck = deliveryCheckCount >= maxDeliveryChecks;

    try {
      if (deliveryCheckCount === 1) {
        logManager.info("Starting delivery status monitoring...");
      } else {
        logManager.info(`Checking delivery status... (${deliveryCheckCount}/${maxDeliveryChecks})`);
      }

      // Get email history for the client to find delivery updates
      const { emailService } = await import("$lib/services/emailService");
      const emailHistory = await emailService.getEmailHistoryForClient(clientEmail);

      logManager.info(`Found ${emailHistory.length} emails in history for ${clientEmail}`);

      // Find the most recent email with our messageId
      const recentEmail = emailHistory.find(email => email.messageId === messageId);

      if (recentEmail) {
        const status = recentEmail.status;
        const sentDate = recentEmail.sentDate;
        const timeSinceSent = sentDate ? Math.floor((Date.now() - sentDate.toDate().getTime()) / 1000) : 0;

        logManager.info(`Found email record: status=${status}, sent ${timeSinceSent}s ago`);

        if (status === 'delivered') {
          logManager.success(`✅ Email delivered successfully to ${clientEmail} (${timeSinceSent}s after sending)`);
          if (deliveryCheckInterval) {
            clearInterval(deliveryCheckInterval);
            deliveryCheckInterval = null;
          }
        } else if (status === 'bounced') {
          logManager.error(`❌ Email bounced: ${recentEmail.errorMessage || 'Unknown bounce reason'}`);
          if (deliveryCheckInterval) {
            clearInterval(deliveryCheckInterval);
            deliveryCheckInterval = null;
          }
        } else if (status === 'sent') {
          if (isLastCheck) {
            logManager.warning(`⏰ Stopped monitoring after ${maxDeliveryChecks * 10}s. Email status: sent (delivery confirmation may come later via webhook)`);
          } else {
            logManager.info(`📤 Email sent ${timeSinceSent}s ago, still waiting for delivery confirmation...`);
          }
        } else {
          logManager.info(`📧 Email status: ${status}`);
        }
      } else {
        logManager.warning(`No email record found with messageId: ${messageId}`);
        logManager.info(`Available messageIds: ${emailHistory.map(e => e.messageId).join(', ')}`);

        if (isLastCheck) {
          logManager.warning(`⏰ Stopped monitoring after ${maxDeliveryChecks * 10}s. Email may have been sent but delivery tracking is unavailable.`);
        } else {
          logManager.info("Delivery status not yet available, will check again...");
        }
      }

      // Stop checking after max attempts
      if (isLastCheck && deliveryCheckInterval) {
        logManager.info("Delivery monitoring completed. You can close this dialog.");
        clearInterval(deliveryCheckInterval);
        deliveryCheckInterval = null;
      }

    } catch (error) {
      logManager.warning(`Could not check delivery status: ${error instanceof Error ? error.message : 'Unknown error'}`);

      if (isLastCheck && deliveryCheckInterval) {
        clearInterval(deliveryCheckInterval);
        deliveryCheckInterval = null;
      }
    }
  }

  function handleCancel() {
    // Clear any ongoing delivery checks
    if (deliveryCheckInterval) {
      clearInterval(deliveryCheckInterval);
      deliveryCheckInterval = null;
    }

  selectedTemplates = [];
  selectedCustomDocs = [];
  emailSubject = "";
  emailMessage = "";
  companyRegistration = "";
  nationality = "";
  principalCapacity = "";
  passportNumber = "";
  passportIssueDate = "";
  passportExpirationDate = "";
  passportIssuePlace = "";
  attorneys = "";
  generatedDocuments = [];
  generationProgress = { current: 0, total: 0, currentDocument: "" };
  deliveryCheckCount = 0;
  messageId = null;
    closePreview();
    showTemplatePreviewDialog = false;
    previewTemplate = null;
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content style="width: 90vw; height: 95vh; max-width: none; max-height: none;" class="overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Send Documents to {clientName}</Dialog.Title>
      <Dialog.Description>
        Select documents to send and customize the email message.
      </Dialog.Description>
    </Dialog.Header>

     <div class="space-y-6">
        {#if smtpLoading}
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center">
              <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <div>
                <h4 class="text-sm font-medium text-blue-800">Loading Email Configuration</h4>
                <p class="text-sm text-blue-700 mt-1">
                  Checking SMTP configuration...
                </p>
              </div>
            </div>
          </div>
        {:else if !smtpConfigured}
          <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-center">
              <Icon icon="lucide:alert-triangle" class="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h4 class="text-sm font-medium text-yellow-800">SMTP Configuration Required</h4>
                <p class="text-sm text-yellow-700 mt-1">
                  Document sending is disabled because SMTP is not configured. Please <a href="/settings" class="underline hover:no-underline">configure your email settings</a> to send documents.
                </p>
              </div>
            </div>
          </div>
        {/if}

       <!-- Debug Info (don't remove until told) -->
       <div class="p-3 bg-card rounded text-xs">
         <p><strong>Debug Info:</strong></p>
         <p>Client loaded: {client ? "Yes" : "No"}</p>
         <p>Templates available: {availableTemplates.length}</p>
         <p>Custom documents: {customDocuments.length}</p>
          <p>SMTP configured: {smtpConfigured ? "Yes" : "No"}</p>
          <p>SMTP loading: {smtpLoading ? "Yes" : "No"}</p>
         {#if client}
           <p>
             Client name: {client.displayName ||
               client.firstName + " " + client.lastName}
           </p>
         {/if}
       </div>

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
                   onCheckedChange={(checked) =>
                     handleTemplateToggle(template.id, checked)}
                 />
                <div class="flex-1">
                  <Label
                    for="template-{template.id}"
                    class="font-medium cursor-pointer"
                  >
                    {template.name}
                  </Label>
                  <p class="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <div class="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onclick={() => handlePreview(template.id)}
                      disabled={!client || previewLoading || (isOrderTypeTemplate(template) && !selectedOrderId) || (isPOATemplateSelected() && !areLegalFieldsComplete())}
                    >
                     {previewLoading ? "Loading..." : "Preview"}
                   </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onclick={() =>
                        downloadDocument(template.id, template.name, "pdf")}
                      disabled={!client || (isOrderTypeTemplate(template) && !selectedOrderId) || (isPOATemplateSelected() && !areLegalFieldsComplete())}
                    >
                     Download PDF
                   </Button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="text-center py-8 text-muted-foreground">
          <p>No document templates available.</p>
          <p class="text-sm">
            Create templates in the Templates section to generate documents.
          </p>
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
                onCheckedChange={(checked) => handleCustomDocToggle(doc.id, checked)}
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

       <!-- Order Selection for Invoice Templates -->
       {#if orders.length > 0 && selectedTemplates.length > 0}
         <div class="space-y-3">
           <Label class="text-base font-medium">Select Order for Invoice</Label>
           <p class="text-sm text-muted-foreground">
             Choose an order to generate invoice documents with accurate data.
           </p>
           <Select.Root type="single" value={selectedOrderId} onValueChange={(v) => selectedOrderId = v}>
             <Select.Trigger>
               {selectedOrderId ? orders.find(o => o.id === selectedOrderId)?.title || "Select Order" : "Select Order"}
             </Select.Trigger>
             <Select.Content>
               <Select.Item value="">No Order (Use Default Data)</Select.Item>
               {#each orders as order}
                 <Select.Item value={order.id}>{order.title} - {order.totalAmount ? `$${order.totalAmount}` : order.status}</Select.Item>
               {/each}
             </Select.Content>
        </Select.Root>
          </div>
        {/if}

        <!-- Legal Fields for POA -->
        {#if isPOATemplateSelected()}
          <div class="space-y-3">
            <Label class="text-base font-medium">Legal Fields for Power of Attorney</Label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="companyRegistration">Company Registration Number</Label>
                <Input id="companyRegistration" bind:value={companyRegistration} placeholder="Enter company registration number" />
              </div>
              <div class="space-y-2">
                <Label for="nationality">Nationality</Label>
                <Input id="nationality" bind:value={nationality} placeholder="Enter nationality" />
              </div>
              <div class="space-y-2">
                <Label for="principalCapacity">Principal Capacity</Label>
                <Input id="principalCapacity" bind:value={principalCapacity} placeholder="Enter principal capacity" />
              </div>
              <div class="space-y-2">
                <Label for="passportNumber">Passport Number</Label>
                <Input id="passportNumber" bind:value={passportNumber} placeholder="Enter passport number" />
              </div>
              <div class="space-y-2">
                <Label for="passportIssueDate">Passport Issue Date</Label>
                <Input id="passportIssueDate" type="date" bind:value={passportIssueDate} />
              </div>
              <div class="space-y-2">
                <Label for="passportExpirationDate">Passport Expiration Date</Label>
                <Input id="passportExpirationDate" type="date" bind:value={passportExpirationDate} />
              </div>
              <div class="space-y-2">
                <Label for="passportIssuePlace">Passport Issue Place</Label>
                <Input id="passportIssuePlace" bind:value={passportIssuePlace} placeholder="Enter passport issue place" />
              </div>
              <div class="space-y-2">
                <Label for="attorneys">Authorized Attorneys (JSON)</Label>
                <Textarea id="attorneys" bind:value={attorneys} placeholder="Enter attorneys as JSON array" rows={3} />
              </div>
            </div>
          </div>
        {/if}

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

      <!-- Template Preview Dialog -->
      <TemplatePreviewDialog 
        bind:open={showTemplatePreviewDialog} 
        template={previewTemplate} 
      />

      <!-- Send Preview -->
      {#if selectedTemplates.length > 0 || selectedCustomDocs.length > 0}
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-base">Send Preview</Card.Title>
          </Card.Header>
          <Card.Content>
            <div class="space-y-2">
              <p class="text-sm"><strong>To:</strong> {clientEmail}</p>
              <p class="text-sm">
                <strong>Subject:</strong>
                {emailSubject || "Documents from [Your Company]"}
              </p>
              <p class="text-sm">
                <strong>Attachments:</strong>
                {selectedTemplates.length + selectedCustomDocs.length} document(s)
              </p>
              {#if generatedDocuments.length > 0}
                <div class="text-sm">
                  <strong>Generated Documents:</strong>
                  <ul class="list-disc list-inside mt-1">
                    {#each generatedDocuments as doc}
                      <li>{doc.name}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>

    {#if loading}
      <div class="px-6 py-4 border-t bg-muted/30">
        {#if generationProgress.total > 0}
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium">Generating documents...</span>
              <span class="text-sm font-bold text-primary">
                {generationProgress.current} / {generationProgress.total}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                class="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                style="width: {Math.min((generationProgress.current / generationProgress.total) * 100, 100)}%"
              ></div>
            </div>
            {#if generationProgress.currentDocument}
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <p class="text-sm text-muted-foreground">
                  Currently generating: <span class="font-medium">{generationProgress.currentDocument}</span>
                </p>
              </div>
            {/if}
            <div class="text-xs text-muted-foreground">
              {Math.round((generationProgress.current / generationProgress.total) * 100)}% complete
            </div>
          </div>
        {:else}
          <div class="flex items-center space-x-3">
            <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm font-medium">Preparing documents...</span>
          </div>
        {/if}
      </div>
    {/if}

    <Dialog.Footer>
       <Button variant="outline" onclick={handleCancel} disabled={loading}>
         Cancel
       </Button>
          <Button
            onclick={handleSend}
            disabled={loading || smtpLoading ||
              (selectedTemplates.length === 0 && selectedCustomDocs.length === 0) ||
              !smtpConfigured ||
              (hasOrderTypeSelectedTemplates() && !selectedOrderId) ||
              (isPOATemplateSelected() && !areLegalFieldsComplete())}
          >
        {#if loading}
          {#if generationProgress.total > 0}
            Generating ({generationProgress.current}/{generationProgress.total})
          {:else}
            Sending...
          {/if}
        {:else}
          Send Documents
        {/if}
      </Button>
    </Dialog.Footer>
   </Dialog.Content>
</Dialog.Root>

<!-- Progress Dialog -->
{#if logManager}
  <ProgressDialog
    open={showProgressDialog}
    title="Sending Documents"
    progress={progressValue}
    logs={currentLogs}
    isComplete={isProcessComplete}
    completionMessage="Documents sent successfully! The dialog will remain open to show delivery status updates."
    onClose={() => {
      // Clear delivery status checking
      if (deliveryCheckInterval) {
        clearInterval(deliveryCheckInterval);
        deliveryCheckInterval = null;
      }

      showProgressDialog = false;
      // Reset form when user closes the dialog
      selectedTemplates = [];
      selectedCustomDocs = [];
      emailSubject = "";
      emailMessage = "";
      generatedDocuments = [];
      generationProgress = { current: 0, total: 0, currentDocument: "" };
      messageId = null;
      deliveryCheckCount = 0;
      open = false;
      onSendComplete?.();
    }}
  />
{/if}
