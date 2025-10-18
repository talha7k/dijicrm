<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Badge } from "$lib/components/ui/badge";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
  import Icon from "@iconify/svelte";
  import { toast } from "svelte-sonner";
  import { Timestamp } from "@firebase/firestore";
  import type { DocumentTemplate } from "$lib/types/document";
  import type { TemplateVariable } from "$lib/types/templateVariable";
  import type { ClientTemplateVariable } from "$lib/types/templateVariable";
  import { documentTemplatesStore } from "$lib/stores/documentTemplates";
  import { customTemplateVariablesStore } from "$lib/stores/customTemplateVariables";
  import { companyContext } from "$lib/stores/companyContext";
  import { auth } from "$lib/firebase";
  import VariableReference from "./variable-reference.svelte";

  interface Props {
    clientId: string;
    clientName?: string;
    onDataEntryComplete?: (data: any) => void;
    onCancel?: () => void;
  }

  let { 
    clientId, 
    clientName = "", 
    onDataEntryComplete = () => {},
    onCancel = () => {}
  }: Props = $props();

  let selectedTemplate = $state<DocumentTemplate | null>(null);
  let templateVariables = $state<(TemplateVariable | {key: string, label: string, type: string, description: string, required: boolean, category: string})[]>([]);
  let formData = $state<Record<string, any>>({});
  let showTemplateSelector = $state(true);
  let showDataForm = $state(false);
  let showVariableReference = $state(false);
  let searchTerm = $state("");
  let selectedType = $state("all");

  // Load templates and variables
  $effect(() => {
    if ($companyContext.data && !$companyContext.loading) {
      documentTemplatesStore.loadTemplates();
      customTemplateVariablesStore.loadCustomVariables();
    }
  });

  let filteredTemplates = $derived(() => {
    if (!$documentTemplatesStore.data) return [];
    
    return $documentTemplatesStore.data.filter(template => {
      const matchesSearch = !searchTerm || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === "all" || template.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  });

  function selectTemplate(template: DocumentTemplate) {
    selectedTemplate = template;
    extractTemplateVariables(template);
    initializeFormData();
    showTemplateSelector = false;
    showDataForm = true;
  }

  function extractTemplateVariables(template: DocumentTemplate) {
    // Extract variables from template content using regex
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = template.htmlContent.match(variableRegex) || [];
    const variableKeys = [...new Set(matches.map(match => match.replace(/[{}]/g, '').trim()))];

    // Get custom variables that match these keys
    const customVars = $customTemplateVariablesStore.customVariables?.filter(v => 
      variableKeys.includes(v.key)
    ) || [];

    // Create template variables with system variables as fallback
    templateVariables = variableKeys.map(key => {
      const customVar = customVars.find(v => v.key === key);
      
      if (customVar) {
        return customVar;
      }

      // Create a synthetic variable for system variables or missing ones
      return {
        key: key,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        type: "text",
        description: `System variable: ${key}`,
        required: false,
        category: "system",
      };
    });
  }

  function initializeFormData() {
    const initialData: Record<string, any> = {};
    
    templateVariables.forEach(variable => {
      if ('value' in variable && variable.value !== undefined && variable.value !== null) {
        initialData[variable.key] = variable.value;
      } else {
        // Set default values based on type
        switch (variable.type) {
          case "boolean":
            initialData[variable.key] = false;
            break;
          case "number":
          case "currency":
            initialData[variable.key] = 0;
            break;
          case "date":
            initialData[variable.key] = "";
            break;
          default:
            initialData[variable.key] = "";
        }
      }
    });
    
    formData = initialData;
  }

  function backToTemplateSelection() {
    selectedTemplate = null;
    templateVariables = [];
    formData = {};
    showTemplateSelector = true;
    showDataForm = false;
  }

  function handleInputChange(key: string, value: any) {
    formData[key] = value;
  }

  function validateForm(): boolean {
    const requiredVariables = templateVariables.filter(v => v.required);
    
    for (const variable of requiredVariables) {
      if (!formData[variable.key] || formData[variable.key] === "") {
        toast.error(`${variable.label} is required`);
        return false;
      }
    }
    
    return true;
  }

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    if (!selectedTemplate) {
      toast.error("No template selected");
      return;
    }

    const result = {
      template: selectedTemplate,
      data: formData,
      variables: templateVariables,
      clientId: clientId,
      clientName: clientName,
    };

    onDataEntryComplete(result);
  }

  function getTypeColor(type: string) {
    const colors: Record<string, string> = {
      text: "hsl(var(--primary))",
      number: "hsl(var(--chart-2))",
      date: "hsl(var(--chart-3))",
      currency: "hsl(var(--chart-4))",
      boolean: "hsl(var(--chart-5))",
      image: "hsl(var(--chart-1))"
    };
    return colors[type] || "hsl(var(--muted))";
  }

  function getTypeIcon(type: string) {
    const icons: Record<string, string> = {
      text: "lucide:type",
      number: "lucide:hash",
      date: "lucide:calendar",
      currency: "lucide:dollar-sign",
      boolean: "lucide:toggle-left",
      image: "lucide:image"
    };
    return icons[type] || "lucide:variable";
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Template-First Data Entry</CardTitle>
          <CardDescription>
            Select a template and enter data for {clientName || `client ${clientId}`}
          </CardDescription>
        </div>
        <Button variant="outline" onclick={onCancel}>
          <Icon icon="lucide:x" class="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </CardHeader>
  </Card>

  {#if showTemplateSelector}
    <!-- Template Selection -->
    <Card>
      <CardHeader>
        <CardTitle>Select Template</CardTitle>
        <CardDescription>
          Choose a template to generate a document with custom data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex gap-4 mb-6">
          <Input
            bind:value={searchTerm}
            placeholder="Search templates..."
            class="flex-1"
          />
          <Select.Root type="single" bind:value={selectedType}>
            <Select.Trigger class="w-40">
              {selectedType === "all" ? "All Types" : selectedType}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All Types</Select.Item>
              <Select.Item value="order">Invoice</Select.Item>
              <Select.Item value="legal">Legal Document</Select.Item>
              <Select.Item value="business">Business Document</Select.Item>
              <Select.Item value="custom">Custom</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>

        {#if filteredTemplates().length === 0}
          <div class="text-center py-8 text-muted-foreground">
            <Icon icon="lucide:file-text" class="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p class="text-lg font-medium mb-2">No templates found</p>
            <p class="text-sm">
              {searchTerm || selectedType !== "all" 
                ? "Try adjusting your search or filters." 
                : "Create templates first to use this feature."}
            </p>
          </div>
        {:else}
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {#each filteredTemplates() as template}
               <div
                 class="border border-border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                 role="button"
                 tabindex="0"
                 onclick={() => selectTemplate(template)}
                 onkeydown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     selectTemplate(template);
                   }
                 }}
               >
                <div class="flex items-start justify-between mb-2">
                  <h3 class="font-medium">{template.name}</h3>
                  <Badge variant="outline" class="text-xs">{template.type}</Badge>
                </div>
                <p class="text-sm text-muted-foreground mb-3">
                  {template.description || 'No description'}
                </p>
                <div class="flex items-center justify-between">
                  <div class="text-xs text-muted-foreground">
                    <Icon icon="lucide:variable" class="h-3 w-3 inline mr-1" />
                    {template.placeholders.length} variables
                  </div>
                  <Icon icon="lucide:arrow-right" class="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {:else if showDataForm && selectedTemplate}
    <!-- Data Entry Form -->
    <div class="space-y-6">
      <!-- Template Info -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>{selectedTemplate.name}</CardTitle>
              <CardDescription>{selectedTemplate.description}</CardDescription>
            </div>
            <Button variant="outline" onclick={backToTemplateSelection}>
              <Icon icon="lucide:arrow-left" class="h-4 w-4 mr-2" />
              Change Template
            </Button>
          </div>
        </CardHeader>
      </Card>

      <!-- Variable Reference -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Template Variables</CardTitle>
              <CardDescription>
                Enter values for {templateVariables.length} variables
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onclick={() => showVariableReference = !showVariableReference}
            >
              <Icon icon="lucide:variable" class="h-4 w-4 mr-2" />
              {showVariableReference ? 'Hide' : 'Show'} Reference
            </Button>
          </div>
        </CardHeader>
        {#if showVariableReference}
          <CardContent>
            <VariableReference />
          </CardContent>
        {/if}
      </Card>

      <!-- Data Form -->
      <Card>
        <CardHeader>
          <CardTitle>Enter Data</CardTitle>
          <CardDescription>
            Fill in the required information for document generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-6">
            {#each templateVariables as variable}
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <Icon icon={getTypeIcon(variable.type)} class="h-4 w-4" style="color: {getTypeColor(variable.type)}" />
                  <Label class="text-sm font-medium">
                    {variable.label}
                    {#if variable.required}
                      <span class="text-red-500 ml-1">*</span>
                    {/if}
                  </Label>
                  <Badge variant="outline" class="text-xs">{variable.type}</Badge>
                  {#if variable.category === "system"}
                    <Badge variant="secondary" class="text-xs">System</Badge>
                  {/if}
                </div>
                
                {#if variable.type === "boolean"}
                  <div class="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={variable.key}
                      bind:checked={formData[variable.key]}
                      class="rounded border-border"
                    />
                    <Label for={variable.key} class="text-sm">{variable.label}</Label>
                  </div>
                {:else if variable.type === "number" || variable.type === "currency"}
                  <Input
                    id={variable.key}
                    type="number"
                    step="0.01"
                    bind:value={formData[variable.key]}
                    placeholder={variable.description || `Enter ${variable.label.toLowerCase()}`}
                    class={variable.required && !formData[variable.key] ? "border-red-200" : ""}
                  />
                {:else if variable.type === "date"}
                  <Input
                    id={variable.key}
                    type="date"
                    bind:value={formData[variable.key]}
                    class={variable.required && !formData[variable.key] ? "border-red-200" : ""}
                  />
                {:else if variable.type === "image"}
                  <Input
                    id={variable.key}
                    type="url"
                    bind:value={formData[variable.key]}
                    placeholder="Enter image URL"
                    class={variable.required && !formData[variable.key] ? "border-red-200" : ""}
                  />
                {:else}
                  <Input
                    id={variable.key}
                    bind:value={formData[variable.key]}
                    placeholder={variable.description || `Enter ${variable.label.toLowerCase()}`}
                    class={variable.required && !formData[variable.key] ? "border-red-200" : ""}
                  />
                {/if}
                
                {#if variable.description}
                  <p class="text-xs text-muted-foreground">{variable.description}</p>
                {/if}
              </div>
            {/each}
          </div>

          <div class="flex justify-end gap-2 mt-8">
            <Button variant="outline" onclick={onCancel}>
              Cancel
            </Button>
            <Button onclick={handleSubmit}>
              <Icon icon="lucide:check" class="h-4 w-4 mr-2" />
              Generate Document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>