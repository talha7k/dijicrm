<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Select from '$lib/components/ui/select/index.js';
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import Icon from '@iconify/svelte';
  import { validateTemplate, generatePreviewData, renderTemplate } from '$lib/utils/template-validation';
  import AlertDialog from './alert-dialog.svelte';
  import ConfirmDialog from './confirm-dialog.svelte';

  const dispatch = createEventDispatcher();

  interface Props {
    template?: any;
  }

  let { template: initialTemplate }: Props = $props();

  let template = $state(initialTemplate || {
    id: '',
    companyId: '',
    name: '',
    description: '',
    type: 'custom',
    htmlContent: '',
    placeholders: [],
    isActive: true,
    version: 1,
    createdBy: '',
    createdAt: null,
    updatedAt: null,
    tags: []
  });

  let htmlEditor = $state(template.htmlContent || '');
  let previewMode = $state(false);
  let showPreviewModal = $state(false);
  let showAlertDialog = $state(false);
  let showConfirmDialog = $state(false);
  let alertTitle = $state('');
  let alertMessage = $state('');
  let confirmTitle = $state('');
  let confirmMessage = $state('');

  const onconfirm = () => {
    const updatedTemplate = {
      ...template,
      htmlContent: htmlEditor,
      updatedAt: new Date(),
      type: template.type as 'custom' | 'order' | 'legal' | 'business'
    };
    dispatch('save', updatedTemplate);
  };

  function handleSave() {
    const updatedTemplate = {
      ...template,
      htmlContent: htmlEditor,
      updatedAt: new Date(),
      type: template.type as 'custom' | 'order' | 'legal' | 'business'
    };

    // Validate before saving
    const validation = validateTemplate(updatedTemplate);
    if (!validation.isValid) {
      alertTitle = 'Validation Errors';
      alertMessage = validation.errors.join('\n');
      showAlertDialog = true;
      return;
    }

    if (validation.warnings.length > 0) {
      confirmTitle = 'Warnings Found';
      confirmMessage = validation.warnings.join('\n') + '\n\nSave anyway?';
      showConfirmDialog = true;
      return;
    }

    dispatch('save', updatedTemplate);
  }



  async function handlePreview() {
    await generatePreviewHtml();
    showPreviewModal = true;
  }

  let previewHtml = $state('');

  async function generatePreviewHtml() {
    const previewTemplate = {
      ...template,
      htmlContent: htmlEditor,
      type: template.type as 'custom' | 'order' | 'legal' | 'business'
    };

    try {
      const previewData = await generatePreviewData(previewTemplate);
      previewHtml = renderTemplate(previewTemplate, previewData);
    } catch (error) {
      console.error('Error generating preview:', error);
      previewHtml = '<div class="text-red-500 p-4">Error generating preview</div>';
    }
  }

  // Generate preview when component mounts or when preview mode is toggled
  $effect(() => {
    if (previewMode) {
      generatePreviewHtml();
    }
  });
</script>

<div class="space-y-6">
  <!-- Template Header -->
  <Card>
    <CardHeader>
      <CardTitle>Create New Template</CardTitle>
      <CardDescription>
        Create HTML templates with dynamic placeholders for document generation
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label for="template-name">Template Name</Label>
          <Input
            id="template-name"
            bind:value={template.name}
            placeholder="e.g., Professional Invoice Template"
          />
        </div>
        <div>
          <Label for="template-type">Template Type</Label>
          <Select.Root type="single" bind:value={template.type}>
            <Select.Trigger class="w-full">
              {template.type ? template.type.charAt(0).toUpperCase() + template.type.slice(1) + (template.type === "legal" ? " Document" : template.type === "business" ? " Document" : "") : "Select template type"}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="order">Invoice</Select.Item>
              <Select.Item value="legal">Legal Document</Select.Item>
              <Select.Item value="business">Business Document</Select.Item>
              <Select.Item value="custom">Custom</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <div>
        <Label for="template-description">Description (Optional)</Label>
        <Textarea
          id="template-description"
          bind:value={template.description}
          placeholder="Brief description of this template"
          rows={2}
        />
      </div>
    </CardContent>
  </Card>

  <!-- HTML Editor -->
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>HTML Template</CardTitle>
          <CardDescription>
            Write HTML with placeholders. Use {'{{placeholderKey}}'} syntax.
          </CardDescription>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" onclick={() => previewMode = !previewMode}>
            <Icon icon="lucide:eye" class="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" onclick={handlePreview}>
            <Icon icon="lucide:play" class="h-4 w-4 mr-2" />
            Preview Document
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {#if previewMode}
        <div class="border rounded p-4 bg-muted/50 relative min-h-[600px]">
          {@html previewHtml}
        </div>
      {:else}
        <Textarea
          bind:value={htmlEditor}
          placeholder="Enter your HTML template here..."
          rows={20}
          class="font-mono text-sm"
        />
      {/if}
    </CardContent>
  </Card>

  <!-- Actions -->
  <div class="flex justify-end gap-2">
    <Button variant="outline" onclick={() => dispatch('cancel')}>
      Cancel
    </Button>
    <Button onclick={handleSave}>
      <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
      Create Template
    </Button>
  </div>

  <!-- Preview Modal -->
  <Dialog bind:open={showPreviewModal}>
    <DialogContent class="max-w-4xl max-h-[80vh] overflow-auto">
      <DialogHeader>
        <DialogTitle>Document Preview</DialogTitle>
        <DialogDescription>
          Preview of how the document will appear when generated
        </DialogDescription>
      </DialogHeader>
      <div class="mt-4">
        <div class="border rounded-lg p-6 bg-white shadow-sm min-h-[600px] relative">
          <style>
            .order-container { max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; }
            .order-header { margin-bottom: 30px; }
            .company-info h2 { margin: 0 0 10px 0; font-size: 18px; }
            .company-info p { margin: 5px 0; }
            .billing-info { margin-bottom: 30px; }
            .bill-to h3 { margin: 0 0 10px 0; font-size: 16px; }
            .order-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .order-table th, .order-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .order-table th { background-color: #f5f5f5; font-weight: bold; }
            .totals { text-align: right; margin-bottom: 30px; }
            .total-row { margin-bottom: 5px; }
            .total-row.total { font-weight: bold; font-size: 18px; }
            .order-footer { margin-top: 40px; text-align: center; }
          </style>
          {@html generatePreviewHtml()}
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- Alert Dialog -->
  <AlertDialog
    bind:open={showAlertDialog}
    title={alertTitle}
    message={alertMessage}
    type="error"
  />

  <!-- Confirm Dialog -->
  <ConfirmDialog
    bind:open={showConfirmDialog}
    title={confirmTitle}
    message={confirmMessage}
    type="warning"
    {onconfirm}
  />
</div>