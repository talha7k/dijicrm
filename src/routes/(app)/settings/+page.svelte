 <script lang="ts">
    import { onMount } from "svelte";
    import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
    import * as Tabs from "$lib/components/ui/tabs/index.js";
    import Icon from "@iconify/svelte";
    import { companyContext } from "$lib/stores/companyContext";

    // Import the settings components
    import GeneralSettings from "$lib/components/app/settings/GeneralSettings.svelte";
    import EmailSettings from "$lib/components/app/settings/EmailSettings.svelte";
    import BrandingSettings from "$lib/components/app/settings/BrandingSettings.svelte";
    import InvitationSettings from "$lib/components/app/settings/InvitationSettings.svelte";
    import DataSettings from "$lib/components/app/settings/DataSettings.svelte";

    import type { CompanyBranding } from "$lib/types/branding";

    let {
      data,
    }: {
      data: { profile: any; company: any; membership: any };
    } = $props();

    let mounted = $state(false);
    let activeSection = $state<"general" | "smtp" | "branding" | "invitations" | "data">("general");

    // Use server data as primary source - no dependency on client-side store
    let companyData = $derived({
      companyId: data.profile.currentCompanyId,
      company: data.company,
      role: data.membership.role,
      permissions: data.membership.permissions || [],
      smtpConfig: data.company.smtpConfig || null,
      brandingConfig: data.company.brandingConfig || null,
      vatConfig: data.company.vatConfig || null,
    });

    // Derive branding data from server data
    let brandingData = $derived(data.company.brandingConfig || null);

    // No loading state - use server data immediately
    let settingsLoading = $derived(false);

    // Timeout handling for loading states
    let loadingTimeout = $state<NodeJS.Timeout | number | null>(null);
    let showTimeoutError = $state(false);

    // Clear timeout when loading completes
    $effect(() => {
      if (!settingsLoading && loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
        showTimeoutError = false;
      }
    });

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

   // Password visibility
   let showPassword = $state(false);

   // Sample data generation
   let isGeneratingSampleData = $state(false);
   let sampleDataResult = $state<{ success: boolean; message: string; data?: any } | null>(null);

   // Logo upload state
   let selectedLogoFile = $state<File | null>(null);
   let isUploadingLogo = $state(false);
   let isCompressingLogo = $state(false);
   let logoPreview = $state<string | null>(null);

   // Stamp image upload state
   let selectedStampFile = $state<File | null>(null);
   let isUploadingStamp = $state(false);
   let isCompressingStamp = $state(false);
   let stampPreview = $state<string | null>(null);

    onMount(() => {
      mounted = true;
      // Company context and branding are handled by the layout
    });


</script>

 {#if mounted}
   <DashboardLayout title="Company Settings" description="Manage your company's email, branding, invitations, and data settings">
      {#if settingsLoading && !showTimeoutError}
        <div class="flex items-center justify-center py-8">
          <div class="text-center">
            <Icon icon="lucide:loader-2" class="h-8 w-8 animate-spin mx-auto mb-2" />
            <p class="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      {:else if showTimeoutError}
        <div class="flex items-center justify-center py-8">
          <div class="text-center">
            <Icon icon="lucide:alert-triangle" class="h-8 w-8 text-destructive mx-auto mb-2" />
            <p class="text-muted-foreground mb-4">Loading is taking longer than expected.</p>
            <button
              class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              onclick={() => {
                showTimeoutError = false;
                loadingTimeout = setTimeout(() => showTimeoutError = true, 10000);
                window.location.reload();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      {:else}
       <!-- Main Navigation Tabs -->
       <Tabs.Root bind:value={activeSection} class="w-full">
         <Tabs.List class="grid w-full grid-cols-5">
           <Tabs.Trigger value="general" class="flex items-center space-x-2">
             <Icon icon="lucide:settings" class="h-4 w-4" />
             <span>General</span>
           </Tabs.Trigger>
           <Tabs.Trigger value="smtp" class="flex items-center space-x-2">
             <Icon icon="lucide:mail" class="h-4 w-4" />
             <span>Email</span>
           </Tabs.Trigger>
           <Tabs.Trigger value="branding" class="flex items-center space-x-2">
             <Icon icon="lucide:palette" class="h-4 w-4" />
             <span>Branding</span>
           </Tabs.Trigger>
           <Tabs.Trigger value="invitations" class="flex items-center space-x-2">
             <Icon icon="lucide:user-plus" class="h-4 w-4" />
             <span>Invitations</span>
           </Tabs.Trigger>
           <Tabs.Trigger value="data" class="flex items-center space-x-2">
             <Icon icon="lucide:database" class="h-4 w-4" />
             <span>Data</span>
           </Tabs.Trigger>
         </Tabs.List>

          <!-- General Settings Tab -->
          <Tabs.Content value="general" class="space-y-6 mt-6">
            <GeneralSettings data={companyData!} />
          </Tabs.Content>

          <!-- Email Settings Tab -->
          <Tabs.Content value="smtp" class="space-y-6 mt-6">
            <EmailSettings data={companyData!} />
          </Tabs.Content>

          <!-- Branding Settings Tab -->
          <Tabs.Content value="branding" class="space-y-6 mt-6">
            <BrandingSettings data={companyData!} brandingData={brandingData} />
          </Tabs.Content>

          <!-- Invitations Settings Tab -->
          <Tabs.Content value="invitations" class="space-y-6 mt-6">
            <InvitationSettings data={companyData!} />
          </Tabs.Content>

          <!-- Data Settings Tab -->
          <Tabs.Content value="data" class="space-y-6 mt-6">
            <DataSettings data={companyData!} />
          </Tabs.Content>
       </Tabs.Root>
     {/if}
   </DashboardLayout>
 {/if}