<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import DashboardLayout from '$lib/components/shared/dashboard-layout.svelte';
  import TemplateEditor from '$lib/components/shared/template-editor.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select/index.js';
  import { toast } from 'svelte-sonner';

  import Icon from '@iconify/svelte';
  import { requireCompany } from '$lib/utils/auth';
  import { documentTemplatesStore } from '$lib/stores/documentTemplates';
  import type { DocumentTemplate } from '$lib/types/document';

  let mounted = $state(false);
  let searchQuery = $state('');
  let selectedType = $state('all');
  let showSampleDialog = $state(false);

  // Sample templates for quick copy
  const sampleTemplates = [
    {
      id: "sample-invoice",
      name: "Standard Invoice Template",
      description: "Professional invoice template with automatic company branding (logo and stamp)",
      type: "invoice",
      htmlContent: `
        <div class="invoice-container">
          <header class="invoice-header">
            <div class="company-logo" style="text-align: center; margin-bottom: 20px;">
              <img src="{{companyLogo}}" alt="Company Logo" style="max-width: 200px; max-height: 100px;" />
            </div>

            <!-- ZATCA QR Code -->
            {{#if zatcaQRCode}}
            <div class="zatca-qr-code" style="position: absolute; bottom: 20px; right: 20px; width: 100px; height: 100px;">
              <img src="data:image/png;base64,{{zatcaQRCode}}" alt="ZATCA QR Code" style="width: 100%; height: 100%;" />
            </div>
            {{/if}}
            <h1>Invoice</h1>
            <div class="company-info">
              <h2>{{companyName}}</h2>
              <p>Invoice #: {{invoiceNumber}}</p>
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

          <table class="invoice-table">
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

          <footer class="invoice-footer">
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
        { key: "invoiceNumber", label: "Invoice Number", type: "text", required: true },
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
        { key: "zatcaQRCode", label: "ZATCA QR Code (Base64)", type: "text", required: false },
      ],
      tags: ["invoice", "professional"]
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

  let templates = documentTemplatesStore;

  let filteredTemplates = $derived((): DocumentTemplate[] => {
    if (!$templates.data) return [];

    return $templates.data.filter((template: DocumentTemplate) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || template.type === selectedType;

      return matchesSearch && matchesType;
    });
  });



  function handleTemplatePreview(template: DocumentTemplate) {
    // TODO: Show preview modal
    console.log('Preview template:', template);
  }

  function handleEditTemplate(template: DocumentTemplate) {
    // TODO: Open edit dialog
    console.log('Edit template:', template);
  }

  function handleDeleteTemplate(template: DocumentTemplate) {
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      // TODO: Delete template from Firebase
      console.log('Delete template:', template);
      // Refresh templates list
     templates = documentTemplatesStore;
    }
  }

  async function handleCopySampleTemplate(template: any) {
    try {
      // Copy template data to clipboard as JSON
      const templateData = {
        name: template.name,
        description: template.description,
        type: template.type,
        htmlContent: template.htmlContent.trim(),
        placeholders: template.placeholders,
        tags: template.tags
      };

      await navigator.clipboard.writeText(JSON.stringify(templateData, null, 2));
      toast.success(`"${template.name}" copied to clipboard!`);
      showSampleDialog = false;
    } catch (error) {
      toast.error('Failed to copy template');
      console.error('Copy error:', error);
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'invoice': return 'bg-blue-100 text-blue-800';
      case 'legal': return 'bg-red-100 text-red-800';
      case 'business': return 'bg-green-100 text-green-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

{#if mounted}
  <DashboardLayout title="Document Templates" description="Create and manage HTML templates for invoices and documents">
    <!-- Header Actions -->
      <div class="flex justify-between items-center">
        <div class="flex gap-4">
          <Input
            bind:value={searchQuery}
            placeholder="Search templates..."
            class="w-64"
          />
          <Select type="single" value={selectedType} onValueChange={(v) => selectedType = v}>
            <SelectTrigger class="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex gap-2">
          <Dialog bind:open={showSampleDialog}>
            <DialogTrigger>
              <Button variant="outline" onclick={() => showSampleDialog = true}>
                <Icon icon="lucide:copy" class="h-4 w-4 mr-2" />
                Sample Templates
              </Button>
            </DialogTrigger>
            <DialogContent class="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Sample Templates</DialogTitle>
                <DialogDescription>
                  Choose from pre-built templates to get started quickly. Click "Copy" to copy the template data to your clipboard.
                </DialogDescription>
              </DialogHeader>
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
                        onclick={() => handleCopySampleTemplate(template)}
                      >
                        <Icon icon="lucide:copy" class="h-3 w-3 mr-1" />
                        Copy Template
                      </Button>
                    </CardContent>
                  </Card>
                {/each}
              </div>
            </DialogContent>
          </Dialog>

          <Button onclick={() => goto('/templates/create')}>
            <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
            Create Template
          </Button>
    </div>

    <!-- Templates Grid -->
    {#if $templates.loading}
      <div class="text-center py-8">Loading templates...</div>
    {:else if filteredTemplates.length === 0}
      <Card>
        <CardContent class="text-center py-8">
          <Icon icon="lucide:file-text" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 class="text-lg font-medium mb-2">No templates found</h3>
          <p class="text-muted-foreground mb-4">
            {searchQuery || selectedType !== 'all' ? 'Try adjusting your search or filters.' : 'Create your first document template to get started.'}
          </p>
          {#if !searchQuery && selectedType === 'all'}
            <Button onclick={() => goto('/templates/create')}>
              <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
              Create Template
            </Button>
          {/if}
        </CardContent>
      </Card>
    {:else}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         {#each filteredTemplates() as template (template.id)}
          <Card class="hover:shadow-md transition-shadow">
            <CardHeader>
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <CardTitle class="text-lg">{template.name}</CardTitle>
                  <CardDescription class="mt-1">
                    {template.description || 'No description'}
                  </CardDescription>
                </div>
                <Badge class={getTypeColor(template.type)}>
                  {template.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Icon icon="lucide:code" class="h-4 w-4 mr-2" />
                  {template.placeholders.length} placeholders
                </div>
                <div class="flex items-center text-sm text-muted-foreground">
                  <Icon icon="lucide:clock" class="h-4 w-4 mr-2" />
                  v{template.version}
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

              <div class="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onclick={() => handleTemplatePreview(template)}>
                  <Icon icon="lucide:eye" class="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onclick={() => handleEditTemplate(template)}>
                  <Icon icon="lucide:edit" class="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onclick={() => handleDeleteTemplate(template)}>
                  <Icon icon="lucide:trash" class="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    {/if}
  </DashboardLayout>
{/if}