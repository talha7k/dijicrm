<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Label } from "$lib/components/ui/label";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import Icon from "@iconify/svelte";
  import type { DocumentRequirement, DocumentTemplate } from "$lib/types/document";
  import AlertDialog from "./alert-dialog.svelte";

  interface Props {
    requirement: Partial<DocumentRequirement>;
    templates: DocumentTemplate[];
    onSave: (requirement: Partial<DocumentRequirement>) => void;
    onCancel: () => void;
  }

  let { requirement, templates, onSave, onCancel }: Props = $props();

   let formData = $state({
     templateId: requirement?.templateId || "",
     isMandatory: requirement?.isMandatory ?? true,
     conditions: requirement?.conditions || [],
   });

   // Dialog state
   let showAlertDialog = $state(false);
   let alertTitle = $state('');
   let alertMessage = $state('');

   function handleSave() {
     if (!formData.templateId) {
       alertTitle = "Validation Error";
       alertMessage = "Please select a document template";
       showAlertDialog = true;
       return;
     }

    const requirementData: Partial<DocumentRequirement> = {
      ...requirement,
      templateId: formData.templateId,
      isMandatory: formData.isMandatory,
      conditions: formData.conditions,
    };

    onSave(requirementData);
  }

  function getTemplateName(templateId: string): string {
    const template = templates.find(t => t.id === templateId);
    return template?.name || "Unknown Template";
  }
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-lg">
      {requirement?.id ? "Edit Document Requirement" : "Add Document Requirement"}
    </CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    <div>
      <Label for="template-select">Document Template</Label>
      <Select.Root type="single" bind:value={formData.templateId}>
        <Select.Trigger class="w-full">
          {templates.find(t => t.id === formData.templateId)?.name || "Select a document template"}
        </Select.Trigger>
        <Select.Content>
          {#each templates as template (template.id)}
            <Select.Item value={template.id}>
              {template.name} - {template.type}
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <div class="flex items-center space-x-2">
      <Checkbox id="mandatory" bind:checked={formData.isMandatory} />
      <Label for="mandatory">This document is mandatory</Label>
    </div>

    <div class="flex justify-end gap-2">
      <Button variant="outline" onclick={onCancel}>
        Cancel
      </Button>
      <Button onclick={handleSave}>
        <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
        {requirement?.id ? "Update" : "Add"} Requirement
      </Button>
    </div>
  </CardContent>

  <!-- Alert Dialog -->
  <AlertDialog
    bind:open={showAlertDialog}
    title={alertTitle}
    message={alertMessage}
    type="error"
  />
</Card>