 <script lang="ts">
   import { createEventDispatcher } from "svelte";
   import { Button } from "$lib/components/ui/button";
   import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
   import { Input } from "$lib/components/ui/input";
   import { Label } from "$lib/components/ui/label";
   import { Textarea } from "$lib/components/ui/textarea";
   import { Badge } from "$lib/components/ui/badge";
   import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "$lib/components/ui/dialog";
   import { toast } from "svelte-sonner";
   import type { DocumentTemplate } from "$lib/types/document";
   import { Timestamp } from "@firebase/firestore";
   import BasicEditor from "./basic-editor.svelte";
   import TemplatePreviewDialog from '$lib/components/shared/template-preview-dialog.svelte';
   import { companyContext } from "$lib/stores/companyContext";
   import Icon from '@iconify/svelte';

   interface Props {
     initialTemplate?: DocumentTemplate | null;
     showPrintPreview?: boolean;
     onSave: (template: DocumentTemplate) => void;
     onCancel: () => void;
   }

   let {
     initialTemplate = null,
     showPrintPreview = true,
     onSave,
     onCancel
   }: Props = $props();

   const dispatch = createEventDispatcher();

   // Form state
   let template: DocumentTemplate = $state(initialTemplate || {
     id: "",
     companyId: "",
     name: "",
     description: "",
     type: "custom",
     isActive: true,
     version: 1,
     createdBy: "",
     createdAt: Timestamp.now(),
     updatedAt: Timestamp.now(),
     htmlContent: "",
     placeholders: [],
     tags: [],
   });

   let editorContent = $state(initialTemplate?.htmlContent || "");
   let validationErrors: string[] = $state([]);
   let validationWarnings: string[] = $state([]);
   let showTemplatePreviewDialog = $state(false);
   let previewTemplate = $state<DocumentTemplate | null>(null);

   // Update template when editor content changes
   $effect(() => {
     if (editorContent !== template.htmlContent) {
       template = {
         ...template,
         htmlContent: editorContent,
         updatedAt: Timestamp.now(),
       };
     }
   });

   function handleSave() {
     // Basic validation
     if (!template.name.trim()) {
       toast.error("Template name is required");
       return;
     }

     if (!template.htmlContent.trim()) {
       toast.error("Template content is required");
       return;
     }

     // Set company ID from context if available
     if ($companyContext.data?.companyId) {
       template.companyId = $companyContext.data.companyId;
     }

     onSave(template);
   }

   function handlePreview() {
     previewTemplate = template;
     showTemplatePreviewDialog = true;
   }
 </script>

 <div class="space-y-6">
   <!-- Template Form -->
   <Card>
     <CardHeader>
       <CardTitle>{initialTemplate ? 'Edit Template' : 'Create Template'}</CardTitle>
       <CardDescription>
         Configure your document template with HTML content and variable placeholders.
       </CardDescription>
     </CardHeader>
     <CardContent class="space-y-4">
       <div class="grid gap-4 md:grid-cols-2">
         <div>
           <Label for="template-name">Template Name</Label>
           <Input
             id="template-name"
             bind:value={template.name}
             placeholder="e.g., Professional Invoice"
           />
         </div>
         <div>
           <Label for="template-type">Template Type</Label>
           <select
             id="template-type"
             bind:value={template.type}
             class="w-full px-3 py-2 border rounded-md"
           >
             <option value="order">Order/Invoice</option>
             <option value="legal">Legal Document</option>
             <option value="business">Business Document</option>
             <option value="custom">Custom</option>
           </select>
         </div>
       </div>

       <div>
         <Label for="template-description">Description</Label>
         <Textarea
           id="template-description"
           bind:value={template.description}
           placeholder="Describe what this template is used for..."
           rows={3}
         />
       </div>

       <div class="flex items-center gap-2">
         <input
           type="checkbox"
           id="template-active"
           bind:checked={template.isActive}
         />
         <Label for="template-active">Active</Label>
       </div>
     </CardContent>
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
         showCssEditor={false}
         {showPrintPreview}
         bind:content={editorContent}
       />
     </CardContent>
   </Card>

   <!-- Actions -->
   <div class="flex justify-between">
     <Button variant="outline" onclick={onCancel}>
       Cancel
     </Button>
     <div class="flex gap-2">
       <Button variant="outline" onclick={handlePreview}>
         <Icon icon="lucide:eye" class="h-4 w-4 mr-2" />
         Preview
       </Button>
       <Button onclick={handleSave}>
         <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
         {initialTemplate ? 'Update' : 'Create'} Template
       </Button>
     </div>
   </div>
 </div>

 <!-- Template Preview Dialog -->
 <Dialog open={showTemplatePreviewDialog}>
   <DialogContent class="max-w-6xl max-h-[90vh] overflow-auto">
     <DialogHeader>
       <DialogTitle>Template Preview</DialogTitle>
       <DialogDescription>
         Preview how your template will look when rendered with sample data.
       </DialogDescription>
     </DialogHeader>
     {#if previewTemplate}
       <TemplatePreviewDialog open={showTemplatePreviewDialog} template={previewTemplate} />
     {/if}
   </DialogContent>
 </Dialog>