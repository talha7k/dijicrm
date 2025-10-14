<script lang="ts">
  import { onMount } from "svelte";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Switch } from "$lib/components/ui/switch";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "$lib/components/ui/select";
  import { Textarea } from "$lib/components/ui/textarea";

  import Icon from "@iconify/svelte";
  import { brandingService } from "$lib/services/brandingService";
  import type { CompanyBranding } from "$lib/types/branding";
  import { smtpConfigStore } from "$lib/stores/smtpConfig";

  let mounted = $state(false);

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
      alert("Failed to load existing configurations. You can still configure new settings.");
    }
  });

  async function handleSaveSMTP() {
    // TODO: Get companyId from auth context
    const companyId = "company-1";

    // Basic validation
    if (smtpConfig.enabled) {
      if (!smtpConfig.host.trim()) {
        alert("SMTP host is required when SMTP is enabled.");
        return;
      }
      if (!smtpConfig.auth.user.trim()) {
        alert("SMTP username is required when SMTP is enabled.");
        return;
      }
      if (!smtpConfig.auth.pass.trim()) {
        alert("SMTP password is required when SMTP is enabled.");
        return;
      }
      if (!smtpConfig.fromEmail.trim()) {
        alert("From email is required when SMTP is enabled.");
        return;
      }
      if (!smtpConfig.fromName.trim()) {
        alert("From name is required when SMTP is enabled.");
        return;
      }

      const portNum = parseInt(smtpConfig.port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        alert("Please enter a valid port number (1-65535).");
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
        alert("SMTP configuration saved successfully!");
      } else {
        alert(`Failed to save SMTP configuration: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to save SMTP config:", error);
      alert("Failed to save SMTP configuration. Please try again.");
    }
  }

  async function handleTestEmail() {
    if (!testEmail) {
      alert("Please enter a test email address");
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
      alert("Please select a logo file first.");
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
          alert("Logo uploaded successfully!");
        } else {
          alert(`Failed to update branding: ${updateResult.error}`);
        }
      } else {
        alert(`Failed to upload logo: ${result.error}`);
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      alert("Failed to upload logo. Please try again.");
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
        alert("File size must be less than 2MB.");
        target.value = ""; // Clear the input
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, SVG, or WebP).");
        target.value = ""; // Clear the input
        return;
      }

      // Check dimensions for non-SVG files
      if (file.type !== "image/svg+xml") {
        try {
          const dimensions = await getImageDimensions(file);
          if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
            alert(`Image dimensions must be ${maxWidth}x${maxHeight} pixels or smaller. Selected image is ${dimensions.width}x${dimensions.height} pixels.`);
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
      alert("Please select a stamp image file first.");
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
          alert("Stamp image uploaded successfully!");
        } else {
          alert(`Failed to update branding: ${updateResult.error}`);
        }
      } else {
        alert(`Failed to upload stamp image: ${result.error}`);
      }
    } catch (error) {
      console.error("Stamp upload error:", error);
      alert("Failed to upload stamp image. Please try again.");
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
        alert("File size must be less than 1MB.");
        target.value = ""; // Clear the input
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, SVG, or WebP).");
        target.value = ""; // Clear the input
        return;
      }

      // Check dimensions for non-SVG files
      if (file.type !== "image/svg+xml") {
        try {
          const dimensions = await getImageDimensions(file);
          if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
            alert(`Image dimensions must be ${maxWidth}x${maxHeight} pixels or smaller. Selected image is ${dimensions.width}x${dimensions.height} pixels.`);
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
      alert("Company name cannot be empty if provided.");
      return;
    }

    if (branding.vatNumber) {
      if (!/^[0-9]{15}$/.test(branding.vatNumber)) {
        alert("VAT number must be exactly 15 digits.");
        return;
      }
    }

    try {
      const result = await brandingService.saveBranding(companyId, branding);

      if (result.success) {
        alert("Branding configuration saved successfully!");
      } else {
        alert(`Failed to save branding: ${result.error}`);
      }
    } catch (error) {
      console.error("Save branding error:", error);
      alert("Failed to save branding configuration. Please try again.");
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
    const confirmed = confirm(
      "This will generate sample data including companies, clients, invoices, and payments. This action cannot be easily undone. Are you sure you want to continue?"
    );

    if (!confirmed) return;

    isGeneratingSampleData = true;
    sampleDataResult = null;

    try {
      const response = await fetch("/api/sample-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        sampleDataResult = {
          success: true,
          message: "Sample data generated successfully!",
          data: result.data,
        };
      } else {
        sampleDataResult = {
          success: false,
          message: result.error || "Failed to generate sample data",
        };
      }
    } catch (error) {
      sampleDataResult = {
        success: false,
        message: "Network error occurred while generating sample data",
      };
    } finally {
      isGeneratingSampleData = false;
    }
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
              <Select type="single" bind:value={smtpConfig.port} onValueChange={handlePortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 (SMTP)</SelectItem>
                  <SelectItem value="587">587 (SMTP/TLS)</SelectItem>
                  <SelectItem value="465">465 (SMTPS/SSL)</SelectItem>
                  <SelectItem value="2525">2525 (Alternative)</SelectItem>
                </SelectContent>
              </Select>
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
        <CardContent class="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <!-- Company Information Section -->
         <div class="space-y-4">
           <h4 class="text-sm font-medium">Company Information</h4>

           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <Label for="company-name">Company Name</Label>
               <Input
                 id="company-name"
                 bind:value={branding.companyName}
                 placeholder="Your Company Name"
                 required
               />
             </div>
             <div>
               <Label for="vat-number">VAT Number</Label>
               <Input
                 id="vat-number"
                 bind:value={branding.vatNumber}
                 placeholder="15-digit Saudi VAT number"
                  maxlength={15}
                 pattern="[0-9]{15}"
                 required
               />
               <p class="text-xs text-muted-foreground mt-1">
                 Saudi VAT numbers must be exactly 15 digits
               </p>
             </div>
           </div>
         </div>

          <!-- Logo Upload Section -->
         <div class="space-y-4 lg:col-start-2">
          <h4 class="text-sm font-medium">Company Logo</h4>

          <!-- Current Logo Display -->
          {#if logoPreview}
            <div class="flex items-center space-x-4 p-4 border rounded-lg">
              <img src={logoPreview} alt="Company Logo" class="h-16 w-16 object-contain" />
              <div class="flex-1">
                <p class="text-sm text-muted-foreground">Current logo</p>
              </div>
            </div>
          {/if}

          <!-- Logo Upload -->
          <div class="space-y-2">
            <Label for="logo-upload">Upload New Logo</Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onchange={handleLogoFileSelect}
              disabled={isUploadingLogo}
            />
            <p class="text-xs text-muted-foreground">
              Supported formats: JPEG, PNG, SVG, WebP. Maximum size: 2MB.
            </p>
          </div>

          <!-- Upload Button -->
          {#if selectedLogoFile}
            <div class="flex items-center space-x-4">
              <Button
                onclick={handleLogoUpload}
                disabled={isUploadingLogo}
                size="sm"
              >
                {#if isUploadingLogo}
                  <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                {:else}
                  <Icon icon="lucide:upload" class="h-4 w-4 mr-2" />
                  Upload Logo
                {/if}
              </Button>
              <p class="text-sm text-muted-foreground">
                Selected: {selectedLogoFile.name} ({(selectedLogoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          {/if}
         </div>

         <!-- Stamp Image Upload Section -->
         <div class="space-y-4">
           <h4 class="text-sm font-medium">Document Stamp Image</h4>

           <!-- Current Stamp Image Display -->
           {#if stampPreview}
             <div class="flex items-center space-x-4 p-4 border rounded-lg">
               <img src={stampPreview} alt="Stamp Image" class="h-16 w-16 object-contain" />
               <div class="flex-1">
                 <p class="text-sm text-muted-foreground">Current stamp image</p>
               </div>
             </div>
           {/if}

           <!-- Stamp Image Upload -->
           <div class="space-y-2">
             <Label for="stamp-upload">Upload Stamp Image</Label>
             <Input
               id="stamp-upload"
               type="file"
               accept="image/*"
               onchange={handleStampFileSelect}
               disabled={isUploadingStamp}
             />
             <p class="text-xs text-muted-foreground">
               Supported formats: JPEG, PNG, SVG, WebP. Maximum size: 1MB. Recommended: 500x500px or smaller.
             </p>
           </div>

           <!-- Upload Button -->
           {#if selectedStampFile}
             <div class="flex items-center space-x-4">
               <Button
                 onclick={handleStampUpload}
                 disabled={isUploadingStamp}
                 size="sm"
               >
                 {#if isUploadingStamp}
                   <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
                   Uploading...
                 {:else}
                   <Icon icon="lucide:upload" class="h-4 w-4 mr-2" />
                   Upload Stamp Image
                 {/if}
               </Button>
               <p class="text-sm text-muted-foreground">
                 Selected: {selectedStampFile.name} ({(selectedStampFile.size / 1024 / 1024).toFixed(2)} MB)
               </p>
             </div>
           {/if}
         </div>

          <!-- Brand Colors -->
         <div class="space-y-4 border-t pt-4 lg:col-start-2">
          <h4 class="text-sm font-medium">Brand Colors</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label for="primary-color">Primary Color</Label>
              <Input
                id="primary-color"
                type="color"
                bind:value={branding.primaryColor}
              />
            </div>
            <div>
              <Label for="secondary-color">Secondary Color</Label>
              <Input
                id="secondary-color"
                type="color"
                bind:value={branding.secondaryColor}
              />
            </div>
          </div>
         </div>

        <!-- Stamp Configuration -->
        <div class="space-y-4 border-t pt-4">
          <h4 class="text-sm font-medium">Document Stamp Position</h4>

          <div>
            <Label for="stamp-position">Stamp Position</Label>
            <Select type="single" bind:value={branding.stampPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Save Branding Button -->
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
   </DashboardLayout>
 {/if}