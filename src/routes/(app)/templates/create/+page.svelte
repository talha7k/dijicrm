<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import DashboardLayout from '$lib/components/shared/dashboard-layout.svelte';
  import TemplateEditor from '$lib/components/shared/template-editor.svelte';
  import { requireCompany } from '$lib/utils/auth';
  import type { DocumentTemplate } from '$lib/types/document';

  let mounted = $state(false);

   onMount(() => {
     mounted = true;
     // Company access is checked at layout level
   });

  function handleTemplateSave(template: DocumentTemplate) {
    // TODO: Save template to Firebase
    console.log('Saving template:', template);
    // Navigate back to templates list
    goto('/templates');
  }

  function handleTemplatePreview(template: DocumentTemplate) {
    // TODO: Show preview modal
    console.log('Preview template:', template);
  }

  function handleCancel() {
    goto('/templates');
  }
</script>

{#if mounted}
  <TemplateEditor
    on:save={(e) => handleTemplateSave(e.detail)}
    on:preview={(e) => handleTemplatePreview(e.detail)}
    on:cancel={handleCancel}
  />
{/if}