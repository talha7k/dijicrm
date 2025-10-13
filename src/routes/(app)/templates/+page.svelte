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

  import Icon from '@iconify/svelte';
  import { requireCompany } from '$lib/utils/auth';
  import { useDocumentTemplates } from '$lib/hooks/useDocumentTemplates';
  import type { DocumentTemplate } from '$lib/types/document';

  let mounted = $state(false);
  let searchQuery = $state('');
  let selectedType = $state('all');
  let showCreateDialog = $state(false);

  onMount(() => {
    mounted = true;
    if (!requireCompany()) {
      return;
    }
  });

  let templates = useDocumentTemplates();

  let filteredTemplates = $derived((): DocumentTemplate[] => {
    if (!$templates.data) return [];

    return $templates.data.filter((template: DocumentTemplate) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || template.type === selectedType;

      return matchesSearch && matchesType;
    });
  });

  function handleCreateTemplate() {
    showCreateDialog = true;
  }

  function handleTemplateSave(template: DocumentTemplate) {
    // TODO: Save template to Firebase
    console.log('Saving template:', template);
    showCreateDialog = false;
    // Refresh templates list
    templates = useDocumentTemplates();
  }

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
      templates = useDocumentTemplates();
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
        <Select type="single" bind:value={selectedType}>
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

      <Dialog bind:open={showCreateDialog}>
        <DialogTrigger>
          <Button onclick={handleCreateTemplate}>
            <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </DialogTrigger>
        <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create an HTML template with dynamic placeholders for document generation.
            </DialogDescription>
          </DialogHeader>
          <TemplateEditor
            on:save={(e) => handleTemplateSave(e.detail)}
            on:preview={(e) => handleTemplatePreview(e.detail)}
            on:cancel={() => showCreateDialog = false}
          />
        </DialogContent>
      </Dialog>
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
            <Button onclick={handleCreateTemplate}>
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