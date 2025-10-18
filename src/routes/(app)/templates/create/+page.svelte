<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import DashboardLayout from '$lib/components/shared/dashboard-layout.svelte';
  import TemplateEditDialog from '$lib/components/app/template/template-edit-dialog.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { toast } from 'svelte-sonner';
  import Icon from '@iconify/svelte';
  import { requireCompany } from '$lib/utils/auth';
  import { documentTemplatesStore } from '$lib/stores/documentTemplates';
  import { customTemplateVariablesStore } from '$lib/stores/customTemplateVariables';
  import { auth } from '$lib/firebase';
  import type { DocumentTemplate } from '$lib/types/document';

  let mounted = $state(false);
  let showEditor = $state(false);
  let selectedTemplate = $state<DocumentTemplate | null>(null);

  import { sampleTemplates } from '$lib/data/sampleTemplates';

   onMount(() => {
     mounted = true;
     // Company access is checked at layout level
   });

  function handleUseSampleTemplate(template: any) {
    selectedTemplate = {
      id: '',
      companyId: '',
      name: template.name,
      description: template.description,
      type: template.type,
      htmlContent: template.htmlContent.trim(),
      placeholders: template.placeholders,
      isActive: true,
      version: 1,
      createdBy: '',
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
      tags: template.tags
    };
    showEditor = true;
  }

  function handleCreateBlank() {
    selectedTemplate = null;
    showEditor = true;
  }

  async function handleTemplateSave(template: DocumentTemplate) {
    try {
      console.log('Saving template:', template);
      
      // Clean up the template data before saving
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }

      const templateData = {
        name: template.name,
        description: template.description,
        type: template.type,
        htmlContent: template.htmlContent,
        placeholders: template.placeholders || [],
        isActive: template.isActive ?? true,
        version: template.version ?? 1,
        tags: template.tags || [],
        createdBy: userId
      };

      console.log('Cleaned template data:', templateData);

      // If this is a sample template, create custom variables from its placeholders
      if (template.placeholders && template.placeholders.length > 0) {
        try {
          const { analyzeTemplateVariables } = await import('$lib/services/variableDetectionService');
          const analysis = analyzeTemplateVariables(template.htmlContent, []);
          
          // Create custom variables for new variables detected
          if (analysis.newVariables.length > 0) {
            console.log('Creating custom variables from sample template:', analysis.newVariables);
            for (const variable of analysis.newVariables) {
              try {
                await customTemplateVariablesStore.createCustomVariable({
                  key: variable.key,
                  label: variable.label,
                  type: variable.type,
                  description: variable.description,
                  required: variable.required,
                  category: 'custom'
                });
              } catch (varError) {
                console.warn('Failed to create custom variable:', variable.key, varError);
                // Continue even if one variable fails
              }
            }
            toast.success(`Created ${analysis.newVariables.length} custom variables from template`);
          }
        } catch (analysisError) {
          console.warn('Failed to analyze template variables:', analysisError);
          // Continue with template save even if analysis fails
        }
      }

      if (template.id && template.id !== '') {
        // Update existing template
        console.log('Updating existing template:', template.id);
        await documentTemplatesStore.updateTemplate(template.id, templateData);
        toast.success('Template updated successfully!');
      } else {
        // Create new template
        console.log('Creating new template');
        const templateId = await documentTemplatesStore.createTemplate(templateData);
        console.log('Template created with ID:', templateId);
        toast.success('Template created successfully!');
      }
      // Navigate back to templates list
      goto('/templates');
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

function handleTemplatePreview(template: DocumentTemplate) {
     // Preview is handled internally by TemplateEditor component
     console.log('Preview template:', template);
   }

  function handleCancel() {
    if (showEditor) {
      showEditor = false;
      selectedTemplate = null;
    } else {
      goto('/templates');
    }
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
  {#if showEditor}
    <DashboardLayout title="Create Template" description="Design your document template">
      <div class="py-4">
        <TemplateEditDialog
          initialTemplate={selectedTemplate}
          onSave={handleTemplateSave}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  {:else}
    <DashboardLayout title="Create Template" description="Choose a template to start with or create from scratch">
      <div class="space-y-6">
        <!-- Create Blank Template -->
        <Card>
          <CardHeader>
            <CardTitle>Start from Scratch</CardTitle>
            <CardDescription>Create a completely custom template</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onclick={handleCreateBlank}>
              <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
              Create Blank Template
            </Button>
          </CardContent>
        </Card>

        <!-- Sample Templates -->
        <div>
          <h2 class="text-xl font-semibold mb-4">Sample Templates</h2>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each sampleTemplates as template}
              <Card class="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <CardTitle class="text-base">{template.name}</CardTitle>
                      <CardDescription class="mt-1 text-sm">
                        {template.description}
                      </CardDescription>
                    </div>
                    <Badge class={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div class="space-y-2">
                    <div class="flex items-center text-xs text-muted-foreground">
                      <Icon icon="lucide:code" class="h-3 w-3 mr-1" />
                      {template.placeholders.length} placeholders
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
                  <Button
                    size="sm"
                    class="w-full mt-3"
                    onclick={() => handleUseSampleTemplate(template)}
                  >
                    <Icon icon="lucide:edit" class="h-3 w-3 mr-1" />
                    Use This Template
                  </Button>
                </CardContent>
              </Card>
            {/each}
          </div>
        </div>
      </div>
    </DashboardLayout>
  {/if}
{/if}