<script lang="ts">
  import { onMount } from "svelte";
  import DashboardLayout from "$lib/components/shared/dashboard-layout.svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import Icon from "@iconify/svelte";
   import { companyContext } from "$lib/stores/companyContext";
   import { get } from "svelte/store";
   import { brandingService } from "$lib/services/brandingService";

  // Import the settings components
  import GeneralSettings from "$lib/components/app/settings/GeneralSettings.svelte";
  import EmailSettings from "$lib/components/app/settings/EmailSettings.svelte";
  import BrandingSettings from "$lib/components/app/settings/BrandingSettings.svelte";
  import InvitationSettings from "$lib/components/app/settings/InvitationSettings.svelte";
  import DataSettings from "$lib/components/app/settings/DataSettings.svelte";

  import type { CompanyBranding } from "$lib/types/branding";

  let mounted = $state(false);
  let activeSection = $state<"general" | "smtp" | "branding" | "invitations" | "data">("general");

   // Component data for initialization
   let companyData = $state<{
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
   } | null>(null);

   // Separate state for branding data to avoid reactivity issues
   let brandingData = $state<CompanyBranding | null>(null);

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

     // Member invitations
     let invitations = $state<Array<{
       id: string;
       code: string;
       companyId: string;
       email?: string;
       role: 'client' | 'company-member';
       status: 'active' | 'used' | 'expired';
       createdAt: Date;
       expiresAt?: Date;
       usedAt?: Date;
     }>>([]);
    let isLoadingInvitations = $state(false);
    let isCreatingInvitation = $state(false);
    let newInvitationEmail = $state("");
     let newInvitationRole = $state<"client" | "company-member">("client");

  // Filtered invitations by role - use reactive variables instead of derived
  let clientInvitations = $state<Array<any>>([]);
  let memberInvitations = $state<Array<any>>([]);

  // Update filtered invitations when main invitations change
  $effect(() => {
    console.log('🔄 Updating filtered invitations, total:', invitations.length);
    
    const clients = invitations.filter(inv => {
      console.log(`Checking invitation ${inv.code}: role="${inv.role}"`);
      return inv.role === 'client';
    });
    
    const members = invitations.filter(inv => {
      console.log(`Checking invitation ${inv.code}: role="${inv.role}"`);
      return inv.role === 'company-member';
    });
    
    console.log('✅ Filtered results - Clients:', clients.length, 'Members:', members.length);
    
    clientInvitations = clients;
    memberInvitations = members;
  });

  // Debug reactivity
  $inspect(invitations, clientInvitations, memberInvitations);



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



   onMount(async () => {
     mounted = true;

     // Wait for company context to be loaded
     let companyContextValue = get(companyContext);
     if (!companyContextValue.data) {
       // If not loaded yet, wait for it to load
       await new Promise<void>((resolve) => {
         const unsubscribe = companyContext.subscribe((value) => {
           if (value.data) {
             unsubscribe();
             companyContextValue = value;
             resolve();
           }
         });
       });
     }

     if (companyContextValue.data) {
       // Load branding configuration
       const brandingResult = await brandingService.loadBranding(companyContextValue.data.companyId);

       companyData = companyContextValue.data;
       brandingData = brandingResult.branding || null;
     }
   });


</script>

{#if mounted}
  <DashboardLayout title="Company Settings" description="Manage your company's email, branding, invitations, and data settings">
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
        {#if companyData}
          <GeneralSettings data={companyData} />
        {/if}
      </Tabs.Content>

      <!-- Email Settings Tab -->
      <Tabs.Content value="smtp" class="space-y-6 mt-6">
        {#if companyData}
          <EmailSettings data={companyData} />
        {/if}
      </Tabs.Content>

       <!-- Branding Settings Tab -->
       <Tabs.Content value="branding" class="space-y-6 mt-6">
         {#if companyData && brandingData !== undefined}
           <BrandingSettings data={companyData} brandingData={brandingData} />
         {/if}
       </Tabs.Content>

      <!-- Invitations Settings Tab -->
      <Tabs.Content value="invitations" class="space-y-6 mt-6">
        {#if companyData}
          <InvitationSettings data={companyData} />
        {/if}
      </Tabs.Content>

      <!-- Data Settings Tab -->
      <Tabs.Content value="data" class="space-y-6 mt-6">
        {#if companyData}
          <DataSettings data={companyData} />
        {/if}
      </Tabs.Content>
    </Tabs.Root>
  </DashboardLayout>
{/if}