<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import DashboardLayout from '$lib/components/shared/dashboard-layout.svelte';
  import TemplateEditor from '$lib/components/shared/template-editor.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { toast } from 'svelte-sonner';
  import Icon from '@iconify/svelte';
  import { requireCompany } from '$lib/utils/auth';
  import { documentTemplatesStore } from '$lib/stores/documentTemplates';
  import { auth } from '$lib/firebase';
  import type { DocumentTemplate } from '$lib/types/document';

  let mounted = $state(false);
  let showEditor = $state(false);
  let selectedTemplate = $state<DocumentTemplate | null>(null);

  // Sample templates for quick start
  const sampleTemplates = [
    {
      id: "sample-order",
      name: "Standard Invoice Template",
      description: "Professional order template with automatic company branding (logo and stamp)",
      type: "order",
       htmlContent: `
        <div class="order-container" style="position: relative;">
          <header class="order-header">
            <div class="company-logo" style="text-align: center; margin-bottom: 20px;">
              <img src="{{companyLogo}}" alt="Company Logo" style="max-width: 200px; max-height: 100px;" />
            </div>

            <!-- ZATCA QR Code -->
            {{#if zatcaQRCode}}
            <div class="zatca-qr-code" style="position: absolute; top: 20px; right: 20px; width: 100px; height: 100px;">
              <img src="{{zatcaQRCode}}" alt="ZATCA QR Code" style="width: 100%; height: 100%;" />
            </div>
            {{/if}}
            <h1>Invoice</h1>
            <div class="company-info">
              <h2>{{companyName}}</h2>
              <p>Invoice #: {{orderNumber}}</p>
              <p>Date: {{date}}</p>
              <p>Due Date: {{dueDate}}</p>
            </div>
          </header>

          <div class="billing-info">
            <div class="bill-to">
              <h3>Bill To:</h3>
              <p>{{clientName}}</p>
              <p>{{clientEmail}}</p>
            </div>
          </div>

          <table class="order-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {{#each items}}
              <tr>
                <td>{{description}}</td>
                <td>{{quantity}}</td>
                <td>{{formatCurrency rate}}</td>
                <td>{{formatCurrency (multiply quantity rate)}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>{{formatCurrency subtotal}}</span>
            </div>
            {{#if taxRate}}
            <div class="total-row">
              <span>Tax ({{taxRate}}%):</span>
              <span>{{formatCurrency taxAmount}}</span>
            </div>
            {{/if}}
            <div class="total-row total">
              <span>Total:</span>
              <span>{{formatCurrency total}}</span>
            </div>
          </div>

          <footer class="order-footer">
            <div class="company-stamp" style="text-align: center; margin-top: 40px;">
              <img src="{{companyStamp}}" alt="Company Stamp" style="max-width: 150px; max-height: 150px;" />
            </div>
            <p>Thank you for your business!</p>
            <p>Payment terms: {{paymentTerms}}</p>
          </footer>
        </div>
      `,
      placeholders: [
        { key: "companyLogo", label: "Company Logo URL", type: "image", required: true },
        { key: "companyStamp", label: "Company Stamp URL", type: "image", required: false },
        { key: "companyName", label: "Company Name", type: "text", required: true },
        { key: "orderNumber", label: "Invoice Number", type: "text", required: true },
        { key: "date", label: "Invoice Date", type: "date", required: true },
        { key: "dueDate", label: "Due Date", type: "date", required: true },
        { key: "clientName", label: "Client Name", type: "text", required: true },
        { key: "clientEmail", label: "Client Email", type: "text", required: true },
        { key: "items", label: "Invoice Items", type: "text", required: true },
        { key: "subtotal", label: "Subtotal", type: "number", required: true },
        { key: "taxRate", label: "Tax Rate (%)", type: "number", required: false },
        { key: "taxAmount", label: "Tax Amount", type: "number", required: false },
        { key: "total", label: "Total Amount", type: "number", required: true },
        { key: "paymentTerms", label: "Payment Terms", type: "text", required: false },
        { key: "zatcaQRCode", label: "ZATCA QR Code (Base64)", type: "image", required: false },
      ],
      tags: ["order", "professional"]
    },
    {
      id: "sample-contract",
      name: "Service Agreement Template",
      description: "Standard service agreement with customizable terms and conditions",
      type: "business",
      htmlContent: `
        <div class="contract-container">
          <header class="contract-header">
            <h1>Service Agreement</h1>
            <div class="parties">
              <div class="party">
                <h3>Service Provider:</h3>
                <p>{{companyName}}</p>
                <p>{{companyAddress}}</p>
              </div>
              <div class="party">
                <h3>Client:</h3>
                <p>{{clientName}}</p>
                <p>{{clientAddress}}</p>
              </div>
            </div>
          </header>

          <div class="contract-body">
            <h2>1. Services</h2>
            <p>{{servicesDescription}}</p>

            <h2>2. Payment Terms</h2>
            <p>Total Amount: {{formatCurrency totalAmount}}</p>
            <p>Payment Schedule: {{paymentSchedule}}</p>

            <h2>3. Term</h2>
            <p>Start Date: {{startDate}}</p>
            <p>End Date: {{endDate}}</p>

            <h2>4. Signatures</h2>
            <div class="signatures">
              <div class="signature">
                <p>Service Provider: ___________________________</p>
                <p>Date: _______________</p>
              </div>
              <div class="signature">
                <p>Client: ___________________________</p>
                <p>Date: _______________</p>
              </div>
            </div>
          </div>
        </div>
      `,
      placeholders: [
        { key: "companyName", label: "Company Name", type: "text", required: true },
        { key: "companyAddress", label: "Company Address", type: "text", required: true },
        { key: "clientName", label: "Client Name", type: "text", required: true },
        { key: "clientAddress", label: "Client Address", type: "text", required: true },
        { key: "servicesDescription", label: "Services Description", type: "text", required: true },
        { key: "totalAmount", label: "Total Amount", type: "number", required: true },
        { key: "paymentSchedule", label: "Payment Schedule", type: "text", required: true },
        { key: "startDate", label: "Start Date", type: "date", required: true },
        { key: "endDate", label: "End Date", type: "date", required: true },
      ],
      tags: ["contract", "service-agreement"]
    },
    {
      id: "sample-power-of-attorney",
      name: "Power of Attorney Template",
      description: "Legal power of attorney document template",
      type: "legal",
      htmlContent: `
        <div class="legal-document">
          <header class="document-header">
            <h1>Power of Attorney</h1>
            <p>This Power of Attorney is made on {{date}} by:</p>
          </header>

          <div class="document-body">
            <div class="principal-info">
              <h3>Principal (Grantor):</h3>
              <p>Name: {{principalName}}</p>
              <p>Address: {{principalAddress}}</p>
            </div>

            <div class="attorney-info">
              <h3>Attorney-in-Fact:</h3>
              <p>Name: {{attorneyName}}</p>
              <p>Address: {{attorneyAddress}}</p>
            </div>

            <div class="powers-granted">
              <h3>Powers Granted:</h3>
              <p>{{powers}}</p>
            </div>

            <div class="signatures">
              <div class="signature-block">
                <p>Principal: ___________________________</p>
                <p>Date: {{date}}</p>
              </div>
              <div class="signature-block">
                <p>Attorney-in-Fact: ___________________________</p>
                <p>Date: {{date}}</p>
              </div>
            </div>
          </div>
        </div>
      `,
      placeholders: [
        { key: "date", label: "Document Date", type: "date", required: true },
        { key: "principalName", label: "Principal Name", type: "text", required: true },
        { key: "principalAddress", label: "Principal Address", type: "text", required: true },
        { key: "attorneyName", label: "Attorney Name", type: "text", required: true },
        { key: "attorneyAddress", label: "Attorney Address", type: "text", required: true },
        { key: "powers", label: "Powers Granted", type: "text", required: true },
      ],
      tags: ["legal", "power-of-attorney"]
    }
  ];

   onMount(() => {
     mounted = true;
     // Company access is checked at layout level
   });

  function handleUseSampleTemplate(template: any) {
    selectedTemplate = {
      id: '',
      companyId: '',
      name: template.name,
      description: template.description,
      type: template.type,
      htmlContent: template.htmlContent.trim(),
      placeholders: template.placeholders,
      isActive: true,
      version: 1,
      createdBy: '',
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      tags: template.tags
    };
    showEditor = true;
  }

  function handleCreateBlank() {
    selectedTemplate = null;
    showEditor = true;
  }

  async function handleTemplateSave(template: DocumentTemplate) {
    try {
      console.log('Saving template:', template);
      
      // Clean up the template data before saving
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }

      const templateData = {
        name: template.name,
        description: template.description,
        type: template.type,
        htmlContent: template.htmlContent,
        placeholders: template.placeholders || [],
        isActive: template.isActive ?? true,
        version: template.version ?? 1,
        tags: template.tags || [],
        createdBy: userId
      };

      console.log('Cleaned template data:', templateData);

      if (template.id && template.id !== '') {
        // Update existing template
        console.log('Updating existing template:', template.id);
        await documentTemplatesStore.updateTemplate(template.id, templateData);
        toast.success('Template updated successfully!');
      } else {
        // Create new template
        console.log('Creating new template');
        const templateId = await documentTemplatesStore.createTemplate(templateData);
        console.log('Template created with ID:', templateId);
        toast.success('Template created successfully!');
      }
      // Navigate back to templates list
      goto('/templates');
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

function handleTemplatePreview(template: DocumentTemplate) {
     // Preview is handled internally by TemplateEditor component
     console.log('Preview template:', template);
   }

  function handleCancel() {
    if (showEditor) {
      showEditor = false;
      selectedTemplate = null;
    } else {
      goto('/templates');
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-800';
      case 'legal': return 'bg-red-100 text-red-800';
      case 'business': return 'bg-green-100 text-green-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

{#if mounted}
  {#if showEditor}
    <TemplateEditor
      template={selectedTemplate}
      on:save={(e) => handleTemplateSave(e.detail)}
      on:preview={(e) => handleTemplatePreview(e.detail)}
      on:cancel={handleCancel}
    />
  {:else}
    <DashboardLayout title="Create Template" description="Choose a template to start with or create from scratch">
      <div class="space-y-6">
        <!-- Create Blank Template -->
        <Card>
          <CardHeader>
            <CardTitle>Start from Scratch</CardTitle>
            <CardDescription>Create a completely custom template</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onclick={handleCreateBlank}>
              <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
              Create Blank Template
            </Button>
          </CardContent>
        </Card>

        <!-- Sample Templates -->
        <div>
          <h2 class="text-xl font-semibold mb-4">Sample Templates</h2>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each sampleTemplates as template}
              <Card class="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <CardTitle class="text-base">{template.name}</CardTitle>
                      <CardDescription class="mt-1 text-sm">
                        {template.description}
                      </CardDescription>
                    </div>
                    <Badge class={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div class="space-y-2">
                    <div class="flex items-center text-xs text-muted-foreground">
                      <Icon icon="lucide:code" class="h-3 w-3 mr-1" />
                      {template.placeholders.length} placeholders
                    </div>
                    {#if template.tags && template.tags.length > 0}
                      <div class="flex flex-wrap gap-1">
                        {#each template.tags as tag}
                          <Badge variant="outline" class="text-xs">
                            {tag}
                          </Badge>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  <Button
                    size="sm"
                    class="w-full mt-3"
                    onclick={() => handleUseSampleTemplate(template)}
                  >
                    <Icon icon="lucide:edit" class="h-3 w-3 mr-1" />
                    Use This Template
                  </Button>
                </CardContent>
              </Card>
            {/each}
          </div>
        </div>
      </div>
    </DashboardLayout>
  {/if}
{/if}