<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Badge } from '$lib/components/ui/badge';
  import FileUpload from './file-upload.svelte';
  import Icon from '@iconify/svelte';
  import type { GeneratedDocument, TemplatePlaceholder } from '$lib/types/document';

  interface Props {
    document: GeneratedDocument;
    placeholders: TemplatePlaceholder[];
    onSave?: (data: Record<string, any>) => void;
    onSubmit?: (data: Record<string, any>) => void;
    readonly?: boolean;
  }

  let { document, placeholders, onSave, onSubmit, readonly = false }: Props = $props();

  const dispatch = createEventDispatcher();

  let formData = $state<Record<string, any>>({ ...document.data });
  let isSubmitting = $state(false);

  function handleInputChange(key: string, value: any) {
    formData[key] = value;
  }

  function handleSave() {
    onSave?.(formData);
    dispatch('save', { documentId: document.id, data: formData });
  }

  async function handleSubmit() {
    isSubmitting = true;
    try {
      onSubmit?.(formData);
      dispatch('submit', { documentId: document.id, data: formData });
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Card class="w-full max-w-4xl mx-auto">
  <CardHeader>
    <div class="flex items-center justify-between">
      <div>
        <CardTitle class="flex items-center gap-2">
          <Icon icon="lucide:file-text" class="h-5 w-5" />
          Document Viewer
        </CardTitle>
        <CardDescription>
          Review and complete the required information for this document
        </CardDescription>
      </div>
      <Badge variant={document.status === 'completed' ? 'default' : 'secondary'}>
        {document.status}
      </Badge>
    </div>
  </CardHeader>

  <CardContent class="space-y-6">
    <!-- Document Preview -->
    {#if document.htmlContent}
      <div class="border rounded-lg p-4 bg-muted/50">
        <h3 class="text-sm font-medium mb-2">Document Preview</h3>
        <div class="max-h-60 overflow-y-auto text-sm">
          {@html document.htmlContent}
        </div>
      </div>
    {/if}

    <!-- Form Fields -->
    {#if placeholders && placeholders.length > 0}
      <div class="space-y-4">
        <h3 class="text-lg font-medium">Required Information</h3>
        <div class="grid gap-4 md:grid-cols-2">
          {#each placeholders as placeholder}
            <div class="col-span-1">
              {#if placeholder.type === 'text'}
                <div class="space-y-2">
                  <Label for={placeholder.key}>
                    {placeholder.label}
                    {#if placeholder.required}<span class="text-red-500">*</span>{/if}
                  </Label>
                  <Input
                    id={placeholder.key}
                    type="text"
                    value={formData[placeholder.key] || placeholder.defaultValue || ''}
                    placeholder={placeholder.label}
                    disabled={readonly}
                    required={placeholder.required}
                    oninput={(e) => handleInputChange(placeholder.key, (e.target as HTMLInputElement).value)}
                    class={placeholder.validation?.pattern ? 'valid-pattern' : ''}
                    pattern={placeholder.validation?.pattern}
                    minlength={placeholder.validation?.minLength}
                    maxlength={placeholder.validation?.maxLength}
                  />
                </div>
              {:else if placeholder.type === 'number'}
                <div class="space-y-2">
                  <Label for={placeholder.key}>
                    {placeholder.label}
                    {#if placeholder.required}<span class="text-red-500">*</span>{/if}
                  </Label>
                  <Input
                    id={placeholder.key}
                    type="number"
                    value={formData[placeholder.key] || placeholder.defaultValue || ''}
                    placeholder={placeholder.label}
                    disabled={readonly}
                    required={placeholder.required}
                    oninput={(e) => handleInputChange(placeholder.key, parseFloat((e.target as HTMLInputElement).value))}
                    min={placeholder.validation?.min}
                    max={placeholder.validation?.max}
                  />
                </div>
              {:else if placeholder.type === 'date'}
                <div class="space-y-2">
                  <Label for={placeholder.key}>
                    {placeholder.label}
                    {#if placeholder.required}<span class="text-red-500">*</span>{/if}
                  </Label>
                  <Input
                    id={placeholder.key}
                    type="date"
                    value={formData[placeholder.key] || placeholder.defaultValue || ''}
                    disabled={readonly}
                    required={placeholder.required}
                    oninput={(e) => handleInputChange(placeholder.key, (e.target as HTMLInputElement).value)}
                  />
                </div>
              {:else if placeholder.type === 'currency'}
                <div class="space-y-2">
                  <Label for={placeholder.key}>
                    {placeholder.label}
                    {#if placeholder.required}<span class="text-red-500">*</span>{/if}
                  </Label>
                  <Input
                    id={placeholder.key}
                    type="number"
                    step="0.01"
                    value={formData[placeholder.key] || placeholder.defaultValue || ''}
                    placeholder="0.00"
                    disabled={readonly}
                    required={placeholder.required}
                    oninput={(e) => handleInputChange(placeholder.key, parseFloat((e.target as HTMLInputElement).value))}
                    min={placeholder.validation?.min || 0}
                  />
                </div>
              {:else if placeholder.type === 'boolean'}
                <div class="flex items-center space-x-2">
                  <Checkbox
                    id={placeholder.key}
                    bind:checked={formData[placeholder.key]}
                    disabled={readonly}
                  />
                  <Label for={placeholder.key}>
                    {placeholder.label}
                    {#if placeholder.required}<span class="text-red-500">*</span>{/if}
                  </Label>
                </div>
              {:else}
                <div class="space-y-2">
                  <Label for={placeholder.key}>
                    {placeholder.label}
                    {#if placeholder.required}<span class="text-red-500">*</span>{/if}
                  </Label>
                  <Textarea
                    id={placeholder.key}
                    value={formData[placeholder.key] || placeholder.defaultValue || ''}
                    placeholder={placeholder.label}
                    disabled={readonly}
                    required={placeholder.required}
                    oninput={(e) => handleInputChange(placeholder.key, (e.target as HTMLTextAreaElement).value)}
                    minlength={placeholder.validation?.minLength}
                    maxlength={placeholder.validation?.maxLength}
                  />
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- File Upload Section (for completed documents) -->
    {#if document.status === 'sent' || document.status === 'viewed'}
      <div class="space-y-4">
        <h3 class="text-lg font-medium">Upload Completed Document</h3>
        <FileUpload
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          multiple={false}
          maxSize={10}
          disabled={readonly}
          fileName={`completed-${document.id}`}
          on:upload={(event) => {
            const { results } = event.detail;
            // Handle successful upload
            console.log('Upload results:', results);
            // You could update the document with the uploaded file URLs here
          }}
        />
      </div>
    {/if}

    <!-- Action Buttons -->
    {#if !readonly}
      <div class="flex gap-3 pt-4 border-t">
        {#if onSave}
          <Button variant="outline" onclick={handleSave}>
            <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
            Save Progress
          </Button>
        {/if}

        {#if onSubmit && (document.status === 'sent' || document.status === 'viewed')}
          <Button
            onclick={handleSubmit}
            disabled={isSubmitting}
            class="ml-auto"
          >
            {#if isSubmitting}
              <Icon icon="lucide:loader-2" class="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            {:else}
              <Icon icon="lucide:send" class="h-4 w-4 mr-2" />
              Submit Document
            {/if}
          </Button>
        {/if}
      </div>
    {/if}
  </CardContent>
</Card>

<style>
  .valid-pattern:valid {
    border-color: rgb(34 197 94);
  }

  .valid-pattern:invalid:not(:placeholder-shown) {
    border-color: rgb(239 68 68);
  }
</style>