<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Checkbox } from "$lib/components/ui/checkbox";

  import Icon from "@iconify/svelte";
  import type { Product } from "$lib/hooks/useProducts";

  interface Props {
    product?: Partial<Product>;
  }

  let { product }: Props = $props();

  const dispatch = createEventDispatcher();

  let formData = $state({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "service",
    price: product?.price || undefined,
    isActive: product?.isActive ?? true,
  });

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
      <Select type="single" bind:value={formData.category}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="service">Service</SelectItem>
          <SelectItem value="product">Product</SelectItem>
          <SelectItem value="subscription">Subscription</SelectItem>
        </SelectContent>
      </Select>
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