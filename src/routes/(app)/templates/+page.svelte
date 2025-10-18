<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import DashboardLayout from '$lib/components/shared/dashboard-layout.svelte';

  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';

  import * as Select from '$lib/components/ui/select/index.js';
  import { toast } from 'svelte-sonner';

   import Icon from '@iconify/svelte';
   import { requireCompany } from '$lib/utils/auth';
   import { documentTemplatesStore } from '$lib/stores/documentTemplates';
   import { companyContext } from '$lib/stores/companyContext';
   import ConfirmDialog from '$lib/components/shared/confirm-dialog.svelte';
   import TemplatePreviewDialog from '$lib/components/shared/template-preview-dialog.svelte';
   import CustomVariableManagement from '$lib/components/app/template/CustomVariableManagement.svelte';
   import type { DocumentTemplate } from '$lib/types/document';

  let mounted = $state(false);
  let searchQuery = $state('');
  let selectedType = $state('all');
  let activeTab = $state('templates');

   let showPreviewDialog = $state(false);
    let templateToPreview = $state<DocumentTemplate | null>(null);

    // Dialog state
    let showConfirmDialog = $state(false);
    let confirmTitle = $state('');
    let confirmMessage = $state('');
    let templateToDelete = $state<any>(null);



   onMount(async () => {
     mounted = true;
     
     // Wait for company context to be ready before loading templates
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
     
     documentTemplatesStore.loadTemplates();
   });

    // Watch for company context changes (for navigation between companies)
    $effect(() => {
      if (mounted && $companyContext.data && !$companyContext.loading) {
        // Only reload if templates aren't already loaded or company changed
        if (!$documentTemplatesStore.data || $documentTemplatesStore.data.length === 0) {
          documentTemplatesStore.loadTemplates();
        }
      }
    });

   let filteredTemplates = $state<DocumentTemplate[]>([]);

// Compute filtered templates when dependencies change
    $effect(() => {
      if (!$documentTemplatesStore.data) {
        filteredTemplates = [];
        return;
      }

      const filtered = $documentTemplatesStore.data.filter((template: DocumentTemplate) => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              template.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'all' || template.type === selectedType;
        
        return matchesSearch && matchesType;
      });
      
      filteredTemplates = filtered;
    });



 function handleTemplatePreview(template: DocumentTemplate) {
      templateToPreview = template;
      showPreviewDialog = true;
    }



function handleEditTemplate(template: DocumentTemplate) {
      goto(`/templates/${template.id}/edit`);
    }

function handleDeleteTemplate(template: any) {
      // Check if template has a valid ID before showing delete dialog
      if (!template.id || template.id === '') {
        toast.error('Cannot delete template: Invalid template ID');
        return;
      }
      
      templateToDelete = template;
      confirmTitle = "Delete Template";
      confirmMessage = `Are you sure you want to delete "${template.name}"?`;
      showConfirmDialog = true;
    }

    async function handleConfirmDelete() {
      if (templateToDelete) {
        try {
          // Check if template has a valid ID
          if (!templateToDelete.id || templateToDelete.id === '') {
            toast.error('Cannot delete template: Invalid template ID');
            templateToDelete = null;
            return;
          }
          
          await documentTemplatesStore.deleteTemplate(templateToDelete.id);
          toast.success('Template deleted successfully!');
          templateToDelete = null;
        } catch (error) {
          console.error('Failed to delete template:', error);
          toast.error('Failed to delete template');
        }
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
   <DashboardLayout title="Document Templates" description="Create and manage HTML templates for orders and documents">
     <Tabs value={activeTab} onValueChange={(value) => activeTab = value}>
       <TabsList class="grid w-full grid-cols-2">
         <TabsTrigger value="templates">Templates</TabsTrigger>
         <TabsTrigger value="variables">Custom Variables</TabsTrigger>
       </TabsList>

       <TabsContent value="templates" class="mt-6">
         <!-- Header Actions -->
         <div class="flex justify-between items-center">
           <div class="flex gap-4">
             <Input
               bind:value={searchQuery}
               placeholder="Search templates..."
               class="w-64"
             />
             <Select.Root type="single" value={selectedType} onValueChange={(v) => selectedType = v}>
               <Select.Trigger class="w-40">
                 {selectedType ? (selectedType === "all" ? "All Types" : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)) : "Filter by type"}
               </Select.Trigger>
               <Select.Content>
                 <Select.Item value="all">All Types</Select.Item>
                 <Select.Item value="order">Invoice</Select.Item>
                 <Select.Item value="legal">Legal</Select.Item>
                 <Select.Item value="business">Business</Select.Item>
                 <Select.Item value="custom">Custom</Select.Item>
               </Select.Content>
             </Select.Root>
           </div>

            <div class="flex gap-2">
               <Button onclick={() => goto('/templates/create')}>
                 <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
                 Create Template
               </Button>
             </div>
          </div>

         <!-- Templates Grid -->
         <div class="mt-6">
         {#if $companyContext.loading}
          <div class="text-center py-8">Loading company context...</div>
        {:else if $companyContext.error}
          <Card>
            <CardContent class="text-center py-8">
              <Icon icon="lucide:alert-circle" class="h-12 w-12 mx-auto text-destructive mb-4" />
              <h3 class="text-lg font-medium mb-2">Company Context Error</h3>
              <p class="text-muted-foreground">{$companyContext.error}</p>
            </CardContent>
          </Card>
        {:else if $documentTemplatesStore.loading}
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
               <Button onclick={() => goto('/templates/create')}>
                 <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
                 Create Template
               </Button>
             {/if}
           </CardContent>
         </Card>
       {:else}
         <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {#each filteredTemplates as template (template.id)}
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
         </TabsContent>

       <TabsContent value="variables" class="mt-6">
         <CustomVariableManagement />
       </TabsContent>
     </Tabs>

      <!-- Preview Template Dialog -->
      <TemplatePreviewDialog bind:open={showPreviewDialog} template={templateToPreview} />

     <!-- Confirm Dialog -->
     <ConfirmDialog
       bind:open={showConfirmDialog}
       title={confirmTitle}
       message={confirmMessage}
       type="danger"
       onconfirm={handleConfirmDelete}
     />
   </DashboardLayout>
 {/if}