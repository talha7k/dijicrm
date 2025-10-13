<script lang="ts">
  import Icon from "@iconify/svelte";
  import { Badge } from "$lib/components/ui/badge";
  import type { DocumentRequirement } from "$lib/types/document";

  interface Props {
    requirements: DocumentRequirement[];
    compact?: boolean;
  }

  let { requirements, compact = false }: Props = $props();

  let mandatoryCount = $derived(requirements.filter(req => req.isMandatory).length);
  let optionalCount = $derived(requirements.filter(req => !req.isMandatory).length);
  let totalCount = $derived(requirements.length);
</script>

{#if totalCount === 0}
  <div class="flex items-center gap-2 text-muted-foreground">
    <Icon icon="lucide:file-x" class="h-4 w-4" />
    <span class="text-sm">No document requirements</span>
  </div>
{:else}
  <div class="flex items-center gap-2">
    <Icon icon="lucide:file-text" class="h-4 w-4 text-blue-600" />
    <div class="flex gap-1">
      {#if mandatoryCount > 0}
        <Badge variant="destructive" class="text-xs">
          {mandatoryCount} required
        </Badge>
      {/if}
      {#if optionalCount > 0}
        <Badge variant="secondary" class="text-xs">
          {optionalCount} optional
        </Badge>
      {/if}
    </div>
    {#if !compact}
      <span class="text-sm text-muted-foreground">
        ({totalCount} total)
      </span>
    {/if}
  </div>
{/if}