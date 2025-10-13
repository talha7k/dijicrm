<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Icon from '@iconify/svelte';

  let {
    title,
    value,
    description,
    icon
  } = $props<{
    title: string;
    value: string | number;
    description?: string;
    icon?: string;
  }>();
</script>

<Card>
  <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle class="text-sm font-medium">{title}</CardTitle>
    {#if icon}
      <Icon icon={icon} class="h-4 w-4 text-muted-foreground" />
    {/if}
  </CardHeader>
  <CardContent>
    <div class="text-2xl font-bold">{value}</div>
    {#if description}
      <p class="text-xs text-muted-foreground">{description}</p>
    {/if}
  </CardContent>
</Card>