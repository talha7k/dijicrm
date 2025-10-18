<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import Icon from '@iconify/svelte';
  import { validateBasicTemplate } from '$lib/utils/basicTemplateValidation';
import type { DocumentTemplate } from '$lib/types/document';
  import VariableReference from './variable-reference.svelte';
  import CssTextareas from './css-textareas.svelte';

  interface Props {
    initialContent?: string;
    initialScreenCss?: string;
    initialPrintCss?: string;
    showVariableReference?: boolean;
    showCssEditor?: boolean;
  }

  let {
    initialContent = '',
    initialScreenCss = '',
    initialPrintCss = '',
    showVariableReference = true,
    showCssEditor = true
  }: Props = $props();

  let htmlContent = $state(initialContent);
  let screenCss = $state(initialScreenCss);
  let printCss = $state(initialPrintCss);
  let previewMode = $state(false);
  let printPreviewMode = $state(false);
  let zoomLevel = $state(1);
  let validationErrors = $state<string[]>([]);
  let validationWarnings = $state<string[]>([]);

  // Example template for placeholder
  const exampleTemplate = `Enter your HTML template here...
Example:
<div class='invoice'>
  <h1>Invoice {{orderNumber}}</h1>
  <p>Date: {{currentDate}}</p>
  <p>Total: {{totalAmount}} {{currency}}</p>
</div>`;

  // Validate content on change
  $effect(() => {
    if (htmlContent) {
      // Simple validation without requiring full DocumentTemplate
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!htmlContent.trim()) {
        errors.push('HTML content is required');
      }

      if (htmlContent.length > 100000) {
        errors.push('HTML content is too long (maximum 100,000 characters)');
      }

      // Check for basic HTML structure
      if (!htmlContent.includes('<') || !htmlContent.includes('>')) {
        warnings.push('Content does not appear to contain HTML tags');
      }

      // Check for potentially dangerous content
      const dangerousPatterns = [
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
      ];

      dangerousPatterns.forEach((pattern) => {
        if (pattern.test(htmlContent)) {
          errors.push('HTML contains potentially dangerous content');
        }
      });

      validationErrors = errors;
      validationWarnings = warnings;
    } else {
      validationErrors = [];
      validationWarnings = [];
    }
  });

  function togglePreview() {
    previewMode = !previewMode;
    printPreviewMode = false;
  }

  function togglePrintPreview() {
    printPreviewMode = !printPreviewMode;
    previewMode = false;
  }

  function zoomIn() {
    if (zoomLevel < 2) {
      zoomLevel += 0.25;
    }
  }

  function zoomOut() {
    if (zoomLevel > 0.5) {
      zoomLevel -= 0.25;
    }
  }

  function resetZoom() {
    zoomLevel = 1;
  }

  // Reactive preview HTML with variable replacement
  let previewHtml = $state('');

  function updatePreview() {
    if (!htmlContent) {
      previewHtml = '';
      return;
    }

    // Basic variable replacement for preview
    let preview = htmlContent;

    // Replace common system variables with example values
    const replacements: Record<string, string> = {
      '{{currentDate}}': new Date().toLocaleDateString(),
      '{{currentTime}}': new Date().toLocaleTimeString(),
      '{{currentDateTime}}': new Date().toLocaleString(),
      '{{orderNumber}}': 'INV-2024-001',
      '{{documentId}}': 'DOC-123456',
      '{{documentType}}': 'Invoice',
      '{{subtotal}}': '1,000.00',
      '{{taxAmount}}': '150.00',
      '{{totalAmount}}': '1,150.00',
      '{{discountAmount}}': '50.00',
      '{{currency}}': 'SAR',
      '{{items}}': '<tr><td>Item 1</td><td>2</td><td>500.00</td></tr><tr><td>Item 2</td><td>1</td><td>150.00</td></tr>',
      '{{itemCount}}': '3',
      '{{orderDate}}': new Date().toLocaleDateString(),
      '{{dueDate}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      '{{paymentStatus}}': 'Pending',
      '{{orderStatus}}': 'Processing',
      '{{companyCity}}': 'Riyadh',
      '{{companyCountry}}': 'Saudi Arabia',
      '{{vatNumber}}': '123456789012345',
      '{{crNumber}}': '1012345678',
      '{{companyName}}': 'Your Company Name',
      '{{companyEmail}}': 'info@yourcompany.com',
      '{{companyPhone}}': '+966 11 123 4567',
      '{{companyAddress}}': '123 Business St, Riyadh, Saudi Arabia',
      '{{companyLogo}}': 'https://via.placeholder.com/200x100?text=Company+Logo',
      '{{companyStamp}}': 'https://via.placeholder.com/150x150?text=Company+Stamp'
    };

    Object.entries(replacements).forEach(([variable, value]) => {
      preview = preview.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    previewHtml = preview;
  }

  // Update preview when content changes
  $effect(() => {
    updatePreview();
  });

  // Initial preview update
  updatePreview();


</script>

<div class="space-y-6">
  <!-- Editor Header -->
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="flex items-center gap-2">
            <Icon icon="lucide:edit" class="h-5 w-5" />
            Basic Template Editor
          </CardTitle>
          <CardDescription>
            Simple HTML template editor with preview and styling options
          </CardDescription>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" onclick={togglePreview}>
            <Icon icon="lucide:eye" class="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" size="sm" onclick={togglePrintPreview}>
            <Icon icon="lucide:printer" class="h-4 w-4 mr-2" />
            {printPreviewMode ? 'Edit' : 'Print Preview'}
          </Button>
        </div>
      </div>
    </CardHeader>
  </Card>

  <!-- Validation Messages -->
  {#if validationErrors.length > 0 || validationWarnings.length > 0}
    <Card>
      <CardContent class="pt-6">
        {#if validationErrors.length > 0}
          <div class="mb-3">
            <h4 class="text-sm font-medium text-red-800 mb-2">Errors:</h4>
            <ul class="text-sm text-red-700 space-y-1">
              {#each validationErrors as error}
                <li>• {error}</li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if validationWarnings.length > 0}
          <div>
            <h4 class="text-sm font-medium text-yellow-800 mb-2">Warnings:</h4>
            <ul class="text-sm text-yellow-700 space-y-1">
              {#each validationWarnings as warning}
                <li>• {warning}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}

  <!-- Main Content Area -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Editor Panel -->
    <div class="lg:col-span-2 space-y-6">
      <!-- HTML Editor -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">HTML Content</CardTitle>
          <CardDescription>
            Write your template HTML using {'{{variable}}'} syntax for dynamic content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {#if previewMode || printPreviewMode}
            <!-- Preview Mode -->
            <div class="border rounded-lg">
              <!-- Preview Controls -->
              <div class="flex items-center justify-between p-3 border-b bg-muted/50">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">
                    {printPreviewMode ? 'Print Preview' : 'Preview'}
                  </span>
                  <span class="text-xs text-muted-foreground">
                    (Zoom: {Math.round(zoomLevel * 100)}%)
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onclick={zoomOut} disabled={zoomLevel <= 0.5}>
                    <Icon icon="lucide:zoom-out" class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onclick={resetZoom}>
                    <Icon icon="lucide:maximize-2" class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onclick={zoomIn} disabled={zoomLevel >= 2}>
                    <Icon icon="lucide:zoom-in" class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <!-- Preview Content -->
              <div 
                class="p-4 bg-white overflow-auto" 
                style="height: 500px; transform: scale({zoomLevel}); transform-origin: top left;"
              >
                 {@html previewHtml}
              </div>
            </div>
          {:else}
            <!-- Edit Mode -->
            <Textarea
              bind:value={htmlContent}
              placeholder={exampleTemplate}
              rows={20}
              class="font-mono text-sm min-h-[500px]"
            />
          {/if}
        </CardContent>
      </Card>

      <!-- CSS Editor -->
      {#if showCssEditor}
        <CssTextareas 
          screenCss={screenCss} 
          printCss={printCss}
          showTemplates={true}
        />
      {/if}
    </div>

    <!-- Side Panel -->
    <div class="space-y-6">
      <!-- Variable Reference -->
      {#if showVariableReference}
        <VariableReference 
          showCopyButton={true}
          maxHeight="400px"
        />
      {/if}

      <!-- Quick Tips -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3 text-sm">
            <div class="flex items-start gap-2">
              <Icon icon="lucide:code" class="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div class="font-medium">Variables</div>
                <div class="text-muted-foreground">Use {'{{variableName}}'} syntax</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <Icon icon="lucide:eye" class="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div class="font-medium">Preview</div>
                <div class="text-muted-foreground">Test with sample data</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <Icon icon="lucide:printer" class="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div class="font-medium">Print CSS</div>
                <div class="text-muted-foreground">Optimize for PDF output</div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <Icon icon="lucide:zoom-in" class="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div class="font-medium">Zoom</div>
                <div class="text-muted-foreground">Adjust preview size</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Template Info -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Template Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">HTML Length:</span>
              <span>{htmlContent.length} chars</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">CSS Length:</span>
              <span>{screenCss.length + printCss.length} chars</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Variables:</span>
              <span>{(htmlContent.match(/\{\{[^}]+\}\}/g) || []).length}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Status:</span>
              <span class={validationErrors.length > 0 ? 'text-red-600' : validationWarnings.length > 0 ? 'text-yellow-600' : 'text-green-600'}>
                {validationErrors.length > 0 ? 'Has Errors' : validationWarnings.length > 0 ? 'Has Warnings' : 'Valid'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>