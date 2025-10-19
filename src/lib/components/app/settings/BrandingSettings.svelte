 <script lang="ts">
   import { onMount } from "svelte";
   import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
   import { Button } from "$lib/components/ui/button";
   import { Input } from "$lib/components/ui/input";
   import { Label } from "$lib/components/ui/label";
   import * as Select from "$lib/components/ui/select/index.js";
   import Icon from "@iconify/svelte";
   import { companyContext } from "$lib/stores/companyContext";
   import { get } from "svelte/store";
   import { brandingService } from "$lib/services/brandingService";
   import type { CompanyBranding } from "$lib/types/branding";

   interface Props {
     data?: {
       companyId?: string;
       company?: {
         name?: string;
         vatNumber?: string;
         settings?: {
           currency?: string;
           vatAmount?: number;
         };
       };
       brandingConfig?: CompanyBranding;
       smtpConfig?: any;
     };
     brandingData?: CompanyBranding | null;
   }

   let { data, brandingData }: Props = $props();

  // Branding configuration
  let branding = $state<CompanyBranding>({
    logoUrl: "",
    stampImageUrl: "",
    primaryColor: "#007bff",
    secondaryColor: "#6c757d",
  });

  // Logo upload state
  let selectedLogoFile = $state<File | null>(null);
  let isUploadingLogo = $state(false);
  let logoPreview = $state<string | null>(null);

  // Stamp image upload state
  let selectedStampFile = $state<File | null>(null);
  let isUploadingStamp = $state(false);
  let stampPreview = $state<string | null>(null);

  // Branding save state
  let isSavingBranding = $state(false);

  // Dialog state
  let showAlertDialog = $state(false);
  let showConfirmDialog = $state(false);
  let alertTitle = $state('');
  let alertMessage = $state('');
  let alertType = $state<'info' | 'success' | 'warning' | 'error'>('info');
  let confirmTitle = $state('');
  let confirmMessage = $state('');
  let pendingConfirmAction = $state<(() => void) | null>(null);

  // Helper functions for dialogs
  function showAlert(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    alertTitle = title;
    alertMessage = message;
    alertType = type;
    showAlertDialog = true;
  }

  function showConfirm(title: string, message: string, action: () => void) {
    confirmTitle = title;
    confirmMessage = message;
    pendingConfirmAction = action;
    showConfirmDialog = true;
  }

  function handleConfirm() {
    if (pendingConfirmAction) {
      pendingConfirmAction();
      pendingConfirmAction = null;
    }
  }

  // Helper function to get image dimensions
  function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not load image"));
      };

      img.src = url;
    });
  }

  async function handleLogoFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Validation
      const maxSize = 2 * 1024 * 1024; // 2MB
      const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
      const maxWidth = 2000;
      const maxHeight = 2000;

      if (file.size > maxSize) {
        showAlert("File Too Large", "File size must be less than 2MB.", "error");
        target.value = ""; // Clear the input
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        showAlert("Invalid File Type", "Please select a valid image file (JPEG, PNG, SVG, or WebP).", "error");
        target.value = ""; // Clear the input
        return;
      }

      // Check dimensions for non-SVG files
      if (file.type !== "image/svg+xml") {
        try {
          const dimensions = await getImageDimensions(file);
          if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
            showAlert("Image Too Large", `Image dimensions must be ${maxWidth}x${maxHeight} pixels or smaller. Selected image is ${dimensions.width}x${dimensions.height} pixels.`, "error");
            target.value = ""; // Clear the input
            return;
          }
        } catch (error) {
          console.warn("Could not validate image dimensions:", error);
          // Continue anyway - the upload will handle it
        }
      }

      selectedLogoFile = file;

      // Create preview for all file types including SVG
      const reader = new FileReader();
      reader.onload = (e) => {
        logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleStampFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Validation (smaller limits for stamps)
      const maxSize = 1 * 1024 * 1024; // 1MB
      const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
      const maxWidth = 500;
      const maxHeight = 500;

      if (file.size > maxSize) {
        showAlert("File Too Large", "File size must be less than 1MB.", "error");
        target.value = ""; // Clear the input
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        showAlert("Invalid File Type", "Please select a valid image file (JPEG, PNG, SVG, or WebP).", "error");
        target.value = ""; // Clear the input
        return;
      }

      // Check dimensions for non-SVG files
      if (file.type !== "image/svg+xml") {
        try {
          const dimensions = await getImageDimensions(file);
          if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
            showAlert("Image Too Large", `Image dimensions must be ${maxWidth}x${maxHeight} pixels or smaller. Selected image is ${dimensions.width}x${dimensions.height} pixels.`, "error");
            target.value = ""; // Clear the input
            return;
          }
        } catch (error) {
          console.warn("Could not validate image dimensions:", error);
          // Continue anyway - the upload will handle it
        }
      }

      selectedStampFile = file;

      // Create preview for all file types including SVG
      const reader = new FileReader();
      reader.onload = (e) => {
        stampPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

   async function handleLogoUpload() {
     // Prevent double-clicking if already processing
     if (isUploadingLogo || !selectedLogoFile) return;
     
     if (!selectedLogoFile) {
       showAlert("Validation Error", "Please select a logo file first.", "error");
       return;
     }

     // Get company ID from props data
     const companyContextValue = get(companyContext);
     const companyId = data?.companyId || companyContextValue.data?.companyId;

     if (!companyId) {
       showAlert("Authentication Error", "Company ID not available.", "error");
       return;
     }

     isUploadingLogo = true;

     try {
       const result = await brandingService.uploadLogo(companyId, selectedLogoFile);

       if (result.success && result.url) {
         // Update branding with new logo
         const updateResult = await brandingService.updateLogo(companyId, result.url);

         if (updateResult.success) {
           branding.logoUrl = result.url;
           logoPreview = result.url;
           selectedLogoFile = null;

           // Auto-save branding configuration after successful upload
           const saveResult = await brandingService.saveBranding(companyId, branding);
           if (saveResult.success) {
             showAlert("Success", "Logo uploaded and saved successfully!", "success");
           } else {
             showAlert("Upload Failed", `Logo uploaded but failed to save: ${saveResult.error}`, "error");
           }
         } else {
           showAlert("Upload Failed", `Failed to update branding: ${updateResult.error}`, "error");
         }
       } else {
         showAlert("Upload Failed", `Failed to upload logo: ${result.error}`, "error");
       }
     } catch (error) {
       console.error("Logo upload error:", error);
       showAlert("Upload Failed", "Failed to upload logo. Please try again.", "error");
     } finally {
       isUploadingLogo = false;
     }
   }

   async function handleStampUpload() {
     // Prevent double-clicking if already processing
     if (isUploadingStamp || !selectedStampFile) return;
     
     if (!selectedStampFile) {
       showAlert("Validation Error", "Please select a stamp image file first.", "error");
       return;
     }

     // Get company ID from props data
     const companyContextValue = get(companyContext);
     const companyId = data?.companyId || companyContextValue.data?.companyId;

     if (!companyId) {
       showAlert("Authentication Error", "Company ID not available.", "error");
       return;
     }

     isUploadingStamp = true;

     try {
       const result = await brandingService.uploadStampImage(companyId, selectedStampFile);

       if (result.success && result.url) {
         // Update branding with new stamp image
         const updateResult = await brandingService.updateStampImage(companyId, result.url);

         if (updateResult.success) {
           branding.stampImageUrl = result.url;
           stampPreview = result.url;
           selectedStampFile = null;

           // Auto-save branding configuration after successful upload
           const saveResult = await brandingService.saveBranding(companyId, branding);
           if (saveResult.success) {
             showAlert("Success", "Stamp image uploaded and saved successfully!", "success");
           } else {
             showAlert("Upload Failed", `Stamp image uploaded but failed to save: ${saveResult.error}`, "error");
           }
         } else {
           showAlert("Upload Failed", `Failed to update branding: ${updateResult.error}`, "error");
         }
       } else {
         showAlert("Upload Failed", `Failed to upload stamp image: ${result.error}`, "error");
       }
     } catch (error) {
       console.error("Stamp upload error:", error);
       showAlert("Upload Failed", "Failed to upload stamp image. Please try again.", "error");
     } finally {
       isUploadingStamp = false;
     }
   }

  async function handleSaveBranding() {
    // Prevent double-clicking if already processing
    if (isSavingBranding) return;
    
    // Get company ID from props data
    const companyContextValue = get(companyContext);
    const companyId = data?.companyId || companyContextValue.data?.companyId;

    if (!companyId) {
      showAlert("Authentication Error", "Company ID not available.", "error");
      return;
    }

    isSavingBranding = true;
    
    try {
      const result = await brandingService.saveBranding(companyId, branding);

      if (result.success) {
        showAlert("Success", "Branding configuration saved successfully!", "success");
      } else {
        showAlert("Save Failed", `Failed to save branding: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Save branding error:", error);
      showAlert("Save Failed", "Failed to save branding configuration. Please try again.", "error");
    } finally {
      isSavingBranding = false;
    }
  }

  async function handleDeleteLogo() {
    showConfirm(
      "Delete Logo",
      "Are you sure you want to delete the current logo? This action cannot be undone.",
      async () => {
        // Get company ID from props data
        const companyContextValue = get(companyContext);
        const companyId = data?.companyId || companyContextValue.data?.companyId;

        if (!companyId) {
          showAlert("Authentication Error", "Company ID not available.", "error");
          return;
        }

        try {
          // Update branding to remove logo URL
          const result = await brandingService.updateBranding(companyId, { logoUrl: "" });

          if (result.success) {
            branding.logoUrl = "";
            logoPreview = null;
            showAlert("Success", "Logo deleted successfully!", "success");
          } else {
            showAlert("Delete Failed", `Failed to delete logo: ${result.error}`, "error");
          }
        } catch (error) {
          console.error("Delete logo error:", error);
          showAlert("Delete Failed", "Failed to delete logo. Please try again.", "error");
        }
      }
    );
  }

  async function handleDeleteStamp() {
    showConfirm(
      "Delete Stamp Image",
      "Are you sure you want to delete the current stamp image? This action cannot be undone.",
      async () => {
        // Get company ID from props data
        const companyContextValue = get(companyContext);
        const companyId = data?.companyId || companyContextValue.data?.companyId;

        if (!companyId) {
          showAlert("Authentication Error", "Company ID not available.", "error");
          return;
        }

        try {
          // Update branding to remove stamp image URL
          const result = await brandingService.updateBranding(companyId, { stampImageUrl: "" });

          if (result.success) {
            branding.stampImageUrl = "";
            stampPreview = null;
            showAlert("Success", "Stamp image deleted successfully!", "success");
          } else {
            showAlert("Delete Failed", `Failed to delete stamp image: ${result.error}`, "error");
          }
        } catch (error) {
          console.error("Delete stamp error:", error);
          showAlert("Delete Failed", "Failed to delete stamp image. Please try again.", "error");
        }
      }
    );
  }

    // Initialize from parent - use onMount instead of $effect to avoid reactivity issues
    onMount(() => {
      if (brandingData) {
        branding = { ...branding, ...brandingData };
        if (brandingData.logoUrl) {
          logoPreview = brandingData.logoUrl;
        }
        if (brandingData.stampImageUrl) {
          stampPreview = brandingData.stampImageUrl;
        }
      }
    });
</script>

<Card>
  <CardHeader>
    <CardTitle>Company Branding</CardTitle>
    <CardDescription>Customize your company's logo and document branding</CardDescription>
  </CardHeader>
  <CardContent class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div class="space-y-4">
      <h4 class="text-sm font-medium">Document Stamp Image</h4>
      <div class="flex items-center space-x-4 p-4 border rounded-lg min-h-[100px]">
        {#if stampPreview}
          <img src={stampPreview} alt="Current document stamp preview" class="h-16 w-16 object-contain" />
          <div class="flex-1">
            <p class="text-sm text-muted-foreground">{selectedStampFile ? "New stamp preview" : "Current stamp"}</p>
          </div>
          {#if !selectedStampFile}
            <Button
              size="sm"
              variant="outline"
              onclick={handleDeleteStamp}
              class="text-destructive hover:text-destructive"
            >
              <Icon icon="lucide:trash-2" class="h-4 w-4 mr-2" />
              Delete
            </Button>
          {/if}
        {:else}
          <div class="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
            <Icon icon="lucide:image" class="h-8 w-8 text-muted-foreground" />
          </div>
          <div class="flex-1"><p class="text-sm text-muted-foreground">No stamp image has been uploaded.</p></div>
        {/if}
      </div>
      <div class="space-y-2">
        <Label for="stamp-upload">Upload Stamp Image</Label>
        <Input id="stamp-upload" type="file" accept="image/*" onchange={handleStampFileSelect} disabled={isUploadingStamp} />
        <p class="text-xs text-muted-foreground">Supported formats: JPEG, PNG, SVG, WebP. Maximum size: 1MB. Recommended: 500x500px or smaller.</p>
      </div>
      {#if selectedStampFile}
        <div class="flex items-center space-x-4">
          <Button onclick={handleStampUpload} disabled={isUploadingStamp} size="sm">
            {#if isUploadingStamp}
              <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" /> Uploading...
            {:else}
              <Icon icon="lucide:upload" class="h-4 w-4 mr-2" /> Upload Stamp Image
            {/if}
          </Button>
          <p class="text-sm text-muted-foreground">Selected: {selectedStampFile.name} ({(selectedStampFile.size / 1024 / 1024).toFixed(2)} MB)</p>
        </div>
      {/if}
    </div>

    

    <div class="space-y-4">
      <div class="space-y-4">
        <h4 class="text-sm font-medium">Company Logo</h4>
        <div class="flex items-center space-x-4 p-4 border rounded-lg min-h-[100px]">
          {#if logoPreview}
            <img src={logoPreview} alt="Company Logo" class="h-16 w-16 object-contain" />
            <div class="flex-1">
              <p class="text-sm text-muted-foreground">{selectedLogoFile ? "New logo preview" : "Current logo"}</p>
            </div>
            {#if !selectedLogoFile}
              <Button
                size="sm"
                variant="outline"
                onclick={handleDeleteLogo}
                class="text-destructive hover:text-destructive"
              >
                <Icon icon="lucide:trash-2" class="h-4 w-4 mr-2" />
                Delete
              </Button>
            {/if}
          {:else}
            <div class="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
              <Icon icon="lucide:image" class="h-8 w-8 text-muted-foreground" />
            </div>
            <div class="flex-1"><p class="text-sm text-muted-foreground">No logo has been uploaded.</p></div>
          {/if}
        </div>
        <div class="space-y-2">
          <Label for="logo-upload">Upload New Logo</Label>
          <Input id="logo-upload" type="file" accept="image/*" onchange={handleLogoFileSelect} disabled={isUploadingLogo} />
          <p class="text-xs text-muted-foreground">Supported formats: JPEG, PNG, SVG, WebP. Maximum size: 2MB.</p>
        </div>
        {#if selectedLogoFile}
          <div class="flex items-center space-x-4">
            <Button onclick={handleLogoUpload} disabled={isUploadingLogo} size="sm">
              {#if isUploadingLogo}
                <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" /> Uploading...
              {:else}
                <Icon icon="lucide:upload" class="h-4 w-4 mr-2" /> Upload Logo
              {/if}
            </Button>
            <p class="text-sm text-muted-foreground">Selected: {selectedLogoFile.name} ({(selectedLogoFile.size / 1024 / 1024).toFixed(2)} MB)</p>
          </div>
        {/if}
      </div>

      <div class="space-y-4 border-t pt-4">
        <h4 class="text-sm font-medium">Brand Colors</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label for="primary-color">Primary Color</Label>
            <Input id="primary-color" type="color" bind:value={branding.primaryColor} />
          </div>
          <div>
            <Label for="secondary-color">Secondary Color</Label>
            <Input id="secondary-color" type="color" bind:value={branding.secondaryColor} />
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end border-t pt-4 lg:col-span-2">
      <Button onclick={handleSaveBranding} disabled={isSavingBranding}>
        {#if isSavingBranding}
          <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
          Saving...
        {:else}
          <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
          Save Branding
        {/if}
      </Button>
    </div>
  </CardContent>
</Card>

<!-- Alert Dialog -->
{#if showAlertDialog}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div 
      class="fixed inset-0 bg-black/50" 
      onclick={() => showAlertDialog = false}
      onkeydown={(e) => { if (e.key === 'Escape') showAlertDialog = false; }}
      role="button"
      tabindex="0"
      aria-label="Close dialog"
    ></div>
    <div class="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          {#if alertType === 'error'}
            <Icon icon="lucide:x-circle" class="h-6 w-6 text-destructive" />
          {:else if alertType === 'success'}
            <Icon icon="lucide:check-circle" class="h-6 w-6 text-green-600" />
          {:else if alertType === 'warning'}
            <Icon icon="lucide:alert-triangle" class="h-6 w-6 text-amber-600" />
          {:else}
            <Icon icon="lucide:info" class="h-6 w-6 text-blue-600" />
          {/if}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-foreground">{alertTitle}</h3>
          <p class="text-sm text-muted-foreground mt-1">{alertMessage}</p>
        </div>
      </div>
      <div class="mt-6 flex justify-end">
        <Button type="button" onclick={() => showAlertDialog = false}>
          OK
        </Button>
      </div>
    </div>
  </div>
{/if}

<!-- Confirm Dialog -->
{#if showConfirmDialog}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div 
      class="fixed inset-0 bg-black/50" 
      onclick={() => showConfirmDialog = false}
      onkeydown={(e) => { if (e.key === 'Escape') showConfirmDialog = false; }}
      role="button"
      tabindex="0"
      aria-label="Close dialog"
    ></div>
    <div class="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <Icon icon="lucide:help-circle" class="h-6 w-6 text-amber-600" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-foreground">{confirmTitle}</h3>
          <p class="text-sm text-muted-foreground mt-1">{confirmMessage}</p>
        </div>
      </div>
      <div class="mt-6 flex justify-end space-x-3">
        <Button type="button" variant="outline" onclick={() => showConfirmDialog = false}>
          Cancel
        </Button>
        <Button type="button" onclick={handleConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  </div>
{/if}