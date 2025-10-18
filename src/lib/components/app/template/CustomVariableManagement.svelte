<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Badge } from '$lib/components/ui/badge';
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog';
  import * as Select from '$lib/components/ui/select/index.js';
  import { toast } from 'svelte-sonner';
  import { customTemplateVariablesStore } from '$lib/stores/customTemplateVariables';
  import { companyContext } from '$lib/stores/companyContext';
  import type { TemplateVariable } from '$lib/types/templateVariable';
  import Icon from '@iconify/svelte';

  let searchQuery = $state('');
  let selectedType = $state('all');
  let showCreateDialog = $state(false);
  let showEditDialog = $state(false);
  let editingVariable = $state<TemplateVariable | null>(null);

  // Form state for creating/editing
  let formKey = $state('');
  let formLabel = $state('');
  let formType = $state<'text' | 'number' | 'date' | 'currency' | 'boolean' | 'image'>('text');
  let formDescription = $state('');
  let formRequired = $state(false);
  let formDefaultValue = $state('');

  onMount(() => {
    customTemplateVariablesStore.loadCustomVariables();
  });

  // Computed filtered variables
  let filteredVariables = $state<TemplateVariable[]>([]);

  $effect(() => {
    if (!$customTemplateVariablesStore.customVariables) {
      filteredVariables = [];
      return;
    }

    filteredVariables = $customTemplateVariablesStore.customVariables.filter((variable) => {
      const matchesSearch = variable.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           variable.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (variable.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      const matchesType = selectedType === 'all' || variable.type === selectedType;

      return matchesSearch && matchesType;
    });
  });

  function resetForm() {
    formKey = '';
    formLabel = '';
    formType = 'text';
    formDescription = '';
    formRequired = false;
    formDefaultValue = '';
  }

  function openCreateDialog() {
    resetForm();
    showCreateDialog = true;
  }

  function openEditDialog(variable: TemplateVariable) {
    editingVariable = variable;
    formKey = variable.key;
    formLabel = variable.label;
    formType = variable.type;
    formDescription = variable.description || '';
    formRequired = variable.required;
    formDefaultValue = variable.defaultValue || '';
    showEditDialog = true;
  }

  async function handleCreateVariable() {
    if (!formKey.trim() || !formLabel.trim()) {
      toast.error('Key and label are required');
      return;
    }

    try {
      await customTemplateVariablesStore.createCustomVariable({
        key: formKey.trim(),
        label: formLabel.trim(),
        type: formType,
        category: 'custom',
        required: formRequired,
        description: formDescription.trim() || undefined,
        defaultValue: formDefaultValue.trim() || undefined,
      });

      toast.success('Custom variable created successfully');
      showCreateDialog = false;
      resetForm();
    } catch (error) {
      console.error('Failed to create custom variable:', error);
      toast.error('Failed to create custom variable');
    }
  }

  async function handleUpdateVariable() {
    if (!editingVariable || !formKey.trim() || !formLabel.trim()) {
      toast.error('Key and label are required');
      return;
    }

    try {
      await customTemplateVariablesStore.updateCustomVariable(editingVariable.key, {
        key: formKey.trim(),
        label: formLabel.trim(),
        type: formType,
        required: formRequired,
        description: formDescription.trim() || undefined,
        defaultValue: formDefaultValue.trim() || undefined,
      });

      toast.success('Custom variable updated successfully');
      showEditDialog = false;
      resetForm();
      editingVariable = null;
    } catch (error) {
      console.error('Failed to update custom variable:', error);
      toast.error('Failed to update custom variable');
    }
  }

  async function handleDeleteVariable(variable: TemplateVariable) {
    if (confirm(`Are you sure you want to delete "${variable.label}"?`)) {
      try {
        await customTemplateVariablesStore.deleteCustomVariable(variable.key);
        toast.success('Custom variable deleted successfully');
      } catch (error) {
        console.error('Failed to delete custom variable:', error);
        toast.error('Failed to delete custom variable');
      }
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-purple-100 text-purple-800';
      case 'currency': return 'bg-yellow-100 text-yellow-800';
      case 'boolean': return 'bg-red-100 text-red-800';
      case 'image': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold">Custom Variables</h2>
      <p class="text-muted-foreground">Manage custom variables for your document templates</p>
    </div>
    <Button onclick={openCreateDialog}>
      <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
      Create Variable
    </Button>
  </div>

  <!-- Filters -->
  <div class="flex gap-4">
    <Input
      bind:value={searchQuery}
      placeholder="Search variables..."
      class="w-64"
    />
    <Select.Root type="single" value={selectedType} onValueChange={(v) => selectedType = v}>
      <Select.Trigger class="w-40">
        {selectedType ? (selectedType === "all" ? "All Types" : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)) : "Filter by type"}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="all">All Types</Select.Item>
        <Select.Item value="text">Text</Select.Item>
        <Select.Item value="number">Number</Select.Item>
        <Select.Item value="date">Date</Select.Item>
        <Select.Item value="currency">Currency</Select.Item>
        <Select.Item value="boolean">Boolean</Select.Item>
        <Select.Item value="image">Image</Select.Item>
      </Select.Content>
    </Select.Root>
  </div>

  <!-- Variables Grid -->
  {#if $customTemplateVariablesStore.loading}
    <div class="text-center py-8">Loading custom variables...</div>
  {:else if filteredVariables.length === 0}
    <Card>
      <CardContent class="text-center py-8">
        <Icon icon="lucide:variable" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 class="text-lg font-medium mb-2">No custom variables found</h3>
        <p class="text-muted-foreground mb-4">
          {searchQuery || selectedType !== 'all' ? 'Try adjusting your search or filters.' : 'Create your first custom variable to get started.'}
        </p>
        {#if !searchQuery && selectedType === 'all'}
          <Button onclick={openCreateDialog}>
            <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
            Create Variable
          </Button>
        {/if}
      </CardContent>
    </Card>
  {:else}
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredVariables as variable (variable.key)}
        {@const currentVar = variable as TemplateVariable}
        <Card class="hover:shadow-md transition-shadow">
          <CardHeader>
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <CardTitle class="text-lg">{currentVar.label}</CardTitle>
                <CardDescription class="mt-1 font-mono text-sm">
                  {currentVar.key}
                </CardDescription>
              </div>
              <Badge class={getTypeColor(currentVar.type)}>
                {currentVar.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              {#if currentVar.description}
                <p class="text-sm text-muted-foreground">{currentVar.description}</p>
              {/if}
              <div class="flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:check-circle" class="h-4 w-4 mr-2" />
                {currentVar.required ? 'Required' : 'Optional'}
              </div>
              <div class="flex items-center text-sm text-muted-foreground">
                <Icon icon="lucide:bar-chart" class="h-4 w-4 mr-2" />
                Used in {currentVar.usageCount} templates
              </div>
              {#if currentVar.defaultValue}
                <div class="text-sm">
                  <span class="font-medium">Default:</span> {currentVar.defaultValue}
                </div>
              {/if}
            </div>

            <div class="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onclick={() => openEditDialog(currentVar)}>
                <Icon icon="lucide:edit" class="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onclick={() => handleDeleteVariable(currentVar)}>
                <Icon icon="lucide:trash" class="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Variable Dialog -->
<Dialog bind:open={showCreateDialog}>
  <DialogContent class="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Create Custom Variable</DialogTitle>
      <DialogDescription>
        Add a new custom variable that can be used in your document templates.
      </DialogDescription>
    </DialogHeader>
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="key">Variable Key</Label>
        <Input
          id="key"
          bind:value={formKey}
          placeholder="e.g., customField1"
        />
      </div>
      <div class="space-y-2">
        <Label for="label">Label</Label>
        <Input
          id="label"
          bind:value={formLabel}
          placeholder="e.g., Custom Field 1"
        />
      </div>
      <div class="space-y-2">
        <Label for="type">Type</Label>
        <Select.Root type="single" value={formType} onValueChange={(v) => formType = v as any}>
          <Select.Trigger>
            {formType ? formType.charAt(0).toUpperCase() + formType.slice(1) : "Select type"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="text">Text</Select.Item>
            <Select.Item value="number">Number</Select.Item>
            <Select.Item value="date">Date</Select.Item>
            <Select.Item value="currency">Currency</Select.Item>
            <Select.Item value="boolean">Boolean</Select.Item>
            <Select.Item value="image">Image</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div class="space-y-2">
        <Label for="description">Description (Optional)</Label>
        <Textarea
          id="description"
          bind:value={formDescription}
          placeholder="Describe what this variable is for..."
          rows={3}
        />
      </div>
      <div class="flex items-center space-x-2">
        <input
          type="checkbox"
          id="required"
          bind:checked={formRequired}
          class="rounded"
        />
        <Label for="required">Required variable</Label>
      </div>
      <div class="space-y-2">
        <Label for="defaultValue">Default Value (Optional)</Label>
        <Input
          id="defaultValue"
          bind:value={formDefaultValue}
          placeholder="Default value for this variable"
        />
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <Button variant="outline" onclick={() => showCreateDialog = false}>
        Cancel
      </Button>
      <Button onclick={handleCreateVariable}>
        Create Variable
      </Button>
    </div>
  </DialogContent>
</Dialog>

<!-- Edit Variable Dialog -->
<Dialog bind:open={showEditDialog}>
  <DialogContent class="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Edit Custom Variable</DialogTitle>
      <DialogDescription>
        Update the custom variable settings.
      </DialogDescription>
    </DialogHeader>
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="edit-key">Variable Key</Label>
        <Input
          id="edit-key"
          bind:value={formKey}
          placeholder="e.g., customField1"
        />
      </div>
      <div class="space-y-2">
        <Label for="edit-label">Label</Label>
        <Input
          id="edit-label"
          bind:value={formLabel}
          placeholder="e.g., Custom Field 1"
        />
      </div>
      <div class="space-y-2">
        <Label for="edit-type">Type</Label>
        <Select.Root type="single" value={formType} onValueChange={(v) => formType = v as any}>
          <Select.Trigger>
            {formType ? formType.charAt(0).toUpperCase() + formType.slice(1) : "Select type"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="text">Text</Select.Item>
            <Select.Item value="number">Number</Select.Item>
            <Select.Item value="date">Date</Select.Item>
            <Select.Item value="currency">Currency</Select.Item>
            <Select.Item value="boolean">Boolean</Select.Item>
            <Select.Item value="image">Image</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div class="space-y-2">
        <Label for="edit-description">Description (Optional)</Label>
        <Textarea
          id="edit-description"
          bind:value={formDescription}
          placeholder="Describe what this variable is for..."
          rows={3}
        />
      </div>
      <div class="flex items-center space-x-2">
        <input
          type="checkbox"
          id="edit-required"
          bind:checked={formRequired}
          class="rounded"
        />
        <Label for="edit-required">Required variable</Label>
      </div>
      <div class="space-y-2">
        <Label for="edit-defaultValue">Default Value (Optional)</Label>
        <Input
          id="edit-defaultValue"
          bind:value={formDefaultValue}
          placeholder="Default value for this variable"
        />
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <Button variant="outline" onclick={() => showEditDialog = false}>
        Cancel
      </Button>
      <Button onclick={handleUpdateVariable}>
        Update Variable
      </Button>
    </div>
  </DialogContent>
</Dialog>