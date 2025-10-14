<script lang="ts">
  import { onMount } from "svelte";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Badge } from "$lib/components/ui/badge";
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "$lib/components/ui/dialog";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";

   import Icon from "@iconify/svelte";
   import { requireCompany } from "$lib/utils/auth";
    import { productsStore } from "$lib/stores/products";
    import { documentTemplatesStore } from "$lib/stores/documentTemplates";
   import ProductForm from "$lib/components/shared/product-form.svelte";
   import DocumentRequirementsSummary from "$lib/components/shared/document-requirements-summary.svelte";
    import type { Product } from "$lib/stores/products";
   import type { DocumentTemplate } from "$lib/types/document";

  let mounted = $state(false);
  let searchQuery = $state("");
  let selectedCategory = $state("all");
  let showCreateDialog = $state(false);

   onMount(() => {
     mounted = true;
     // Company access is checked at layout level
   });


  let templatesStore = documentTemplatesStore;

  // Load data on mount
  $effect(() => {
    if (mounted) {
      const companyId = "company-1"; // TODO: Get from auth context
      productsStore.loadProducts(companyId);
    }
  });

  let filteredProducts = $derived(() => {
    if (!$productsStore.data) return [];

    return $productsStore.data.filter((product: Product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  });

  function handleCreateProduct() {
    showCreateDialog = true;
  }

  function handleProductSave(product: Partial<Product>) {
    // TODO: Save product
    console.log("Saving product:", product);
    showCreateDialog = false;
    // TODO: Refresh products list when Firebase integration is added
  }

  function handleEditProduct(product: Product) {
    // TODO: Open edit dialog
    console.log("Edit product:", product);
  }

  function handleDeleteProduct(product: Product) {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      // TODO: Delete product
      console.log("Delete product:", product);
      // TODO: Refresh products list when Firebase integration is added
    }
  }

  function getCategoryColor(category: string): string {
    switch (category) {
      case "service": return "bg-blue-100 text-blue-800";
      case "product": return "bg-green-100 text-green-800";
      case "subscription": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function formatPrice(price?: number): string {
    if (!price) return "Contact for pricing";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  }
</script>

{#if mounted}
  <DashboardLayout title="Products & Services" description="Manage the products and services offered by your company">
    <!-- Header Actions -->
    <div class="flex justify-between items-center">
      <div class="flex gap-4">
        <Input
          bind:value={searchQuery}
          placeholder="Search products..."
          class="w-64"
        />
        <Select type="single" bind:value={selectedCategory}>
          <SelectTrigger class="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="service">Services</SelectItem>
            <SelectItem value="product">Products</SelectItem>
            <SelectItem value="subscription">Subscriptions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog bind:open={showCreateDialog}>
        <DialogTrigger>
          <Button onclick={handleCreateProduct}>
            <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
            Add Product/Service
          </Button>
        </DialogTrigger>
        <DialogContent class="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Product/Service</DialogTitle>
            <DialogDescription>
              Add a new product or service that your company offers to clients.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            templates={$templatesStore.data}
            on:save={(e) => handleProductSave(e.detail)}
            on:cancel={() => showCreateDialog = false}
          />
        </DialogContent>
      </Dialog>
    </div>

    <!-- Products Grid -->
    {#if $productsStore.loading}
      <div class="text-center py-8">Loading products...</div>
    {:else if filteredProducts().length === 0}
      <Card>
        <CardContent class="text-center py-8">
          <Icon icon="lucide:package" class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 class="text-lg font-medium mb-2">No products found</h3>
          <p class="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== "all" ? "Try adjusting your search or filters." : "Create your first product or service to get started."}
          </p>
          {#if !searchQuery && selectedCategory === "all"}
            <Button onclick={handleCreateProduct}>
              <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
              Add Product/Service
            </Button>
          {/if}
        </CardContent>
      </Card>
    {:else}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each filteredProducts() as product (product.id)}
          <Card class="hover:shadow-md transition-shadow">
            <CardHeader>
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <CardTitle class="text-lg">{product.name}</CardTitle>
                  <CardDescription class="mt-1">
                    {product.description || "No description"}
                  </CardDescription>
                </div>
                <div class="flex gap-2">
                  <Badge class={getCategoryColor(product.category)}>
                    {product.category}
                  </Badge>
                  {#if !product.isActive}
                    <Badge variant="secondary">Inactive</Badge>
                  {/if}
                </div>
              </div>
            </CardHeader>
             <CardContent>
               <div class="space-y-3">
                 <div class="flex items-center text-sm text-muted-foreground">
                   <Icon icon="lucide:dollar-sign" class="h-4 w-4 mr-2" />
                   {formatPrice(product.price)}
                 </div>
                 <DocumentRequirementsSummary requirements={product.documentRequirements || []} />
               </div>

              <div class="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onclick={() => handleEditProduct(product)}>
                  <Icon icon="lucide:edit" class="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onclick={() => handleDeleteProduct(product)}>
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