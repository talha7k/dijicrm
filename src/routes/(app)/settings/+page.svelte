<script lang="ts">
  import { onMount } from "svelte";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Switch } from "$lib/components/ui/switch";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Textarea } from "$lib/components/ui/textarea";

  import Icon from "@iconify/svelte";
  import { brandingService } from "$lib/services/brandingService";
  import type { CompanyBranding } from "$lib/types/branding";
  import { smtpConfigStore } from "$lib/stores/smtpConfig";
  import AlertDialog from "$lib/components/shared/alert-dialog.svelte";
  import ConfirmDialog from "$lib/components/shared/confirm-dialog.svelte";

  let mounted = $state(false);

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

  // SMTP Configuration state from hook
  let smtpConfig = $state({
    enabled: false,
    host: "",
    port: "587",
    secure: false, // Use TLS
    auth: {
      user: "",
      pass: "",
    },
    fromEmail: "",
    fromName: "",
  });

   // Test email configuration
   let testEmail = $state("");
   let isTesting = $state(false);
   let testResult = $state<{ success: boolean; message: string } | null>(null);

   // Sample data generation
   let isGeneratingSampleData = $state(false);
   let sampleDataResult = $state<{ success: boolean; message: string; data?: any } | null>(null);

   // Branding configuration
   let branding = $state<CompanyBranding>({
     companyName: "",
     vatNumber: "",
     logoUrl: "",
     stampImageUrl: "",
     stampPosition: "bottom-right",
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

   // SMTP hook
  const smtpStore = smtpConfigStore;

  onMount(async () => {
    mounted = true;

    // Load existing configurations
    // TODO: Get companyId from auth context
    const companyId = "company-1";

    try {
      // Load SMTP config
      await smtpStore.initialize(companyId);
      const loadedSMTPConfig = smtpStore.getCurrentConfig();
      if (loadedSMTPConfig) {
        smtpConfig = {
          ...loadedSMTPConfig,
          port: loadedSMTPConfig.port.toString(), // Convert to string for Select component
        };
      }

       // Load branding config
       const brandingResult = await brandingService.loadBranding(companyId);
       if (brandingResult.success && brandingResult.branding) {
         branding = { ...branding, ...brandingResult.branding };
         if (branding.logoUrl) {
           logoPreview = branding.logoUrl;
         }
         if (branding.stampImageUrl) {
           stampPreview = branding.stampImageUrl;
         }
       } else if (brandingResult.error) {
         console.warn("Failed to load branding config:", brandingResult.error);
         // Continue with default branding - don't show error to user
       }
    } catch (error) {
      console.error("Failed to load configurations:", error);
      // Show error to user but don't block the page
      showAlert("Configuration Error", "Failed to load existing configurations. You can still configure new settings.", "warning");
    }
  });

  async function handleSaveSMTP() {
    // TODO: Get companyId from auth context
    const companyId = "company-1";

    // Basic validation
    if (smtpConfig.enabled) {
      if (!smtpConfig.host.trim()) {
        showAlert("Validation Error", "SMTP host is required when SMTP is enabled.", "error");
        return;
      }
      if (!smtpConfig.auth.user.trim()) {
        showAlert("Validation Error", "SMTP username is required when SMTP is enabled.", "error");
        return;
      }
      if (!smtpConfig.auth.pass.trim()) {
        showAlert("Validation Error", "SMTP password is required when SMTP is enabled.", "error");
        return;
      }
      if (!smtpConfig.fromEmail.trim()) {
        showAlert("Validation Error", "From email is required when SMTP is enabled.", "error");
        return;
      }
      if (!smtpConfig.fromName.trim()) {
        showAlert("Validation Error", "From name is required when SMTP is enabled.", "error");
        return;
      }

      const portNum = parseInt(smtpConfig.port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        showAlert("Validation Error", "Please enter a valid port number (1-65535).", "error");
        return;
      }
    }

    try {
      // Convert port back to number for saving
      const configToSave = {
        ...smtpConfig,
        port: parseInt(smtpConfig.port),
      };

      const result = await smtpStore.saveConfig(companyId, configToSave);

      if (result.success) {
        showAlert("Success", "SMTP configuration saved successfully!", "success");
      } else {
        showAlert("Save Failed", `Failed to save SMTP configuration: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Failed to save SMTP config:", error);
      showAlert("Save Failed", "Failed to save SMTP configuration. Please try again.", "error");
    }
  }

  async function handleTestEmail() {
    if (!testEmail) {
      showAlert("Validation Error", "Please enter a test email address", "error");
      return;
    }

    isTesting = true;
    testResult = null;

    try {
      // Convert port to number for API
      const configForTest = {
        ...smtpConfig,
        port: parseInt(smtpConfig.port),
      };

      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: testEmail,
          smtpConfig: configForTest,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        testResult = { success: true, message: "Test email sent successfully!" };
      } else {
        testResult = { success: false, message: result.error || "Failed to send test email" };
      }
    } catch (error) {
      testResult = { success: false, message: "Network error occurred" };
    } finally {
      isTesting = false;
    }
  }

  // Branding functions
  async function handleLogoUpload() {
    if (!selectedLogoFile) {
      showAlert("Validation Error", "Please select a logo file first.", "error");
      return;
    }

    const companyId = "company-1"; // TODO: Get from auth context
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
          showAlert("Success", "Logo uploaded successfully!", "success");
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

  // Stamp image functions
  async function handleStampUpload() {
    if (!selectedStampFile) {
      showAlert("Validation Error", "Please select a stamp image file first.", "error");
      return;
    }

    const companyId = "company-1"; // TODO: Get from auth context
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
          showAlert("Success", "Stamp image uploaded successfully!", "success");
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

  async function handleSaveBranding() {
    const companyId = "company-1"; // TODO: Get from auth context

    // Validation
    if (branding.companyName && branding.companyName.trim().length === 0) {
      showAlert("Validation Error", "Company name cannot be empty if provided.", "error");
      return;
    }

    if (branding.vatNumber) {
      if (!/^[0-9]{15}$/.test(branding.vatNumber)) {
        showAlert("Validation Error", "VAT number must be exactly 15 digits.", "error");
        return;
      }
    }

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
    }
  }

  function handlePortChange(port: string) {
    smtpConfig.port = port;
    const portNum = parseInt(port);
    // Auto-set secure based on common ports
    if (portNum === 465) {
      smtpConfig.secure = true;
    } else if (portNum === 587 || portNum === 25) {
      smtpConfig.secure = false;
    }
  }

  async function handleGenerateSampleData() {
    showConfirm(
      "Generate Sample Data",
      "This will generate sample data including companies, clients, invoices, and payments. This action cannot be easily undone. Are you sure you want to continue?",
      async () => {
        isGeneratingSampleData = true;
        sampleDataResult = null;

        try {
          const response = await fetch("/api/sample-data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const result = await response.json();
            sampleDataResult = { success: true, message: result.message || "Sample data generated successfully!" };
          } else {
            sampleDataResult = { success: false, message: "Failed to generate sample data" };
          }
        } catch (error) {
          console.error("Sample data generation error:", error);
          sampleDataResult = { success: false, message: "Network error occurred" };
        } finally {
          isGeneratingSampleData = false;
        }
      }
    );
  }
</script>

{#if mounted}
  <DashboardLayout title="Company Settings" description="Configure your company's email and system settings">
    <!-- SMTP Email Configuration -->
    <Card>
      <CardHeader>
        <CardTitle>SMTP Email Configuration</CardTitle>
        <CardDescription>
          Configure SMTP settings to send emails through your own email provider.
          This will replace the default email service.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Enable SMTP Toggle -->
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label class="text-base">Enable Custom SMTP</Label>
            <p class="text-sm text-muted-foreground">
              Use your own SMTP server instead of the default email service
            </p>
          </div>
          <Switch bind:checked={smtpConfig.enabled} />
        </div>

        {#if smtpConfig.enabled}
          <!-- SMTP Server Settings -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                bind:value={smtpConfig.host}
                placeholder="smtp.gmail.com"
                required
              />
            </div>
            <div>
              <Label for="smtp-port">Port</Label>
              <Select.Root type="single" bind:value={smtpConfig.port} onValueChange={handlePortChange}>
                <Select.Trigger class="w-full">
                  {smtpConfig.port ? `${smtpConfig.port} (${smtpConfig.port === "25" ? "SMTP" : smtpConfig.port === "587" ? "SMTP/TLS" : smtpConfig.port === "465" ? "SMTPS/SSL" : "Alternative"})` : "Select port"}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="25">25 (SMTP)</Select.Item>
                  <Select.Item value="587">587 (SMTP/TLS)</Select.Item>
                  <Select.Item value="465">465 (SMTPS/SSL)</Select.Item>
                  <Select.Item value="2525">2525 (Alternative)</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </div>

          <!-- Security Settings -->
          <div class="flex items-center space-x-2">
            <Switch id="smtp-secure" bind:checked={smtpConfig.secure} />
            <Label for="smtp-secure">Use SSL/TLS encryption</Label>
          </div>

          <!-- Authentication -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium">Authentication</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label for="smtp-user">Username</Label>
                <Input
                  id="smtp-user"
                  bind:value={smtpConfig.auth.user}
                  placeholder="your-email@gmail.com"
                  required
                />
              </div>
              <div>
                <Label for="smtp-pass">Password/App Password</Label>
                <Input
                  id="smtp-pass"
                  type="password"
                  bind:value={smtpConfig.auth.pass}
                  placeholder="your-password"
                  required
                />
              </div>
            </div>
          </div>

          <!-- From Address -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium">Sender Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label for="from-email">From Email</Label>
                <Input
                  id="from-email"
                  type="email"
                  bind:value={smtpConfig.fromEmail}
                  placeholder="noreply@yourcompany.com"
                  required
                />
              </div>
              <div>
                <Label for="from-name">From Name</Label>
                <Input
                  id="from-name"
                  bind:value={smtpConfig.fromName}
                  placeholder="Your Company Name"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Test Email Section -->
          <div class="space-y-4 border-t pt-4">
            <h4 class="text-sm font-medium">Test Configuration</h4>
            <div class="flex gap-4">
              <div class="flex-1">
                <Label for="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  bind:value={testEmail}
                  placeholder="test@example.com"
                />
              </div>
              <div class="flex items-end">
                <Button
                  onclick={handleTestEmail}
                  disabled={isTesting || !testEmail}
                  variant="outline"
                >
                  {#if isTesting}
                    <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  {:else}
                    <Icon icon="lucide:send" class="h-4 w-4 mr-2" />
                    Send Test
                  {/if}
                </Button>
              </div>
            </div>

            {#if testResult}
              <div class="p-3 rounded-md {testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}">
                <p class="text-sm">{testResult.message}</p>
              </div>
            {/if}
          </div>

          <!-- Save Button -->
          <div class="flex justify-end">
            <Button onclick={handleSaveSMTP}>
              <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
              Save SMTP Configuration
            </Button>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Company Branding -->
    <Card>
      <CardHeader>
        <CardTitle>Company Branding</CardTitle>
         <CardDescription>Customize your company's logo and document branding</CardDescription>
       </CardHeader>
        <CardContent class="grid grid-cols-1 lg:grid-cols-2 lg:items-start gap-8">
          <div class="space-y-4">
            <div class="space-y-4">
              <h4 class="text-sm font-medium">Company Information</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label for="company-name">Company Name</Label>
                  <Input id="company-name" bind:value={branding.companyName} placeholder="Your Company Name" required />
                </div>
                <div>
                  <Label for="vat-number">VAT Number</Label>
                  <Input id="vat-number" bind:value={branding.vatNumber} placeholder="15-digit Saudi VAT number" maxlength={15} pattern="[0-9]{15}" required />
                  <p class="text-xs text-muted-foreground mt-1">Saudi VAT numbers must be exactly 15 digits</p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="text-sm font-medium">Document Stamp Image</h4>
              <div class="flex items-center space-x-4 p-4 border rounded-lg min-h-[100px]">
                {#if stampPreview}
                  <img src={stampPreview} alt="Current document stamp preview" class="h-16 w-16 object-contain" />
                  <div class="flex-1">
                    <p class="text-sm text-muted-foreground">{selectedStampFile ? "New stamp preview" : "Current stamp"}</p>
                  </div>
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

            <div class="space-y-4 border-t pt-4">
              <h4 class="text-sm font-medium">Document Stamp Position</h4>
              <div>
                <Label for="stamp-position">Stamp Position</Label>
                <Select.Root type="single" bind:value={branding.stampPosition}>
                  <Select.Trigger class="w-full">
                    {branding.stampPosition ? branding.stampPosition.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "Select position"}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="top-left">Top Left</Select.Item>
                    <Select.Item value="top-right">Top Right</Select.Item>
                    <Select.Item value="bottom-left">Bottom Left</Select.Item>
                    <Select.Item value="bottom-right">Bottom Right</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
            </div>
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
            <Button onclick={handleSaveBranding}>
              <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
              Save Branding
            </Button>
          </div>
       </CardContent>
     </Card>

     <!-- Data Management -->
     <Card>
       <CardHeader>
         <CardTitle>Data Management</CardTitle>
         <CardDescription>
           Generate sample data for testing and demonstration purposes.
           This will populate your database with realistic company, client, and invoice data.
         </CardDescription>
       </CardHeader>
       <CardContent class="space-y-6">
         <div class="space-y-4">
           <div class="p-4 border border-amber-200 bg-amber-50 rounded-lg">
             <div class="flex items-start space-x-3">
               <Icon icon="lucide:alert-triangle" class="h-5 w-5 text-amber-600 mt-0.5" />
               <div>
                 <h4 class="text-sm font-medium text-amber-800">Warning</h4>
                 <p class="text-sm text-amber-700 mt-1">
                   Sample data generation is only available in development environments.
                   This action will create new records in your database and cannot be easily reversed.
                 </p>
               </div>
             </div>
           </div>

           <div class="space-y-2">
             <h4 class="text-sm font-medium">What gets generated:</h4>
             <ul class="text-sm text-muted-foreground space-y-1 ml-4">
               <li>• Company administrator account with branding settings</li>
               <li>• Sample client accounts with authentication</li>
               <li>• Products and services catalog</li>
               <li>• Document templates for invoices</li>
               <li>• Sample invoices with payment records</li>
             </ul>
           </div>

           <div class="flex items-center justify-between pt-4 border-t">
             <div>
               <p class="text-sm text-muted-foreground">
                 Ready to populate your database with sample data?
               </p>
             </div>
             <Button
               onclick={handleGenerateSampleData}
               disabled={isGeneratingSampleData}
               variant="default"
             >
               {#if isGeneratingSampleData}
                 <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
                 Generating...
               {:else}
                 <Icon icon="lucide:database" class="h-4 w-4 mr-2" />
                 Generate Sample Data
               {/if}
             </Button>
           </div>

           {#if sampleDataResult}
             <div class="p-4 rounded-md {sampleDataResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}">
               <div class="flex items-start space-x-3">
                 <Icon
                   icon={sampleDataResult.success ? "lucide:check-circle" : "lucide:x-circle"}
                   class="h-5 w-5 mt-0.5"
                 />
                 <div class="flex-1">
                   <p class="text-sm font-medium">{sampleDataResult.message}</p>
                   {#if sampleDataResult.success && sampleDataResult.data}
                     <div class="mt-2 text-xs space-y-1">
                       <p>Generated:</p>
                       <ul class="ml-4 space-y-1">
                         <li>• {sampleDataResult.data.clientsCount} client accounts</li>
                         <li>• {sampleDataResult.data.productsCount} products</li>
                         <li>• {sampleDataResult.data.templatesCount} document templates</li>
                         <li>• {sampleDataResult.data.invoicesCount} invoices</li>
                       </ul>
                     </div>
                   {/if}
                 </div>
               </div>
             </div>
           {/if}
         </div>
       </CardContent>
      </Card>

      <!-- Alert Dialog -->
      <AlertDialog
        bind:open={showAlertDialog}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
      />

      <!-- Confirm Dialog -->
      <ConfirmDialog
        bind:open={showConfirmDialog}
        title={confirmTitle}
        message={confirmMessage}
        type="warning"
        onconfirm={handleConfirm}
      />
    </DashboardLayout>
  {/if}