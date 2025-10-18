<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';

  import Icon from '@iconify/svelte';

  interface Props {
    screenCss?: string;
    printCss?: string;
    showTemplates?: boolean;
  }

  let { 
    screenCss = '', 
    printCss = '', 
    showTemplates = true 
  }: Props = $props();

  let screenCssValue = $state(screenCss);
  let printCssValue = $state(printCss);
  let activeTab = $state<'screen' | 'print'>('screen');

  // CSS Templates
  const cssTemplates = {
    screen: [
      {
        name: 'Basic Invoice',
        css: `/* Basic Invoice Styles */
.invoice {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.company-info {
  margin-bottom: 20px;
}

.invoice-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.items-table th,
.items-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.items-table th {
  background-color: #f5f5f5;
}

.total-section {
  text-align: right;
  margin-top: 20px;
}`
      },
      {
        name: 'Modern Business',
        css: `/* Modern Business Styles */
.document {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.content {
  background: #f9f9f9;
  padding: 30px;
  border-radius: 8px;
}

.section {
  margin-bottom: 25px;
}

.label {
  font-weight: 600;
  color: #555;
  margin-bottom: 5px;
}

.value {
  font-size: 16px;
  margin-bottom: 15px;
}`
      },
      {
        name: 'Minimal Clean',
        css: `/* Minimal Clean Styles */
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #2c3e50;
  line-height: 1.6;
}

.container {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
}

.section {
  margin-bottom: 40px;
}

.title {
  font-size: 24px;
  font-weight: 300;
  margin-bottom: 10px;
  border-bottom: 1px solid #ecf0f1;
  padding-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.info-item {
  margin-bottom: 10px;
}

.info-label {
  font-size: 12px;
  text-transform: uppercase;
  color: #7f8c8d;
  margin-bottom: 2px;
}`
      }
    ],
    print: [
      {
        name: 'Print Optimized',
        css: `/* Print Optimized Styles */
@media print {
  body {
    font-size: 12pt;
    line-height: 1.4;
    color: black;
    background: white;
  }
  
  .no-print {
    display: none !important;
  }
  
  .page-break {
    page-break-before: always;
  }
  
  .avoid-break {
    page-break-inside: avoid;
  }
  
  table {
    page-break-inside: auto;
  }
  
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  
  td {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  
  thead {
    display: table-header-group;
  }
  
  tfoot {
    display: table-footer-group;
  }
}`
      },
      {
        name: 'Invoice Print',
        css: `/* Invoice Print Styles */
@media print {
  @page {
    margin: 0.5in;
    size: A4;
  }
  
  body {
    font-family: 'Times New Roman', serif;
    font-size: 11pt;
    color: black;
  }
  
  .invoice-header {
    text-align: center;
    margin-bottom: 30pt;
  }
  
  .invoice-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20pt;
  }
  
  .invoice-table th,
  .invoice-table td {
    border: 1pt solid black;
    padding: 6pt;
    text-align: left;
  }
  
  .invoice-table th {
    background-color: #f0f0f0;
    font-weight: bold;
  }
  
  .total-section {
    text-align: right;
    margin-top: 20pt;
    font-weight: bold;
  }
  
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 9pt;
    color: #666;
  }
}`
      },
      {
        name: 'Compact Print',
        css: `/* Compact Print Styles */
@media print {
  @page {
    margin: 0.25in;
    size: A4;
  }
  
  body {
    font-family: Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.2;
    color: black;
  }
  
  .compact {
    margin: 0;
    padding: 0;
  }
  
  .compact-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
  }
  
  .compact-table th,
  .compact-table td {
    border: 0.5pt solid black;
    padding: 3pt;
  }
  
  .small-text {
    font-size: 8pt;
  }
  
  .no-border {
    border: none !important;
  }
  
  .align-right {
    text-align: right;
  }
  
  .align-center {
    text-align: center;
  }
}`
      }
    ]
  };

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  function applyTemplate(template: any) {
    if (activeTab === 'screen') {
      screenCssValue = template.css;
    } else {
      printCssValue = template.css;
    }
  }

  function clearCss() {
    if (activeTab === 'screen') {
      screenCssValue = '';
    } else {
      printCssValue = '';
    }
  }

  // Expose values for parent component
  $effect(() => {
    // This allows parent components to access the CSS values
    if (typeof window !== 'undefined') {
      (window as any).templateCss = {
        screen: screenCssValue,
        print: printCssValue
      };
    }
  });
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <Icon icon="lucide:code" class="h-5 w-5" />
      CSS Styling
    </CardTitle>
    <CardDescription>
      Add custom CSS for screen and print styles to enhance your template appearance
    </CardDescription>
  </CardHeader>
  <CardContent>
    <!-- Tab Navigation -->
    <div class="flex gap-2 mb-4">
      <Button
        variant={activeTab === 'screen' ? 'default' : 'outline'}
        size="sm"
        onclick={() => activeTab = 'screen'}
      >
        <Icon icon="lucide:monitor" class="h-4 w-4 mr-2" />
        Screen CSS
      </Button>
      <Button
        variant={activeTab === 'print' ? 'default' : 'outline'}
        size="sm"
        onclick={() => activeTab = 'print'}
      >
        <Icon icon="lucide:printer" class="h-4 w-4 mr-2" />
        Print CSS
      </Button>
    </div>

    <!-- CSS Templates -->
    {#if showTemplates}
      <div class="mb-4">
        <h4 class="font-medium text-sm mb-2">CSS Templates:</h4>
        <div class="flex flex-wrap gap-2">
          {#each cssTemplates[activeTab] as template}
            <Button
              variant="outline"
              size="sm"
              onclick={() => applyTemplate(template)}
              class="text-xs"
            >
              {template.name}
            </Button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- CSS Text Areas -->
    <div class="space-y-4">
      {#if activeTab === 'screen'}
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm font-medium">Screen CSS</div>
            <div class="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onclick={() => copyToClipboard(screenCssValue)}
                disabled={!screenCssValue}
              >
                <Icon icon="lucide:copy" class="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onclick={clearCss}
                disabled={!screenCssValue}
              >
                <Icon icon="lucide:trash-2" class="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
          <Textarea
            bind:value={screenCssValue}
            placeholder="Enter CSS for screen display..."
            rows={12}
            class="font-mono text-sm"
          />
          <div class="text-xs text-muted-foreground mt-1">
            Applied to template when viewed on screen or in preview
          </div>
        </div>
      {:else}
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm font-medium">Print CSS</div>
            <div class="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onclick={() => copyToClipboard(printCssValue)}
                disabled={!printCssValue}
              >
                <Icon icon="lucide:copy" class="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onclick={clearCss}
                disabled={!printCssValue}
              >
                <Icon icon="lucide:trash-2" class="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
          <Textarea
            bind:value={printCssValue}
            placeholder="Enter CSS for print display... (use @media print)"
            rows={12}
            class="font-mono text-sm"
          />
          <div class="text-xs text-muted-foreground mt-1">
            Applied when generating PDF or printing documents
          </div>
        </div>
      {/if}
    </div>

    <!-- CSS Tips -->
    <div class="mt-4 p-3 bg-muted/50 rounded-lg">
      <h5 class="font-medium text-sm mb-2">CSS Tips:</h5>
      <ul class="text-xs text-muted-foreground space-y-1">
        <li>• Use <code>@media print</code> in print CSS for print-specific styles</li>
        <li>• Screen CSS affects preview and on-screen display</li>
        <li>• Print CSS affects PDF generation and printing</li>
        <li>• Use templates for common styling patterns</li>
        <li>• Test both screen and print outputs for best results</li>
      </ul>
    </div>

    <!-- Character Count -->
    <div class="mt-2 flex justify-between text-xs text-muted-foreground">
      <span>
        {activeTab === 'screen' ? 'Screen' : 'Print'} CSS: 
        {(activeTab === 'screen' ? screenCssValue : printCssValue).length} characters
      </span>
      <span>
        Total CSS: {screenCssValue.length + printCssValue.length} characters
      </span>
    </div>
  </CardContent>
</Card>