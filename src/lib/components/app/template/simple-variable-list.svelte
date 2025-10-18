<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import Icon from '@iconify/svelte';
  import { getSystemVariables } from '$lib/services/variableCatalogService';
  import type { VariableCatalogEntry } from '$lib/types/templateVariable';

  interface Props {
    showCopyButton?: boolean;
    maxHeight?: string;
    showCommonOnly?: boolean;
  }

  let { showCopyButton = true, maxHeight = '300px', showCommonOnly = false }: Props = $props();

  let variables = $state<VariableCatalogEntry[]>([]);

  // Load variables on mount
  $effect(() => {
    const allVariables = getSystemVariables();
    variables = showCommonOnly 
      ? allVariables.filter(v => v.isCommon)
      : allVariables;
  });

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
      <Icon icon="lucide:list" class="h-5 w-5" />
      {showCommonOnly ? 'Common Variables' : 'All Variables'}
    </CardTitle>
    <CardDescription>
      {showCommonOnly 
        ? 'Frequently used system variables for quick access'
        : 'All available system variables for your templates'
      }
    </CardDescription>
  </CardHeader>
  <CardContent>
    <!-- Variables List -->
    <div class="space-y-2" style="max-height: {maxHeight}; overflow-y: auto;">
      {#each variables as variable}
        <div class="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors">
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
            <div class="text-sm font-medium text-foreground truncate">
              {variable.label}
            </div>
            <div class="text-xs text-muted-foreground truncate">
              {variable.description}
            </div>
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

      {#if variables.length === 0}
        <div class="text-center py-8 text-muted-foreground">
          <Icon icon="lucide:inbox" class="h-8 w-8 mx-auto mb-2" />
          <p>No variables available.</p>
        </div>
      {/if}
    </div>

    <!-- Quick Usage Info -->
    <div class="mt-4 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
      <div class="flex items-center gap-2 mb-1">
        <Icon icon="lucide:info" class="h-3 w-3" />
        <span class="font-medium">Quick Usage:</span>
      </div>
      <ul class="space-y-1 ml-5">
        <li>• Click copy to add {'{{variable}}'} to your template</li>
        <li>• System variables are auto-populated during generation</li>
        <li>• Common variables are used in most templates</li>
      </ul>
    </div>
  </CardContent>
</Card>