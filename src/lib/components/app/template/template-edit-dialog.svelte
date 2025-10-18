<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Badge } from "$lib/components/ui/badge";
  import Icon from "@iconify/svelte";
  import { validateBasicTemplate } from "$lib/utils/basicTemplateValidation";
  import type { DocumentTemplate } from "$lib/types/document";
  import { Timestamp } from "@firebase/firestore";
  import BasicEditor from "./basic-editor.svelte";
  import VariableAccordion from "./variable-accordion.svelte";
  import { customTemplateVariablesStore } from "$lib/stores/customTemplateVariables";
  import { companyContext } from "$lib/stores/companyContext";
  import { analyzeTemplateVariables } from "$lib/services/variableDetectionService";

  interface Props {
    initialTemplate?: DocumentTemplate | null;
    onSave: (template: DocumentTemplate) => void;
    onCancel: () => void;
  }

  let { 
    initialTemplate = null, 
    onSave, 
    onCancel 
  }: Props = $props();

  let template = $state<DocumentTemplate>({
    id: initialTemplate?.id || '',
    companyId: initialTemplate?.companyId || $companyContext.data?.companyId || '',
    name: initialTemplate?.name || '',
    description: initialTemplate?.description || '',
    type: initialTemplate?.type || 'custom',
    htmlContent: initialTemplate?.htmlContent || '',
    placeholders: initialTemplate?.placeholders || [],
    isActive: initialTemplate?.isActive ?? true,
    version: initialTemplate?.version || 1,
    createdBy: initialTemplate?.createdBy || '',
    createdAt: initialTemplate?.createdAt || Timestamp.now(),
    updatedAt: initialTemplate?.updatedAt || Timestamp.now(),
    tags: initialTemplate?.tags || []
  });

  let validationErrors = $state<string[]>([]);
  let validationWarnings = $state<string[]>([]);
  let showVariableAccordion = $state(false);
  let detectedVariables = $state<any[]>([]);
  let variableAnalysis = $state<any>(null);

  // Load client variables for the company
  $effect(() => {
    if ($companyContext.data && !$companyContext.loading) {
      customTemplateVariablesStore.loadCustomVariables();
    }
  });

  // Create a reactive binding for the editor content
  let editorContent = $state(template.htmlContent);
  
  $effect(() => {
    template.htmlContent = editorContent;
    // Analyze variables whenever template content changes
    analyzeVariables();
  });

   function analyzeVariables() {
     if (!template.htmlContent.trim()) {
       detectedVariables = [];
       variableAnalysis = null;
       return;
     }

     try {
       // Pass existing variables from the store, not the detected ones
       // This prevents circular dependency issues
       const existingVars = $customTemplateVariablesStore.customVariables || [];
       const analysis = analyzeTemplateVariables(
         template.htmlContent,
         existingVars
       );
       variableAnalysis = analysis;
       detectedVariables = analysis.detectedVariables;

       // Show recommendations if there are new variables
       if (analysis.newVariables.length > 0) {
         console.log('New variables detected:', analysis.newVariables);
         console.log('Recommendations:', analysis.recommendations);
       }
     } catch (error) {
       console.error('Error analyzing variables:', error);
     }
   }

  function handleSave() {
    // Validate template
    const validation = validateBasicTemplate(template);

    validationErrors = validation.errors;
    validationWarnings = validation.warnings;

    if (validation.errors.length > 0) {
      return;
    }

    // Update template with current data
    const updatedTemplate: DocumentTemplate = {
      ...template,
      htmlContent: template.htmlContent,
      updatedAt: Timestamp.now(),
      version: template.version + 1
    };

    onSave(updatedTemplate);
  }

  function handleVariableInsert(variableKey: string) {
    // Insert variable at cursor position in HTML content
    const variableText = `{{${variableKey}}}`;
    template.htmlContent += variableText;
  }

  function handleVariableCopy() {
    // This is handled by the accordion component
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

<div class="space-y-6">
  <!-- Template Header -->
  <Card>
    <CardHeader>
      <CardTitle>{initialTemplate ? 'Edit Template' : 'Create New Template'}</CardTitle>
      <CardDescription>
        Design your document template with HTML and dynamic placeholders
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
              {template.type ? template.type.charAt(0).toUpperCase() + template.type.slice(1) : "Select template type"}
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

      <div>
        <Label for="template-tags">Tags (Optional)</Label>
        <Input
          id="template-tags"
          bind:value={template.tags}
          placeholder="Enter tags separated by commas"
        />
      </div>
    </CardContent>
  </Card>

  <!-- Detected Variables -->
  {#if variableAnalysis && (variableAnalysis.detectedVariables.length > 0 || variableAnalysis.recommendations.length > 0)}
    <Card>
      <CardHeader>
        <CardTitle>Detected Variables</CardTitle>
        <CardDescription>
          Variables found in your template and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if variableAnalysis.detectedVariables.length > 0}
          <div>
            <h4 class="font-medium mb-2">Variables Found ({variableAnalysis.detectedVariables.length})</h4>
            <div class="flex flex-wrap gap-2">
              {#each variableAnalysis.detectedVariables as variable}
                <Badge variant={variable.category === 'system' ? 'default' : 'secondary'}>
                  {variable.key}
                  {#if variable.required}
                    <span class="ml-1 text-red-500">*</span>
                  {/if}
                </Badge>
              {/each}
            </div>
          </div>
        {/if}
        
        {#if variableAnalysis.newVariables.length > 0}
          <div>
            <h4 class="font-medium mb-2 text-orange-600">New Custom Variables ({variableAnalysis.newVariables.length})</h4>
            <p class="text-sm text-muted-foreground mb-2">
              These variables need to be defined in your custom variables manager:
            </p>
            <div class="flex flex-wrap gap-2">
              {#each variableAnalysis.newVariables as variable}
                <Badge variant="outline" class="border-orange-200 text-orange-700">
                  {variable.key} ({variable.type})
                </Badge>
              {/each}
            </div>
          </div>
        {/if}
        
        {#if variableAnalysis.recommendations.length > 0}
          <div>
            <h4 class="font-medium mb-2">Recommendations</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              {#each variableAnalysis.recommendations as recommendation}
                <li>• {recommendation}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}

  <!-- Variable Reference -->
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Template Variables</CardTitle>
          <CardDescription>
            Insert dynamic variables into your template using {'{{variableName}}'} syntax
          </CardDescription>
        </div>
        <Button
          variant="outline"
          onclick={() => showVariableAccordion = !showVariableAccordion}
        >
          <Icon icon="lucide:variable" class="h-4 w-4 mr-2" />
          {showVariableAccordion ? 'Hide' : 'Show'} Variables
        </Button>
      </div>
    </CardHeader>
    {#if showVariableAccordion}
      <CardContent>
        <VariableAccordion
          customVariables={$customTemplateVariablesStore.customVariables || []}
          onVariableInsert={handleVariableInsert}
        />
      </CardContent>
    {/if}
  </Card>

  <!-- HTML Editor -->
  <Card>
    <CardHeader>
      <CardTitle>HTML Template Content</CardTitle>
      <CardDescription>
        Write your HTML template with variable placeholders. Use {'{{variableName}}'} syntax for dynamic content.
      </CardDescription>
    </CardHeader>
    <CardContent>
       <BasicEditor
         initialContent={editorContent}
         showVariableReference={false}
         showCssEditor={true}
       />
    </CardContent>
  </Card>

  <!-- Validation Messages -->
  {#if validationErrors.length > 0 || validationWarnings.length > 0}
    <Card>
      <CardHeader>
        <CardTitle class="text-destructive">Validation Issues</CardTitle>
      </CardHeader>
      <CardContent>
        {#if validationErrors.length > 0}
          <div class="space-y-2 mb-4">
            <h4 class="font-medium text-destructive">Errors:</h4>
            {#each validationErrors as error}
              <div class="text-sm text-destructive flex items-start gap-2">
                <Icon icon="lucide:alert-circle" class="h-4 w-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            {/each}
          </div>
        {/if}
        {#if validationWarnings.length > 0}
          <div class="space-y-2">
            <h4 class="font-medium text-yellow-600">Warnings:</h4>
            {#each validationWarnings as warning}
              <div class="text-sm text-yellow-600 flex items-start gap-2">
                <Icon icon="lucide:alert-triangle" class="h-4 w-4 mt-0.5 flex-shrink-0" />
                {warning}
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}

  <!-- Actions -->
  <div class="flex justify-end gap-2">
    <Button variant="outline" onclick={onCancel}>
      Cancel
    </Button>
    <Button onclick={handleSave} disabled={validationErrors.length > 0}>
      <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
      {initialTemplate ? 'Update Template' : 'Create Template'}
    </Button>
  </div>
</div>