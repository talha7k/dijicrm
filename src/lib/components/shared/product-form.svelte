<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$lib/components/ui/collapsible";

  import Icon from "@iconify/svelte";
  import type { Product } from "$lib/stores/products";
  import type { DocumentRequirement, DocumentTemplate } from "$lib/types/document";
  import DocumentRequirementsSummary from "./document-requirements-summary.svelte";
  import DocumentRequirementEditor from "./document-requirement-editor.svelte";

  interface Props {
    product?: Partial<Product>;
    templates?: DocumentTemplate[];
  }

  let { product, templates = [] }: Props = $props();

  const dispatch = createEventDispatcher();

  let formData = $state({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "service",
    price: product?.price || undefined,
    isActive: product?.isActive ?? true,
    documentRequirements: product?.documentRequirements || [],
  });

  let showRequirementsEditor = $state(false);
  let editingRequirement = $state<Partial<DocumentRequirement> | null>(null);

  function handleSave() {
    if (!formData.name.trim()) {
      alert("Please enter a product/service name");
      return;
    }

    if (!formData.category) {
      alert("Please select a category");
      return;
    }

    const productData: Partial<Product> = {
      ...formData,
      companyId: "company-1", // TODO: Get from auth context
    };

    dispatch("save", productData);
  }

  function handleAddRequirement() {
    editingRequirement = {};
    showRequirementsEditor = true;
  }

  function handleEditRequirement(requirement: DocumentRequirement) {
    editingRequirement = { ...requirement };
    showRequirementsEditor = true;
  }

  function handleSaveRequirement(requirementData: Partial<DocumentRequirement>) {
    if (editingRequirement && editingRequirement.id) {
      // Update existing
      formData.documentRequirements = formData.documentRequirements.map(req =>
        req.id === editingRequirement!.id ? { ...req, ...requirementData } : req
      );
    } else {
      // Add new
      const newRequirement: DocumentRequirement = {
        id: `req-${Date.now()}`,
        companyId: "company-1", // TODO: Get from auth context
        productId: product?.id || "",
        ...requirementData,
      } as DocumentRequirement;
      formData.documentRequirements = [...formData.documentRequirements, newRequirement];
    }

    showRequirementsEditor = false;
    editingRequirement = null;
  }

  function handleDeleteRequirement(requirementId: string) {
    if (confirm("Are you sure you want to remove this document requirement?")) {
      formData.documentRequirements = formData.documentRequirements.filter(req => req.id !== requirementId);
    }
  }
</script>

<div class="space-y-6">
  <div class="grid grid-cols-2 gap-4">
    <div>
      <Label for="product-name">Name</Label>
      <Input
        id="product-name"
        bind:value={formData.name}
        placeholder="e.g., Web Development Service"
        required
      />
    </div>

    <div>
      <Label for="product-category">Category</Label>
      <Select.Root type="single" bind:value={formData.category}>
        <Select.Trigger class="w-full">
          {formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : "Select category"}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="service">Service</Select.Item>
          <Select.Item value="product">Product</Select.Item>
          <Select.Item value="subscription">Subscription</Select.Item>
        </Select.Content>
      </Select.Root>
    </div>
  </div>

  <div>
    <Label for="product-description">Description (Optional)</Label>
    <Textarea
      id="product-description"
      bind:value={formData.description}
      placeholder="Brief description of this product or service"
      rows={3}
    />
  </div>

  <div>
    <Label for="product-price">Price (Optional)</Label>
    <Input
      id="product-price"
      type="number"
      step="0.01"
      min="0"
      bind:value={formData.price}
      placeholder="Leave empty for contact pricing"
    />
  </div>

  <div class="flex items-center space-x-2">
    <Checkbox id="active" bind:checked={formData.isActive} />
    <Label for="active">This product/service is active and available</Label>
  </div>

  <!-- Document Requirements Section -->
  <Collapsible>
    <CollapsibleTrigger class="flex items-center justify-between w-full p-4 border rounded-lg hover:bg-muted/50">
      <div class="flex items-center gap-2">
        <Icon icon="lucide:file-text" class="h-5 w-5" />
        <span class="font-medium">Document Requirements</span>
        <DocumentRequirementsSummary requirements={formData.documentRequirements} compact />
      </div>
      <Icon icon="lucide:chevron-down" class="h-4 w-4" />
    </CollapsibleTrigger>
    <CollapsibleContent class="space-y-4 mt-4">
      {#if formData.documentRequirements.length > 0}
        <div class="space-y-2">
          {#each formData.documentRequirements as requirement (requirement.id)}
            <div class="flex items-center justify-between p-3 border rounded">
              <div class="flex items-center gap-2">
                <Icon icon="lucide:file-text" class="h-4 w-4 text-blue-600" />
                <span class="text-sm">
                  Template: {requirement.templateId}
                  {#if requirement.isMandatory}
                    <span class="text-red-600 font-medium">(Required)</span>
                  {:else}
                    <span class="text-muted-foreground">(Optional)</span>
                  {/if}
                </span>
              </div>
              <div class="flex gap-2">
                <Button variant="ghost" size="sm" onclick={() => handleEditRequirement(requirement)}>
                  <Icon icon="lucide:edit" class="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onclick={() => handleDeleteRequirement(requirement.id)}>
                  <Icon icon="lucide:trash" class="h-3 w-3" />
                </Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      {#if showRequirementsEditor}
        <DocumentRequirementEditor
          requirement={editingRequirement || {}}
          templates={templates}
          onSave={handleSaveRequirement}
          onCancel={() => { showRequirementsEditor = false; editingRequirement = null; }}
        />
      {:else}
        <Button variant="outline" onclick={handleAddRequirement}>
          <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
          Add Document Requirement
        </Button>
      {/if}
    </CollapsibleContent>
  </Collapsible>

  <div class="flex justify-end gap-2">
    <Button variant="outline" onclick={() => dispatch("cancel")}>
      Cancel
    </Button>
    <Button onclick={handleSave}>
      <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
      Save Product/Service
    </Button>
  </div>
</div>