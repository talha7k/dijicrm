<script lang="ts">
  let { title, description, children } = $props<{
    title: string;
    description?: string;
    children: any;
  }>();
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">{title}</h1>
    {#if description}
      <p class="text-muted-foreground">{description}</p>
    {/if}
  </div>

  {@render children()}
</div>