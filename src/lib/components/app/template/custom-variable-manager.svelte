<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import { Badge } from "$lib/components/ui/badge";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
  import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
  import { toast } from "svelte-sonner";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import UploadIcon from "@lucide/svelte/icons/upload";
  import SearchIcon from "@lucide/svelte/icons/search";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import EditIcon from "@lucide/svelte/icons/edit";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import EyeIcon from "@lucide/svelte/icons/eye";
  import Wand2Icon from "@lucide/svelte/icons/wand-2";
  import DatabaseIcon from "@lucide/svelte/icons/database";
  import FileTextIcon from "@lucide/svelte/icons/file-text";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
  import InfoIcon from "@lucide/svelte/icons/info";
  import * as variableCollectionService from "$lib/services/variableCollectionService";
  import * as variableCatalogService from "$lib/services/variableCatalogService";
  import * as variableDetectionService from "$lib/services/variableDetectionService";
  import type { VariableTemplate, CreateVariableTemplateInput, UpdateVariableTemplateInput, TemplateVariable } from "$lib/types/templateVariable";
  import type { ClientTemplateVariable } from "$lib/types/templateVariable";
  import type { VariableDetectionResult } from "$lib/types/templateVariable";

  const dispatch = createEventDispatcher();

  // Reactive state
  let activeTab = $state("overview");
  let searchQuery = $state("");
  let selectedCategory = $state("all");
  let selectedType = $state("all");

   // Data state
   let systemVariables = $state<Array<{key: string, label: string, type: string, category: string, description: string, isCommon: boolean}>>([]);
   let customVariables = $state<TemplateVariable[]>([]);
   let variableTemplates = $state<VariableTemplate[]>([]);
   let detectionResults = $state<VariableDetectionResult | null>(null);

  // Form state
  let showCreateTemplateDialog = $state(false);
  let showEditTemplateDialog = $state(false);
  let showDetectionDialog = $state(false);
  let selectedTemplate = $state<VariableTemplate | null>(null);
  let templateContent = $state("");

  // Form data
  let templateFormData = $state<CreateVariableTemplateInput>({
    name: "",
    description: "",
    category: "custom",
    variables: [],
    isActive: true,
    createdBy: "",
    documentTemplateIds: [],
  });

   // Initialize data
   async function initializeData() {
     try {
       // Load system variables
       systemVariables = variableCatalogService.getSystemVariables();

      // Load variable templates
      variableTemplates = await variableCollectionService.getVariableTemplates();

       // Load custom variables from templates
       customVariables = variableTemplates.flatMap(template => template.variables.filter(v => v.category === 'custom'));
     } catch (error) {
       console.error("Failed to initialize data:", error);
       toast.error("Failed to load variable data");
     }
   }

  // Computed values
  const filteredSystemVariables = $derived(() => {
    let filtered = systemVariables;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(variable =>
        variable.key.toLowerCase().includes(query) ||
        variable.label.toLowerCase().includes(query) ||
        variable.description.toLowerCase().includes(query)
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter(variable => variable.type === selectedType);
    }

    return filtered;
  });

   const filteredCustomVariables = $derived(() => {
     let filtered = customVariables;

     if (searchQuery) {
       const query = searchQuery.toLowerCase();
       filtered = filtered.filter(variable =>
         variable.key.toLowerCase().includes(query) ||
         variable.label.toLowerCase().includes(query) ||
         (variable.description && variable.description.toLowerCase().includes(query))
       );
     }

     if (selectedType !== "all") {
       filtered = filtered.filter(variable => variable.type === selectedType);
     }

     return filtered;
   });

  const filteredTemplates = $derived(() => {
    let filtered = variableTemplates;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        (template.description && template.description.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    return filtered;
  });

  // Actions
  async function createTemplate() {
    try {
      const newTemplate = await variableCollectionService.createVariableTemplate(templateFormData);
      variableTemplates = [...variableTemplates, newTemplate];
      showCreateTemplateDialog = false;
      resetTemplateForm();
      toast.success("Variable template created successfully");
    } catch (error) {
      console.error("Failed to create template:", error);
      toast.error("Failed to create variable template");
    }
  }

  async function updateTemplate() {
    if (!selectedTemplate) return;

    try {
      const updateData: UpdateVariableTemplateInput = {
        name: templateFormData.name,
        description: templateFormData.description,
        category: templateFormData.category,
        variables: templateFormData.variables,
        isActive: templateFormData.isActive,
      };

      const updatedTemplate = await variableCollectionService.updateVariableTemplate(selectedTemplate.id, updateData);
      if (updatedTemplate) {
        variableTemplates = variableTemplates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
        showEditTemplateDialog = false;
        resetTemplateForm();
        toast.success("Variable template updated successfully");
      }
    } catch (error) {
      console.error("Failed to update template:", error);
      toast.error("Failed to update variable template");
    }
  }

  async function deleteTemplate(template: VariableTemplate) {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;

    try {
      await variableCollectionService.deleteVariableTemplate(template.id);
      variableTemplates = variableTemplates.filter(t => t.id !== template.id);
      toast.success("Variable template deleted successfully");
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete variable template");
    }
  }

  function detectVariables() {
    if (!templateContent.trim()) {
      toast.error("Please enter template content to analyze");
      return;
    }

    const results = variableDetectionService.analyzeTemplateVariables(templateContent, []);
    detectionResults = results;
    showDetectionDialog = true;
  }

  function applyDetectionResults() {
    if (!detectionResults) return;

    // Add detected variables to a new template
    const newTemplateData: CreateVariableTemplateInput = {
      name: `Auto-detected Variables ${new Date().toISOString().split('T')[0]}`,
      description: `Variables detected from template analysis`,
      category: "custom",
      variables: detectionResults.detectedVariables.map(v => ({
        key: v.key,
        label: v.label,
        type: v.type,
        required: v.required,
        category: v.category,
        description: v.description,
        usageCount: v.usageCount || 0,
      })),
      isActive: true,
      createdBy: "",
      documentTemplateIds: [],
    };

    templateFormData = newTemplateData;
    showCreateTemplateDialog = true;
    showDetectionDialog = false;
    toast.success("Detected variables applied to new template");
  }

  function editTemplate(template: VariableTemplate) {
    selectedTemplate = template;
    templateFormData = {
      name: template.name,
      description: template.description || "",
      category: template.category,
      variables: template.variables,
      isActive: template.isActive,
      createdBy: template.createdBy || "",
      documentTemplateIds: template.documentTemplateIds || [],
    };
    showEditTemplateDialog = true;
  }

  function resetTemplateForm() {
    templateFormData = {
      name: "",
      description: "",
      category: "custom",
      variables: [],
      isActive: true,
      createdBy: "",
      documentTemplateIds: [],
    };
    selectedTemplate = null;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy to clipboard");
    });
  }

  // Helper functions to format variable display
  function formatVariableDisplay(variable: {key: string} | string): string {
    const key = typeof variable === 'string' ? variable : variable.key;
    return `{{${key}}}`;
  }

  function formatVariableForClipboard(key: string): string {
    return `{{${key}}}`;
  }

  function exportVariables() {
    const exportData = {
       systemVariables: systemVariables.map(v => ({
         key: v.key,
         label: v.label,
         type: v.type,
         description: v.description,
       })),
       customVariables: customVariables.map(v => ({
         key: v.key,
         label: v.label,
         type: v.type,
         description: v.description,
       })),
      templates: variableTemplates,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `variables-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Variables exported successfully");
  }

  function importVariables(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        // Process imported data (this would need proper validation and service calls)
        console.log("Import data:", importData);
        toast.success("Variables imported successfully");
      } catch (error) {
        console.error("Import failed:", error);
        toast.error("Failed to import variables");
      }
    };
    reader.readAsText(file);
  }

  // Initialize on mount
  initializeData();
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold">Advanced Variable Manager</h2>
      <p class="text-muted-foreground">Comprehensive variable and template management</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" onclick={exportVariables}>
        <DownloadIcon class="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button variant="outline" onclick={() => document.getElementById('import-file')?.click()}>
        <UploadIcon class="h-4 w-4 mr-2" />
        Import
      </Button>
      <input
        id="import-file"
        type="file"
        accept=".json"
        class="hidden"
        onchange={importVariables}
      />
    </div>
  </div>

  <!-- Search and Filters -->
  <div class="flex flex-col sm:flex-row gap-4">
    <div class="relative flex-1">
      <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search variables, templates..."
        bind:value={searchQuery}
        class="pl-10"
      />
    </div>
    <Select bind:value={selectedType} type="single">
      <SelectTrigger class="w-[180px]">
        <span class="block truncate">
          {selectedType === "all" ? "All Types" : selectedType}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="text">Text</SelectItem>
        <SelectItem value="number">Number</SelectItem>
        <SelectItem value="currency">Currency</SelectItem>
        <SelectItem value="date">Date</SelectItem>
        <SelectItem value="boolean">Boolean</SelectItem>
        <SelectItem value="image">Image</SelectItem>
      </SelectContent>
    </Select>
    {#if activeTab === "templates"}
      <Select bind:value={selectedCategory} type="single">
        <SelectTrigger class="w-[180px]">
          <span class="block truncate">
            {selectedCategory === "all" ? "All Categories" : selectedCategory}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="system">System</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
          <SelectItem value="client">Client</SelectItem>
        </SelectContent>
      </Select>
    {/if}
  </div>

  <!-- Main Content -->
  <Tabs bind:value={activeTab} class="space-y-4">
    <TabsList class="grid w-full grid-cols-4">
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="variables">Variables</TabsTrigger>
      <TabsTrigger value="templates">Templates</TabsTrigger>
      <TabsTrigger value="tools">Tools</TabsTrigger>
    </TabsList>

    <!-- Overview Tab -->
    <TabsContent value="overview" class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">System Variables</CardTitle>
            <DatabaseIcon class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{systemVariables.length}</div>
            <p class="text-xs text-muted-foreground">Built-in variables</p>
          </CardContent>
        </Card>
         <Card>
           <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle class="text-sm font-medium">Custom Variables</CardTitle>
             <SettingsIcon class="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div class="text-2xl font-bold">{customVariables.length}</div>
             <p class="text-xs text-muted-foreground">User-defined variables</p>
           </CardContent>
         </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Templates</CardTitle>
            <FileTextIcon class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{variableTemplates.length}</div>
            <p class="text-xs text-muted-foreground">Variable templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Variables</CardTitle>
            <InfoIcon class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div class="text-2xl font-bold">{systemVariables.length + customVariables.length}</div>
            <p class="text-xs text-muted-foreground">All available variables</p>
          </CardContent>
        </Card>
      </div>

      <!-- Recent Activity -->
      <Card>
        <CardHeader>
          <CardTitle>Variable Categories</CardTitle>
          <CardDescription>Distribution of variables by type and category</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
             {#each ['text', 'number', 'currency', 'date', 'boolean', 'image'] as type}
               {@const count = systemVariables.filter(v => v.type === type).length + customVariables.filter(v => v.type === type).length}
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Badge variant={type === 'currency' ? 'default' : 'secondary'}>{type}</Badge>
                  <span class="text-sm text-muted-foreground">{type} variables</span>
                </div>
                <span class="font-medium">{count}</span>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    </TabsContent>

    <!-- Variables Tab -->
    <TabsContent value="variables" class="space-y-4">
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- System Variables -->
        <Card>
          <CardHeader>
            <CardTitle>System Variables</CardTitle>
            <CardDescription>Built-in variables that are automatically populated</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3 max-h-96 overflow-y-auto">
            {#each filteredSystemVariables().slice(0, 10) as variable}
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <code class="text-sm bg-muted px-2 py-1 rounded">{formatVariableDisplay(variable.key)}</code>
                    {#if variable.isCommon}
                      <Badge variant="secondary" class="text-xs">Common</Badge>
                    {/if}
                  </div>
                  <p class="text-sm text-muted-foreground mt-1">{variable.description}</p>
                </div>
                <div class="flex items-center gap-2">
                  <Badge variant="outline">{variable.type}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => copyToClipboard(`{{${variable.key}}}`)}
                  >
                    <CopyIcon class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            {/each}
          </CardContent>
        </Card>

         <!-- Custom Variables -->
         <Card>
           <CardHeader>
             <div class="flex items-center justify-between">
               <div>
                 <CardTitle>Custom Variables</CardTitle>
                 <CardDescription>User-defined variables for templates</CardDescription>
               </div>
               <Button size="sm" onclick={() => showCreateTemplateDialog = true}>
                 <PlusIcon class="h-4 w-4 mr-2" />
                 Add
               </Button>
             </div>
           </CardHeader>
           <CardContent class="space-y-3 max-h-96 overflow-y-auto">
             {#each filteredCustomVariables().slice(0, 10) as variable}
               <div class="flex items-center justify-between p-3 border rounded-lg">
                 <div class="flex-1">
                    <div class="flex items-center gap-2">
                     <code class="text-sm bg-muted px-2 py-1 rounded">{formatVariableDisplay(variable.key)}</code>
                      <Badge variant="outline">{variable.type}</Badge>
                      <Badge variant="secondary">Custom</Badge>
                    </div>
                   <p class="text-sm text-muted-foreground mt-1">{variable.description || 'No description'}</p>
                 </div>
                 <div class="flex items-center gap-2">
                   <Button
                     variant="ghost"
                     size="sm"
                     onclick={() => copyToClipboard(`{{${variable.key}}}`)}
                   >
                     <CopyIcon class="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             {/each}
           </CardContent>
         </Card>
      </div>
    </TabsContent>

    <!-- Templates Tab -->
    <TabsContent value="templates" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">Variable Templates</h3>
          <p class="text-sm text-muted-foreground">Reusable variable collections</p>
        </div>
        <Button onclick={() => showCreateTemplateDialog = true}>
          <PlusIcon class="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each filteredTemplates() as template}
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <CardTitle class="text-lg">{template.name}</CardTitle>
                <div class="flex items-center gap-2">
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">Variables:</span>
                  <span class="font-medium">{template.variables.length}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">Created:</span>
                  <span class="font-medium">{template.createdAt.toLocaleDateString()}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 mt-4">
                <Button variant="outline" size="sm" onclick={() => editTemplate(template)}>
                  <EditIcon class="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onclick={() => deleteTemplate(template)}>
                  <Trash2Icon class="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    </TabsContent>

    <!-- Tools Tab -->
    <TabsContent value="tools" class="space-y-4">
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Variable Detection -->
        <Card>
          <CardHeader>
            <CardTitle>Variable Detection</CardTitle>
            <CardDescription>Analyze template content to detect variables</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <Label for="template-content">Template Content</Label>
              <Textarea
                id="template-content"
                placeholder="Paste your template content here..."
                bind:value={templateContent}
                rows={6}
              />
            </div>
            <Button onclick={detectVariables} class="w-full">
              <Wand2Icon class="h-4 w-4 mr-2" />
              Detect Variables
            </Button>
          </CardContent>
        </Card>

        <!-- Quick Actions -->
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common variable management tasks</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button variant="outline" class="w-full justify-start" onclick={() => activeTab = "variables"}>
              <EyeIcon class="h-4 w-4 mr-2" />
              Browse All Variables
            </Button>
            <Button variant="outline" class="w-full justify-start" onclick={() => showCreateTemplateDialog = true}>
              <PlusIcon class="h-4 w-4 mr-2" />
              Create Variable Template
            </Button>
            <Button variant="outline" class="w-full justify-start" onclick={exportVariables}>
              <DownloadIcon class="h-4 w-4 mr-2" />
              Export Variable Data
            </Button>
            <Button variant="outline" class="w-full justify-start" onclick={() => document.getElementById('import-file')?.click()}>
              <UploadIcon class="h-4 w-4 mr-2" />
              Import Variable Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  </Tabs>
</div>

<!-- Create Template Dialog -->
<Dialog bind:open={showCreateTemplateDialog}>
  <DialogContent class="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Create Variable Template</DialogTitle>
      <DialogDescription>Create a reusable collection of variables</DialogDescription>
    </DialogHeader>
    <div class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <Label for="template-name">Template Name</Label>
          <Input
            id="template-name"
            bind:value={templateFormData.name}
            placeholder="e.g., Invoice Variables"
          />
        </div>
        <div>
          <Label for="template-category">Category</Label>
          <Select bind:value={templateFormData.category} type="single">
            <SelectTrigger>
              <span class="block truncate">{templateFormData.category}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label for="template-description">Description</Label>
        <Textarea
          id="template-description"
          bind:value={templateFormData.description}
          placeholder="Describe what this template is used for..."
        />
      </div>
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          id="template-active"
          bind:checked={templateFormData.isActive}
        />
        <Label for="template-active">Active</Label>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <Button variant="outline" onclick={() => showCreateTemplateDialog = false}>
        Cancel
      </Button>
      <Button onclick={createTemplate}>
        Create Template
      </Button>
    </div>
  </DialogContent>
</Dialog>

<!-- Edit Template Dialog -->
<Dialog bind:open={showEditTemplateDialog}>
  <DialogContent class="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Edit Variable Template</DialogTitle>
      <DialogDescription>Update the variable template</DialogDescription>
    </DialogHeader>
    <div class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <Label for="edit-template-name">Template Name</Label>
          <Input
            id="edit-template-name"
            bind:value={templateFormData.name}
            placeholder="e.g., Invoice Variables"
          />
        </div>
        <div>
          <Label for="edit-template-category">Category</Label>
          <Select bind:value={templateFormData.category} type="single">
            <SelectTrigger>
              <span class="block truncate">{templateFormData.category}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label for="edit-template-description">Description</Label>
        <Textarea
          id="edit-template-description"
          bind:value={templateFormData.description}
          placeholder="Describe what this template is used for..."
        />
      </div>
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          id="edit-template-active"
          bind:checked={templateFormData.isActive}
        />
        <Label for="edit-template-active">Active</Label>
      </div>
    </div>
    <div class="flex justify-end gap-2 mt-6">
      <Button variant="outline" onclick={() => showEditTemplateDialog = false}>
        Cancel
      </Button>
      <Button onclick={updateTemplate}>
        Update Template
      </Button>
    </div>
  </DialogContent>
</Dialog>

<!-- Detection Results Dialog -->
<Dialog bind:open={showDetectionDialog}>
  <DialogContent class="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Variable Detection Results</DialogTitle>
      <DialogDescription>Variables found in your template content</DialogDescription>
    </DialogHeader>
    {#if detectionResults}
      <div class="space-y-4">
        <div class="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm">Detected Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{detectionResults.detectedVariables.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm">New Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold text-green-600">{detectionResults.newVariables.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm">Existing Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold text-blue-600">{detectionResults.existingVariables.length}</div>
            </CardContent>
          </Card>
        </div>

        {#if detectionResults.detectedVariables.length > 0}
          <div class="space-y-2">
            <h4 class="font-medium">Detected Variables:</h4>
            <div class="max-h-60 overflow-y-auto space-y-2">
              {#each detectionResults.detectedVariables as variable}
                <div class="flex items-center justify-between p-2 border rounded">
                  <div class="flex items-center gap-2">
                    <code class="text-sm bg-muted px-2 py-1 rounded">{formatVariableDisplay(variable.key)}</code>
                    <Badge variant="outline">{variable.type}</Badge>
                    <Badge variant={variable.category === 'system' ? 'default' : 'secondary'}>
                      {variable.category}
                    </Badge>
                  </div>
                  {#if detectionResults.newVariables.find((v: TemplateVariable) => v.key === variable.key)}
                    <Badge variant="default" class="text-xs">New</Badge>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if detectionResults.recommendations.length > 0}
          <div class="space-y-2">
            <h4 class="font-medium">Recommendations:</h4>
            <div class="space-y-1">
              {#each detectionResults.recommendations as recommendation}
                <div class="flex items-start gap-2 text-sm">
                  <AlertCircleIcon class="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{recommendation}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
    <div class="flex justify-end gap-2 mt-6">
      <Button variant="outline" onclick={() => showDetectionDialog = false}>
        Close
      </Button>
      <Button onclick={applyDetectionResults}>
        <PlusIcon class="h-4 w-4 mr-2" />
        Create Template from Results
      </Button>
    </div>
  </DialogContent>
</Dialog>