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
      const { generatePreviewData, renderTemplate } = await import(
        "$lib/utils/template-validation"
      );
      const previewData = await generatePreviewData(template);
      const renderedHtml = renderTemplate(template, previewData);

      // Create isolated HTML document for preview
      previewHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {
  margin: 0;
  padding: 20px;
  font-family: Arial, sans-serif;
  color: #000;
  background: #fff;
}
.order-container { max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; color: #000; }
.order-header { margin-bottom: 30px; }
.company-info h2 { margin: 0 0 10px 0; font-size: 18px; color: #000; }
.company-info p { margin: 5px 0; color: #000; }
.billing-info { margin-bottom: 30px; }
.bill-to h3 { margin: 0 0 10px 0; font-size: 16px; color: #000; }
.order-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
.order-table th, .order-table td { border: 1px solid #ddd; padding: 8px; text-align: left; color: #000; }
.order-table th { background-color: #f5f5f5; font-weight: bold; color: #000; }
.totals { text-align: right; margin-bottom: 30px; }
.total-row { margin-bottom: 5px; color: #000; }
.total-row.total { font-weight: bold; font-size: 18px; color: #000; }
.order-footer { margin-top: 40px; text-align: center; color: #000; }
.contract-container { max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; color: #000; }
.contract-header { margin-bottom: 30px; }
.parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
.party { flex: 1; }
.party h3 { margin: 0 0 10px 0; font-size: 16px; color: #000; }
.party p { margin: 5px 0; color: #000; }
.contract-body h2 { margin: 20px 0 10px 0; color: #000; }
.contract-body p { margin: 10px 0; color: #000; }
.signatures { display: flex; justify-content: space-between; margin-top: 40px; }
.signature { flex: 1; text-align: center; }
.signature p { margin: 10px 0; color: #000; }
.legal-document { max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; color: #000; }
.document-header { margin-bottom: 30px; }
.document-header h1 { margin: 0 0 20px 0; color: #000; }
.document-header p { margin: 10px 0; color: #000; }
.principal-info, .attorney-info { margin-bottom: 20px; }
.principal-info h3, .attorney-info h3 { margin: 0 0 10px 0; color: #000; }
.principal-info p, .attorney-info p { margin: 5px 0; color: #000; }
.powers-granted { margin-bottom: 20px; }
.powers-granted h3 { margin: 0 0 10px 0; color: #000; }
.powers-granted p { margin: 10px 0; color: #000; }
.signature-block { margin-bottom: 20px; }
.signature-block p { margin: 10px 0; color: #000; }
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
