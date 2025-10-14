<script lang="ts">
  import { onMount } from "svelte";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "$lib/components/ui/dialog";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";

  import Icon from "@iconify/svelte";
  import { requireCompany } from "$lib/utils/auth";
  import { documentRequirementsStore } from "$lib/stores/documentRequirements";
  import { productsStore } from "$lib/stores/products";
  import { documentTemplatesStore } from "$lib/stores/documentTemplates";
  import DocumentRequirementForm from "$lib/components/shared/document-requirement-form.svelte";
  import type { DocumentRequirement } from "$lib/types/document";
  import type { Product } from "$lib/stores/products";

  let mounted = $state(false);
  let searchQuery = $state("");
  let selectedProduct = $state("all");
  let showCreateDialog = $state(false);

   onMount(() => {
     mounted = true;
     // Company access is checked at layout level
   });

  let requirementsStore = documentRequirementsStore;

  let templatesStore = documentTemplatesStore;

  let filteredRequirements = $derived(() => {
    if (!$requirementsStore.data) return [];

    return $requirementsStore.data.filter((req: DocumentRequirement) => {
      const product = $productsStore.data?.find((p: Product) => p.id === req.productId);
      const template = $templatesStore.data?.find((t: any) => t.id === req.templateId);

      const matchesSearch =
        product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template?.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProduct = selectedProduct === "all" || req.productId === selectedProduct;

      return matchesSearch && matchesProduct;
    });
  });

  function handleCreateRequirement() {
    showCreateDialog = true;
  }

  function handleRequirementSave(requirement: Partial<DocumentRequirement>) {
    // TODO: Save requirement
    console.log("Saving requirement:", requirement);
    showCreateDialog = false;
    // TODO: Refresh requirements list when Firebase integration is added
  }

  function handleEditRequirement(requirement: DocumentRequirement) {
    // TODO: Open edit dialog
    console.log("Edit requirement:", requirement);
  }

  function handleDeleteRequirement(requirement: DocumentRequirement) {
    if (confirm(`Are you sure you want to delete this requirement?`)) {
      // TODO: Delete requirement
      console.log("Delete requirement:", requirement);
      // TODO: Refresh requirements list when Firebase integration is added
    }
  }

  function getProductName(productId: string): string {
    return $productsStore.data?.find((p: Product) => p.id === productId)?.name || "Unknown Product";
  }

  function getTemplateName(templateId: string): string {
    return $templatesStore.data?.find((t: any) => t.id === templateId)?.name || "Unknown Template";
  }

  function getProductColor(category: string): string {
    switch (category) {
      case "service": return "bg-blue-100 text-blue-800";
      case "product": return "bg-green-100 text-green-800";
      case "subscription": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }
</script>

{#if mounted}
  <DashboardLayout title="Document Requirements" description="Configure which documents are required for each product or service">
    <!-- Header Actions -->
    <div class="flex justify-between items-center">
      <div class="flex gap-4">
        <Input
          bind:value={searchQuery}
          placeholder="Search requirements..."
          class="w-64"
        />
        <Select type="single" bind:value={selectedProduct}>
          <SelectTrigger class="w-48">
            <SelectValue placeholder="Filter by product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {#each $productsStore.data || [] as product (product.id)}
              <SelectItem value={product.id}>{product.name}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>

      <Dialog bind:open={showCreateDialog}>
        <DialogTrigger>
          <Button onclick={handleCreateRequirement}>
            <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
            Add Requirement
          </Button>
        </DialogTrigger>
        <DialogContent class="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Document Requirement</DialogTitle>
            <DialogDescription>
              Configure which documents are required when clients purchase specific products or services.
            </DialogDescription>
          </DialogHeader>
          <DocumentRequirementForm
            products={$productsStore.data || []}
            templates={$templatesStore.data || []}
            on:save={(e) => handleRequirementSave(e.detail)}
            on:cancel={() => showCreateDialog = false}
          />
        </DialogContent>
      </Dialog>
    </div>

    <!-- Requirements Grid -->
    {#if $requirementsStore.loading}
      <div class="text-center py-8">Loading requirements...</div>
    {:else if filteredRequirements().length === 0}
      <Card>
        <CardContent class="text-center py-8">
          <Icon icon="lucide:clipboard-list" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 class="text-lg font-medium mb-2">No document requirements found</h3>
          <p class="text-muted-foreground mb-4">
            {searchQuery || selectedProduct !== "all" ? "Try adjusting your search or filters." : "Create your first document requirement to get started."}
          </p>
          {#if !searchQuery && selectedProduct === "all"}
            <Button onclick={handleCreateRequirement}>
              <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          {/if}
        </CardContent>
      </Card>
    {:else}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each filteredRequirements() as requirement (requirement.id)}
          <Card class="hover:shadow-md transition-shadow">
            <CardHeader>
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <CardTitle class="text-lg">{getTemplateName(requirement.templateId)}</CardTitle>
                  <CardDescription class="mt-1">
                    Required for: {getProductName(requirement.productId)}
                  </CardDescription>
                </div>
                <div class="flex gap-2">
                  {#if requirement.isMandatory}
                    <Badge variant="destructive">Required</Badge>
                  {:else}
                    <Badge variant="secondary">Optional</Badge>
                  {/if}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <div class="flex items-center text-sm text-muted-foreground">
                  <Icon icon="lucide:package" class="h-4 w-4 mr-2" />
                  {getProductName(requirement.productId)}
                </div>
                <div class="flex items-center text-sm text-muted-foreground">
                  <Icon icon="lucide:file-text" class="h-4 w-4 mr-2" />
                  {getTemplateName(requirement.templateId)}
                </div>
                {#if requirement.conditions && requirement.conditions.length > 0}
                  <div class="flex items-center text-sm text-muted-foreground">
                    <Icon icon="lucide:filter" class="h-4 w-4 mr-2" />
                    {requirement.conditions.length} condition{requirement.conditions.length > 1 ? "s" : ""}
                  </div>
                {/if}
              </div>

              <div class="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onclick={() => handleEditRequirement(requirement)}>
                  <Icon icon="lucide:edit" class="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onclick={() => handleDeleteRequirement(requirement)}>
                  <Icon icon="lucide:trash" class="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        {/each}
      </div>
    {/if}
  </DashboardLayout>
{/if}