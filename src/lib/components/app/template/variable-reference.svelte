<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import Icon from '@iconify/svelte';
  import { getSystemVariables, searchSystemVariables, getVariablesByType } from '$lib/services/variableCatalogService';
  import type { VariableCatalogEntry } from '$lib/types/templateVariable';

  interface Props {
    showCopyButton?: boolean;
    maxHeight?: string;
  }

  let { showCopyButton = true, maxHeight = '400px' }: Props = $props();

  let searchQuery = $state('');
  let selectedType = $state('all');
  let variables = $state<VariableCatalogEntry[]>([]);

  // Load variables on mount
  $effect(() => {
    variables = getSystemVariables();
  });

  // Filter variables based on search and type
  let filteredVariables = $derived(() => {
    let filtered = variables;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchSystemVariables(searchQuery.trim());
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = getVariablesByType(filtered, selectedType);
    }

    return filtered;
  });

  // Group variables by category
  let groupedVariables = $derived(() => {
    return filteredVariables().reduce((acc: Record<string, VariableCatalogEntry[]>, variable: VariableCatalogEntry) => {
      const category = variable.category || 'system';
      if (!acc[category]) acc[category] = [];
      acc[category].push(variable);
      return acc;
    }, {} as Record<string, VariableCatalogEntry[]>);
  });

  const variableExample = '{{variableName}}';

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-purple-100 text-purple-800';
      case 'currency': return 'bg-yellow-100 text-yellow-800';
      case 'boolean': return 'bg-red-100 text-red-800';
      case 'image': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'text': return 'lucide:type';
      case 'number': return 'lucide:hash';
      case 'date': return 'lucide:calendar';
      case 'currency': return 'lucide:dollar-sign';
      case 'boolean': return 'lucide:toggle-left';
      case 'image': return 'lucide:image';
      default: return 'lucide:help-circle';
    }
  }
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center gap-2">
      <Icon icon="lucide:database" class="h-5 w-5" />
      Variable Reference
    </CardTitle>
    <CardDescription>
      Available system variables you can use in your templates. Click to copy.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <!-- Search and Filter -->
    <div class="space-y-3 mb-4">
      <div class="relative">
        <Icon icon="lucide:search" class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          bind:value={searchQuery}
          placeholder="Search variables..."
          class="pl-10"
        />
      </div>
      
      <div class="flex gap-2 flex-wrap">
        <Button
          variant={selectedType === 'all' ? 'default' : 'outline'}
          size="sm"
          onclick={() => selectedType = 'all'}
        >
          All
        </Button>
        <Button
          variant={selectedType === 'text' ? 'default' : 'outline'}
          size="sm"
          onclick={() => selectedType = 'text'}
        >
          Text
        </Button>
        <Button
          variant={selectedType === 'number' ? 'default' : 'outline'}
          size="sm"
          onclick={() => selectedType = 'number'}
        >
          Number
        </Button>
        <Button
          variant={selectedType === 'date' ? 'default' : 'outline'}
          size="sm"
          onclick={() => selectedType = 'date'}
        >
          Date
        </Button>
        <Button
          variant={selectedType === 'currency' ? 'default' : 'outline'}
          size="sm"
          onclick={() => selectedType = 'currency'}
        >
          Currency
        </Button>
      </div>
    </div>

    <!-- Variables List -->
    <div class="space-y-4" style="max-height: {maxHeight}; overflow-y: auto;">
      {#each Object.entries(groupedVariables) as [category, categoryVariables]}
        <div>
          <h4 class="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wide">
            {category === 'system' ? 'System Variables' : category}
          </h4>
          <div class="space-y-2">
            {#each categoryVariables as variable}
              <div class="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <code class="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {'{{' + variable.key + '}}'}
                    </code>
                    <Badge class={getTypeColor(variable.type)} variant="secondary">
                      <Icon icon={getTypeIcon(variable.type)} class="h-3 w-3 mr-1" />
                      {variable.type}
                    </Badge>
                    {#if variable.isCommon}
                      <Badge variant="outline" class="text-xs">
                        <Icon icon="lucide:star" class="h-3 w-3 mr-1" />
                        Common
                      </Badge>
                    {/if}
                  </div>
                  <div class="text-sm font-medium text-foreground mb-1">
                    {variable.label}
                  </div>
                  <div class="text-xs text-muted-foreground mb-2">
                    {variable.description}
                  </div>
                  {#if variable.exampleValue}
                    <div class="text-xs text-muted-foreground">
                      <span class="font-medium">Example:</span> 
                      <code class="bg-muted px-1 py-0.5 rounded">
                        {typeof variable.exampleValue === 'string' 
                          ? variable.exampleValue 
                          : JSON.stringify(variable.exampleValue)}
                      </code>
                    </div>
                  {/if}
                </div>
                
                {#if showCopyButton}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => copyToClipboard(`{{${variable.key}}}`)}
                    class="shrink-0"
                    title="Copy variable"
                  >
                    <Icon icon="lucide:copy" class="h-4 w-4" />
                  </Button>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}

      {#if filteredVariables.length === 0}
        <div class="text-center py-8 text-muted-foreground">
          <Icon icon="lucide:search-x" class="h-8 w-8 mx-auto mb-2" />
          <p>No variables found matching your criteria.</p>
        </div>
      {/if}
    </div>

    <!-- Usage Tips -->
    <div class="mt-4 p-3 bg-muted/50 rounded-lg">
      <h5 class="font-medium text-sm mb-2">Usage Tips:</h5>
      <ul class="text-xs text-muted-foreground space-y-1">
        <li>• Use double curly braces: <code>{variableExample}</code></li>
        <li>• System variables are auto-populated during document generation</li>
        <li>• Common variables are frequently used in most templates</li>
        <li>• Click the copy button to quickly add variables to your template</li>
      </ul>
    </div>
  </CardContent>
</Card>