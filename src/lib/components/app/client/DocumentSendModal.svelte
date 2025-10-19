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
   import { authenticatedFetch } from "$lib/utils/authUtils";
   import { downloadFileAsBase64 } from "$lib/services/firebaseStorage";
   import type { UserProfile } from "$lib/types/user";
   import type { DocumentTemplate } from "$lib/types/document";
   import { toast } from "svelte-sonner";
   import { emailService } from "$lib/services/emailService";
   import { onMount } from "svelte";
   import Icon from '@iconify/svelte';
   import TemplatePreviewDialog from '$lib/components/shared/template-preview-dialog.svelte';

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

   // Load data when modal opens
   $effect(() => {
     if (open) {
       console.log("📧 [DOCUMENT SEND MODAL] Modal opened, checking SMTP config...");

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

  async function generateSampleTemplates() {
    try {
      const response = await authenticatedFetch("/api/sample-data", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Sample templates generated successfully!");
        // Reload templates
        documentTemplatesStore.loadTemplates();
      } else {
        toast.error("Failed to generate sample templates");
      }
    } catch (error) {
      console.error("Error generating sample templates:", error);
      toast.error("Failed to generate sample templates");
    }
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
    if (selectedTemplates.length === 0 && selectedCustomDocs.length === 0) {
      toast.error("Please select at least one document to send");
      return;
    }

    if (!client) {
      toast.error("Client data not available");
      return;
    }

    if (!emailSubject.trim()) {
      emailSubject = `Documents from ${clientName}`;
    }

    if (!emailMessage.trim()) {
      emailMessage = `Please find attached the requested documents.`;
    }

    loading = true;
    generatedDocuments = [];

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

      for (let i = 0; i < selectedTemplates.length; i++) {
        const templateId = selectedTemplates[i];
        const template = availableTemplates.find((t) => t.id === templateId);
        if (!template) continue;

        // Update progress before generation
        generationProgress = {
          current: i,
          total: selectedTemplates.length,
          currentDocument: template.name,
        };

        // Add a small delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
       // Get selected order if available
       const selectedOrder = orders.find(o => o.id === selectedOrderId);

       // Map client data to template variables
       const templateData = mapClientDataToTemplate(client, selectedOrder);

          // Override with actual company name
          templateData.companyName = companyName;

          // Generate PDF document
           const result = await documentGenerationStore.generateDocument(
             templateId,
             templateData,
             "pdf",
             companyId,
             selectedOrderId || undefined,
           );

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
           // Error toast is now handled by the document generation store
         }
      }

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
      for (const customDocId of selectedCustomDocs) {
        const customDoc = customDocuments.find(doc => doc.id === customDocId);
        if (customDoc?.pdfUrl) {
          const storagePath = extractStoragePathFromUrl(customDoc.pdfUrl);
          if (storagePath) {
            try {
              const base64Content = await downloadFileAsBase64(storagePath);
              if (base64Content) {
                attachments.push({
                  filename: customDoc.name,
                  content: base64Content,
                  type: customDoc.fileType || "application/pdf",
                  encoding: "base64" as const,
                });
              }
            } catch (error) {
              console.error(`Failed to download custom document ${customDocId}:`, error);
              toast.error(`Failed to attach ${customDoc.name}`);
            }
          }
        }
      }

      // Send email with attachments
      console.log("📧 [DOCUMENT SEND MODAL] About to send email");
      console.log("📧 [DOCUMENT SEND MODAL] Attachments count:", attachments.length);
      console.log("📧 [DOCUMENT SEND MODAL] To:", clientEmail);
      console.log("📧 [DOCUMENT SEND MODAL] Subject:", emailSubject);
      
       const { emailService } = await import("$lib/services/emailService");

       // Check SMTP config using reactive state
       console.log("📧 [DOCUMENT SEND MODAL] SMTP Config available:", smtpConfigured);

        if (!smtpConfigured) {
          toast.error("SMTP configuration is required to send emails. Please <a href='/settings' class='underline hover:no-underline'>configure your email settings</a> before sending documents.");
          return;
        }

        // Get current SMTP config for email service
        const companyData = get(companyContext);
        const smtpConfig = companyData?.data?.smtpConfig;

       console.log("📧 [DOCUMENT SEND MODAL] Calling emailService.sendEmail...");
       await emailService.sendEmail({
         to: clientEmail,
         subject: emailSubject,
         htmlBody: emailMessage,
         attachments: attachments.length > 0 ? attachments : undefined,
       });
      
      console.log("📧 [DOCUMENT SEND MODAL] Email sent successfully");

      const totalDocuments =
        generatedDocuments.length + selectedCustomDocs.length;
      toast.success(
        `Successfully sent ${totalDocuments} document${totalDocuments > 1 ? "s" : ""} to ${clientName}`,
      );

      // Reset form
      selectedTemplates = [];
      selectedCustomDocs = [];
      emailSubject = "";
      emailMessage = "";
      generatedDocuments = [];
      generationProgress = { current: 0, total: 0, currentDocument: "" };
      open = false;

      onSendComplete?.();
    } catch (error) {
      console.error("Error sending documents:", error);
      toast.error("Failed to send documents");
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    selectedTemplates = [];
    selectedCustomDocs = [];
    emailSubject = "";
    emailMessage = "";
    generatedDocuments = [];
    generationProgress = { current: 0, total: 0, currentDocument: "" };
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
                     disabled={!client || previewLoading || (isOrderTypeTemplate(template) && !selectedOrderId)}
                   >
                     {previewLoading ? "Loading..." : "Preview"}
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onclick={() =>
                       downloadDocument(template.id, template.name, "pdf")}
                     disabled={!client || (isOrderTypeTemplate(template) && !selectedOrderId)}
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
          <p class="text-sm mb-4">
            Create templates in the Templates section to generate documents.
          </p>
          <Button variant="outline" onclick={generateSampleTemplates}>
            Generate Sample Templates
          </Button>
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
             (hasOrderTypeSelectedTemplates() && !selectedOrderId)}
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
