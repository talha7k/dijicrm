<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select/index.js';
  import Icon from '@iconify/svelte';
  import { validateTemplate, generatePreviewData, renderTemplate } from '$lib/utils/template-validation';

  const dispatch = createEventDispatcher();

  let template: any = {
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
  };

  let htmlEditor = $state('');
  let previewMode = $state(false);

  function handleSave() {
    const updatedTemplate = {
      ...template,
      htmlContent: htmlEditor,
      updatedAt: new Date(),
      type: template.type as 'custom' | 'invoice' | 'legal' | 'business'
    };

    // Validate before saving
    const validation = validateTemplate(updatedTemplate);
    if (!validation.isValid) {
      alert('Validation errors:\n' + validation.errors.join('\n'));
      return;
    }

    if (validation.warnings.length > 0) {
      const proceed = confirm('Warnings found:\n' + validation.warnings.join('\n') + '\n\nSave anyway?');
      if (!proceed) return;
    }

    dispatch('save', updatedTemplate);
  }

  function handlePreview() {
    const previewTemplate = {
      ...template,
      htmlContent: htmlEditor,
      type: template.type as 'custom' | 'invoice' | 'legal' | 'business'
    };

    dispatch('preview', previewTemplate);
  }

  function generatePreviewHtml() {
    const previewTemplate = {
      ...template,
      htmlContent: htmlEditor,
      type: template.type as 'custom' | 'invoice' | 'legal' | 'business'
    };

    const previewData = generatePreviewData(previewTemplate);
    return renderTemplate(previewTemplate, previewData);
  }
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
          <Select type="single" bind:value={template.type}>
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Select template type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="legal">Legal Document</SelectItem>
              <SelectItem value="business">Business Document</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
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
        <div class="border rounded p-4 bg-muted/50">
          {@html generatePreviewHtml()}
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
</div>