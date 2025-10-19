<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog";
  import type { DocumentTemplate } from "$lib/types/document";

  interface Props {
    open: boolean;
    template: DocumentTemplate | null;
  }

  let { open = $bindable(false), template }: Props = $props();

  let previewHtml = $state("");

  async function generatePreviewHtml(template: DocumentTemplate) {
     try {
       const { generatePreviewData } = await import(
         "$lib/utils/template-rendering"
       );
       const { renderTemplate } = await import(
         "$lib/utils/template-validation"
       );
       const previewData = await generatePreviewData();
       const renderedHtml = renderTemplate(template, previewData);

       // Create isolated HTML document for preview - use template's styles
       previewHtml = `<!DOCTYPE html>
 <html>
 <head>
 <meta charset="utf-8">
 <style>
 /* Minimal base styles for preview */
 body {
   margin: 0;
   padding: 20px;
   background: #fff;
   font-family: Arial, sans-serif;
 }
 /* Ensure the template's styles take precedence */
 </style>
 </head>
 <body>
 ${renderedHtml}
 </body>
 </html>`;
    } catch (error) {
      console.error("Error generating preview:", error);
      previewHtml =
        '<!DOCTYPE html><html><body><div style="color: red; padding: 20px;">Error generating preview</div></body></html>';
    }
  }

  // Generate preview when template changes
  $effect(() => {
    if (template) {
      generatePreviewHtml(template);
    }
  });
</script>

<Dialog bind:open>
  <DialogContent class="!max-w-6xl h-[90vh] overflow-y-auto flex flex-col">
    <DialogHeader>
      <DialogTitle>Template Preview</DialogTitle>
      <DialogDescription>
        Preview of how the document will appear when generated
      </DialogDescription>
    </DialogHeader>
    <div class="mt-4 flex-1">
      <iframe
        srcdoc={previewHtml}
        class="w-full h-full border rounded-lg shadow-sm overflow-y-auto"
        title="Template Preview"
      ></iframe>
    </div>
  </DialogContent>
</Dialog>
