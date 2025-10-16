<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { documentTemplatesStore } from "$lib/stores/documentTemplates";
  import { clientDocumentsStore } from "$lib/stores/clientDocuments";
  import { documentGenerationStore } from "$lib/stores/documentGeneration";
import { clientManagementStore } from "$lib/stores/clientManagement";
import { companyContext } from "$lib/stores/companyContext";
import { get } from "svelte/store";
import { mapClientDataToTemplate } from "$lib/utils/client-data-mapping";
import { authenticatedFetch } from "$lib/utils/api";
  import type { UserProfile } from "$lib/types/user";
  import { toast } from "svelte-sonner";

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
  let emailSubject = $state("");
  let emailMessage = $state("");
  let loading = $state(false);

  // Client data and generated documents
  let client = $state<UserProfile | null>(null);
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

  // Template data from store
  let availableTemplates = $state<
    { id: string; name: string; description: string }[]
  >([]);

  // Custom documents from store
  let customDocuments = $state<
    { id: string; name: string; uploadedAt: Date }[]
  >([]);

  // Load data when modal opens
  $effect(() => {
    if (open) {
      // Subscribe to templates store
      const unsubscribeTemplates = documentTemplatesStore.subscribe((state) => {
        availableTemplates = state.data.map((template) => ({
          id: template.id,
          name: template.name,
          description: template.description || "",
        }));
      });

      // Subscribe to client documents store
      const unsubscribeDocuments = clientDocumentsStore.subscribe((state) => {
        customDocuments = state.documents.map((doc) => ({
          id: doc.id,
          name:
            doc.data?.documentName ||
            doc.data?.title ||
            `Document ${doc.id.slice(-6)}`,
          uploadedAt: doc.generatedAt?.toDate() || new Date(),
        }));
      });

      // Subscribe to client management store to get client data
      const unsubscribeClient = clientManagementStore.subscribe((state) => {
        client = state.clients.find((c) => c.uid === clientId) || null;
      });

      // Load templates and client documents
      documentTemplatesStore.loadTemplates();
      clientDocumentsStore.loadClientDocuments(clientId);

      return () => {
        unsubscribeTemplates();
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

  async function handlePreview(templateId: string) {
    if (!client) {
      toast.error("Client data not available");
      return;
    }

    previewLoading = true;
    try {
      const template = availableTemplates.find((t) => t.id === templateId);
      if (!template) return;

      // Get company information
      const companyId = get(companyContext).data?.companyId;
      const companyName =
        get(companyContext).data?.company?.name || "Your Company";

      // Map client data to template variables
      const templateData = mapClientDataToTemplate(client);

      // Override with actual company name
      templateData.companyName = companyName;

      // Generate HTML preview
      const result = await documentGenerationStore.previewDocument(
        templateId,
        templateData,
        companyId,
      );

      previewDocument = {
        id: templateId,
        name: template.name,
        content: result.content,
      };
      showPreview = true;
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

      // Map client data to template variables
      const templateData = mapClientDataToTemplate(client);
      templateData.companyName = companyName;

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
      for (const templateId of selectedTemplates) {
        const template = availableTemplates.find((t) => t.id === templateId);
        if (!template) continue;

        try {
          // Map client data to template variables
          const templateData = mapClientDataToTemplate(client);

          // Override with actual company name
          templateData.companyName = companyName;

          // Generate PDF document
          const result = await documentGenerationStore.generateDocument(
            templateId,
            templateData,
            "pdf",
            companyId,
          );

          generatedDocuments.push({
            id: templateId,
            name: `${template.name}.pdf`,
            content: result.content,
            format: "pdf",
          });
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
        // Custom documents would need to be fetched and attached here
        // For now, we'll just reference them by ID
      ];

      // Send email with attachments
      const { emailService } = await import("$lib/services/emailService");

      await emailService.sendEmail({
        to: clientEmail,
        subject: emailSubject,
        htmlBody: emailMessage,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

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
    closePreview();
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
      <!-- Debug Info (don't remove until told) -->
      <div class="p-3 bg-card rounded text-xs">
        <p><strong>Debug Info:</strong></p>
        <p>Client loaded: {client ? "Yes" : "No"}</p>
        <p>Templates available: {availableTemplates.length}</p>
        <p>Custom documents: {customDocuments.length}</p>
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
                  onchange={() =>
                    handleTemplateToggle(template.id, !isSelected)}
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
                    disabled={!client || previewLoading}
                  >
                    {previewLoading ? "Loading..." : "Preview"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() =>
                      downloadDocument(template.id, template.name, "pdf")}
                    disabled={!client}
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

      <!-- Document Preview Modal -->
      {#if showPreview && previewDocument}
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <Card.Title class="text-base"
                >Preview: {previewDocument.name}</Card.Title
              >
              <div class="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() =>
                    previewDocument &&
                    downloadDocument(
                      previewDocument.id,
                      previewDocument.name,
                      "html",
                    )}
                >
                  Download HTML
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() =>
                    previewDocument &&
                    downloadDocument(
                      previewDocument.id,
                      previewDocument.name,
                      "pdf",
                    )}
                >
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" onclick={closePreview}>
                  Close Preview
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <div class="max-h-96 overflow-y-auto border rounded p-4 bg-white">
              {@html previewDocument.content}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}

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

    <Dialog.Footer>
      <Button variant="outline" onclick={handleCancel} disabled={loading}>
        Cancel
      </Button>
      <Button
        onclick={handleSend}
        disabled={loading ||
          (selectedTemplates.length === 0 && selectedCustomDocs.length === 0)}
      >
        {loading ? "Sending..." : "Send Documents"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
