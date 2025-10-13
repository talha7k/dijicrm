<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Label } from "$lib/components/ui/label";
  import { Badge } from "$lib/components/ui/badge";

  import Icon from "@iconify/svelte";
  import type { DocumentRequirement } from "$lib/types/document";
  import type { Product } from "$lib/hooks/useProducts";

  interface Props {
    products: Product[];
    templates: any[]; // TODO: Import proper type
    requirement?: Partial<DocumentRequirement>;
  }

  let { products, templates, requirement }: Props = $props();

  const dispatch = createEventDispatcher();

  let formData = $state({
    productId: requirement?.productId || "",
    templateId: requirement?.templateId || "",
    isMandatory: requirement?.isMandatory ?? true,
    conditions: requirement?.conditions || [],
  });

  function handleSave() {
    if (!formData.productId || !formData.templateId) {
      alert("Please select both a product and template");
      return;
    }

    const requirementData: Partial<DocumentRequirement> = {
      ...formData,
      companyId: "company-1", // TODO: Get from auth context
    };

    dispatch("save", requirementData);
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

<div class="space-y-6">
  <div class="grid grid-cols-2 gap-4">
    <div>
      <Label for="product-select">Product/Service</Label>
      <Select type="single" bind:value={formData.productId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a product or service" />
        </SelectTrigger>
        <SelectContent>
          {#each products as product (product.id)}
            <SelectItem value={product.id}>
              <div class="flex items-center gap-2">
                <span>{product.name}</span>
                <Badge class={getProductColor(product.category)}>{product.category}</Badge>
              </div>
            </SelectItem>
          {/each}
        </SelectContent>
      </Select>
    </div>

    <div>
      <Label for="template-select">Required Document</Label>
      <Select type="single" bind:value={formData.templateId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a document template" />
        </SelectTrigger>
        <SelectContent>
          {#each templates as template (template.id)}
            <SelectItem value={template.id}>
              <div class="flex items-center gap-2">
                <span>{template.name}</span>
                <Badge variant="outline">{template.type}</Badge>
              </div>
            </SelectItem>
          {/each}
        </SelectContent>
      </Select>
    </div>
  </div>

  <div class="flex items-center space-x-2">
    <Checkbox id="mandatory" bind:checked={formData.isMandatory} />
    <Label for="mandatory">This document is mandatory</Label>
  </div>

  <!-- TODO: Add conditions UI -->

  <div class="flex justify-end gap-2">
    <Button variant="outline" onclick={() => dispatch("cancel")}>
      Cancel
    </Button>
    <Button onclick={handleSave}>
      <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
      Save Requirement
    </Button>
  </div>
</div>