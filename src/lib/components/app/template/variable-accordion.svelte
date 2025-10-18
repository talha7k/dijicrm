<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import * as Collapsible from "$lib/components/ui/collapsible";
  import * as Table from "$lib/components/ui/table";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import SearchIcon from "@lucide/svelte/icons/search";
  import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import VariableIcon from "@lucide/svelte/icons/variable";
  import { SYSTEM_VARIABLE_CATALOG, type VariableCatalogEntry, type TemplateVariable } from "$lib/types/templateVariable";

  let { 
    customVariables = [], 
    onVariableInsert = () => {}, 
    searchable = true, 
    showCopyButton = true, 
    expandedCategories = ["system"]
  }: {
    customVariables?: TemplateVariable[];
    onVariableInsert?: (variableKey: string) => void;
    searchable?: boolean;
    showCopyButton?: boolean;
    expandedCategories?: string[];
  } = $props();

  const dispatch = createEventDispatcher();

  let searchTerm = $state("");
  let openSections = $state(new Set(expandedCategories));

  // Group system variables by logical categories
  const systemVariableGroups = {
    "Date & Time": SYSTEM_VARIABLE_CATALOG.filter(v => 
      v.key.includes("Date") || v.key.includes("Time") || v.key.includes("current")
    ),
    "Document & Order": SYSTEM_VARIABLE_CATALOG.filter(v => 
      v.key.includes("order") || v.key.includes("document") || v.key.includes("item")
    ),
    "Financial": SYSTEM_VARIABLE_CATALOG.filter(v => 
      v.key.includes("Amount") || v.key.includes("total") || v.key.includes("discount") || v.key.includes("currency")
    ),
    "Compliance": SYSTEM_VARIABLE_CATALOG.filter(v => 
      v.key.includes("zatca") || v.key.includes("vat") || v.key.includes("cr")
    ),
    "Status & Location": SYSTEM_VARIABLE_CATALOG.filter(v => 
      v.key.includes("Status") || v.key.includes("City") || v.key.includes("Country")
    )
  };

  // Group custom variables by type
  const customVariableGroups = {
    "Text": customVariables.filter(v => v.type === "text"),
    "Number": customVariables.filter(v => v.type === "number"),
    "Date": customVariables.filter(v => v.type === "date"),
    "Currency": customVariables.filter(v => v.type === "currency"),
    "Boolean": customVariables.filter(v => v.type === "boolean"),
    "Image": customVariables.filter(v => v.type === "image")
  };

  let filteredSystemGroups = $derived(Object.entries(systemVariableGroups).reduce((acc, [name, variables]) => {
    const filtered = variables.filter(v => 
      !searchTerm || 
      v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[name] = filtered;
    }
    return acc;
  }, {} as Record<string, VariableCatalogEntry[]>));

  let filteredCustomGroups = $derived(Object.entries(customVariableGroups).reduce((acc, [name, variables]) => {
    const filtered = variables.filter(v => 
      !searchTerm || 
      v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[name] = filtered;
    }
    return acc;
  }, {} as Record<string, TemplateVariable[]>));

  function toggleSection(sectionName: string) {
    if (openSections.has(sectionName)) {
      openSections.delete(sectionName);
    } else {
      openSections.add(sectionName);
    }
    openSections = new Set(openSections);
  }

  function insertVariable(variableKey: string) {
    onVariableInsert(variableKey);
    dispatch("variableInsert", { variableKey });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      dispatch("copy", { text });
    });
  }

  function getVariableTypeColor(type: string) {
    const colors: Record<string, string> = {
      text: "hsl(var(--primary))",
      number: "hsl(var(--chart-2))", 
      date: "hsl(var(--chart-3))",
      currency: "hsl(var(--chart-4))",
      boolean: "hsl(var(--chart-5))",
      image: "hsl(var(--chart-1))"
    };
    return colors[type] || "hsl(var(--muted))";
  }

  function getVariableTypeIcon(type: string) {
    // Could return different icons based on type
    return VariableIcon;
  }
</script>

<div class="w-full space-y-4">
  {#if searchable}
    <div class="relative">
      <SearchIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search variables..."
        bind:value={searchTerm}
        class="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
  {/if}

  <!-- System Variables Section -->
  <Collapsible.Root open={openSections.has("system")}>
    <Collapsible.Trigger onclick={() => toggleSection("system")} class="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
      <div class="flex items-center gap-2">
        <div class="transform transition-transform duration-200" class:rotate-90={openSections.has("system")}>
          <ChevronRightIcon class="h-4 w-4" />
        </div>
        <h3 class="font-semibold text-foreground">System Variables</h3>
        <Badge variant="secondary" class="text-xs">
          {SYSTEM_VARIABLE_CATALOG.length} variables
        </Badge>
      </div>
    </Collapsible.Trigger>
    
    <Collapsible.Content class="mt-2 space-y-3">
      {#each Object.entries(filteredSystemGroups) as [groupName, variables]}
        <Collapsible.Root open={openSections.has(groupName)}>
          <Collapsible.Trigger onclick={() => toggleSection(groupName)} class="flex items-center justify-between w-full p-2 bg-background border border-border rounded-md hover:bg-muted/50 transition-colors">
            <div class="flex items-center gap-2">
              <div class="transform transition-transform duration-200" class:rotate-90={openSections.has(groupName)}>
                <ChevronRightIcon class="h-3 w-3" />
              </div>
              <span class="text-sm font-medium text-foreground">{groupName}</span>
              <Badge variant="outline" class="text-xs">
                {variables.length}
              </Badge>
            </div>
          </Collapsible.Trigger>
          
          <Collapsible.Content class="mt-1">
            <Table.Root>
              <Table.Body>
                {#each variables as variable}
                  <Table.Row class="hover:bg-muted/50">
                    <Table.Cell class="py-2 px-3">
                      <div class="flex items-center gap-2">
                        <VariableIcon class="h-3 w-3" style="color: {getVariableTypeColor(variable.type)}" />
                        <div class="flex-1">
                          <div class="flex items-center gap-2">
                            <code class="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                              {variable.key}
                            </code>
                            {#if variable.isCommon}
                              <Badge variant="default" class="text-xs px-1.5 py-0">Common</Badge>
                            {/if}
                          </div>
                          <div class="text-xs text-muted-foreground mt-0.5">
                            {variable.label}
                          </div>
                        </div>
                        <div class="flex items-center gap-1">
                          {#if showCopyButton}
                            <Button
                              variant="ghost"
                              size="sm"
                              class="h-6 w-6 p-0"
                              onclick={() => copyToClipboard(`{{${variable.key}}}`)}
                              title="Copy variable"
                            >
                              <CopyIcon class="h-3 w-3" />
                            </Button>
                          {/if}
                          <Button
                            variant="ghost"
                            size="sm"
                            class="h-6 w-6 p-0"
                            onclick={() => insertVariable(variable.key)}
                            title="Insert variable"
                          >
                            <ChevronRightIcon class="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </Collapsible.Content>
        </Collapsible.Root>
      {/each}
    </Collapsible.Content>
  </Collapsible.Root>

  <!-- Custom Variables Section -->
  {#if customVariables.length > 0}
    <Collapsible.Root open={openSections.has("custom")}>
      <Collapsible.Trigger onclick={() => toggleSection("custom")} class="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
        <div class="flex items-center gap-2">
          <div class="transform transition-transform duration-200" class:rotate-90={openSections.has("custom")}>
            <ChevronRightIcon class="h-4 w-4" />
          </div>
          <h3 class="font-semibold text-foreground">Custom Variables</h3>
          <Badge variant="secondary" class="text-xs">
            {customVariables.length} variables
          </Badge>
        </div>
      </Collapsible.Trigger>
      
      <Collapsible.Content class="mt-2 space-y-3">
        {#each Object.entries(filteredCustomGroups) as [typeName, variables]}
          {#if variables.length > 0}
            <Collapsible.Root open={openSections.has(`custom-${typeName}`)}>
              <Collapsible.Trigger onclick={() => toggleSection(`custom-${typeName}`)} class="flex items-center justify-between w-full p-2 bg-background border border-border rounded-md hover:bg-muted/50 transition-colors">
                <div class="flex items-center gap-2">
                  <div class="transform transition-transform duration-200" class:rotate-90={openSections.has(`custom-${typeName}`)}>
                    <ChevronRightIcon class="h-3 w-3" />
                  </div>
                  <span class="text-sm font-medium text-foreground">{typeName}</span>
                  <Badge variant="outline" class="text-xs">
                    {variables.length}
                  </Badge>
                </div>
              </Collapsible.Trigger>
              
              <Collapsible.Content class="mt-1">
                <Table.Root>
                  <Table.Body>
                    {#each variables as variable}
                      <Table.Row class="hover:bg-muted/50">
                        <Table.Cell class="py-2 px-3">
                          <div class="flex items-center gap-2">
                            <VariableIcon class="h-3 w-3" style="color: {getVariableTypeColor(variable.type)}" />
                            <div class="flex-1">
                              <div class="flex items-center gap-2">
                                <code class="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                  {variable.key}
                                </code>
                                {#if variable.required}
                                  <Badge variant="destructive" class="text-xs px-1.5 py-0">Required</Badge>
                                {/if}
                              </div>
                              <div class="text-xs text-muted-foreground mt-0.5">
                                {variable.label}
                                {#if variable.description}
                                  • {variable.description}
                                {/if}
                              </div>

                            </div>
                            <div class="flex items-center gap-1">
                              {#if showCopyButton}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  class="h-6 w-6 p-0"
                                  onclick={() => copyToClipboard(`{{${variable.key}}}`)}
                                  title="Copy variable"
                                >
                                  <CopyIcon class="h-3 w-3" />
                                </Button>
                              {/if}
                              <Button
                                variant="ghost"
                                size="sm"
                                class="h-6 w-6 p-0"
                                onclick={() => insertVariable(variable.key)}
                                title="Insert variable"
                              >
                                <ChevronRightIcon class="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    {/each}
                  </Table.Body>
                </Table.Root>
              </Collapsible.Content>
            </Collapsible.Root>
          {/if}
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>
  {:else}
    <div class="text-center py-8 text-muted-foreground">
      <VariableIcon class="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p class="text-sm">No custom variables defined yet</p>
      <p class="text-xs mt-1">Custom variables will appear here once created</p>
    </div>
  {/if}
</div>

<style>
  .rotate-90 {
    transform: rotate(90deg);
  }
</style>