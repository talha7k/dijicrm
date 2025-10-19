<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import DashboardLayout from '$lib/components/shared/dashboard-layout.svelte';
  import TemplateEditDialog from '$lib/components/app/template/template-edit-dialog.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { toast } from 'svelte-sonner';
  import Icon from '@iconify/svelte';
  import { requireCompany } from '$lib/utils/auth';
  import { documentTemplatesStore, getDocumentTemplate } from '$lib/stores/documentTemplates';
  import { companyContext } from '$lib/stores/companyContext';
  import type { DocumentTemplate } from '$lib/types/document';

  let mounted = $state(false);
  let template = $state<DocumentTemplate | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

   onMount(async () => {
     mounted = true;
     
     // Wait for company context to be ready before loading template
     if (!$companyContext.data || $companyContext.loading) {
       await new Promise<void>((resolve) => {
         const unsubscribe = companyContext.subscribe((value) => {
           if (value.data && !value.loading) {
             unsubscribe();
             resolve();
           }
         });
       });
     }
     
     loadTemplate();
   });

  async function loadTemplate() {
    try {
      const templateId = $page.params.id;

      if (!templateId) {
        error = 'Template ID is required';
        loading = false;
        return;
      }

       // Company context should be ready now due to the onMount wait

      // Load the specific template
      const templates = await getDocumentTemplate(templateId);

      if (!templates) {
        error = 'Template not found';
        loading = false;
        return;
      }

      template = templates;
      loading = false;
    } catch (err) {
      console.error('Failed to load template:', err);
      error = 'Failed to load template';
      loading = false;
    }
  }

  async function handleTemplateSave(updatedTemplate: DocumentTemplate) {
    try {
      console.log('Saving template:', updatedTemplate);

      if (template?.id) {
        // Update existing template
        await documentTemplatesStore.updateTemplate(template.id, updatedTemplate);
        toast.success('Template updated successfully!');
      } else {
        // This shouldn't happen in edit mode, but handle it just in case
        toast.error('Template ID is missing');
        return;
      }

      // Navigate back to templates list
      goto('/templates');
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  function handleCancel() {
    goto('/templates');
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

{#if mounted}
  <DashboardLayout title="Edit Template" description="Update your document template">
    {#if loading}
      <div class="text-center py-8">
        <Icon icon="lucide:loader-2" class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Loading template...</p>
      </div>
    {:else if error}
      <Card>
        <CardContent class="text-center py-8">
          <Icon icon="lucide:alert-circle" class="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 class="text-lg font-medium mb-2">Error</h3>
          <p class="text-muted-foreground mb-4">{error}</p>
          <Button onclick={() => goto('/templates')}>
            <Icon icon="lucide:arrow-left" class="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </CardContent>
      </Card>
    {:else if template}
      <div class="space-y-6">
        <!-- Template Info Header -->
        <Card>
          <CardHeader>
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <CardTitle class="text-2xl">{template.name}</CardTitle>
                <CardDescription class="mt-2">
                  {template.description || 'No description'}
                </CardDescription>
              </div>
              <Badge class={getTypeColor(template.type)}>
                {template.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">Version:</span>
                <span class="ml-2 font-medium">v{template.version}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Placeholders:</span>
                <span class="ml-2 font-medium">{template.placeholders.length}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Status:</span>
                <span class="ml-2 font-medium">{template.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Tags:</span>
                <span class="ml-2 font-medium">{template.tags?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Template Editor -->
        <TemplateEditDialog
          initialTemplate={template}
          showPrintPreview={true}
          onSave={handleTemplateSave}
          onCancel={handleCancel}
        />
      </div>
    {/if}
  </DashboardLayout>
{/if}