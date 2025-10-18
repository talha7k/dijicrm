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
  import { Badge } from "$lib/components/ui/badge";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

  import Icon from "@iconify/svelte";
  import { brandingService } from "$lib/services/brandingService";
  import type { CompanyBranding } from "$lib/types/branding";
  import { smtpConfigStore } from "$lib/stores/smtpConfig";
import { companyContext } from "$lib/stores/companyContext";
import { get } from "svelte/store";
  import { authenticatedFetch } from "$lib/utils/authUtils";
  import { formatDateTime } from "$lib/utils";
  import { compressImage, COMPRESSION_PRESETS } from "$lib/utils/imageCompression";
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
    let activeTab = $state<"clients" | "members">("clients");
    let activeSection = $state<"smtp" | "branding" | "invitations" | "data">("smtp");

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

    // Branding configuration
    let branding = $state<CompanyBranding>({
      logoUrl: "",
      stampImageUrl: "",
      stampPosition: "bottom-right",
      primaryColor: "#007bff",
      secondaryColor: "#6c757d",
    });

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

    // Company information state
    let tempCompanyName = $state<string>("");
    let tempVatNumber = $state<string>("");

   // SMTP hook
  const smtpStore = smtpConfigStore;

   // Load SMTP config when mounted and company is ready
  $effect(() => {
    if (!mounted) return;

    const companyContextValue = get(companyContext);
    if (!companyContextValue.data) return;

    // Load SMTP config asynchronously
    (async () => {
      try {
        await smtpStore.initialize();
        const loadedConfig = smtpStore.getCurrentConfig();
        if (loadedConfig) {
          smtpConfig = {
            ...loadedConfig,
            port: loadedConfig.port.toString(),
          };
          console.log('Updated smtpConfig from store:', { ...smtpConfig, auth: { ...smtpConfig.auth, pass: smtpConfig.auth.pass ? '***' : 'EMPTY' } });
        }
      } catch (error) {
        console.error('Failed to load SMTP config:', error);
      }
    })();
  });

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

    if (!companyContextValue.data) {
      showAlert("Authentication Error", "Company context not available. Please refresh the page.", "error");
      return;
    }
    const companyId = companyContextValue.data.companyId;

    // Initialize company info from context
    tempCompanyName = companyContextValue.data.company.name || "";
    tempVatNumber = companyContextValue.data.company.vatNumber || "";

    try {
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

  async function handleSaveCompanyInfo() {
    // Get company context
    const companyContextValue = get(companyContext);
    if (!companyContextValue.data) {
      showAlert("Authentication Error", "Company context not available.", "error");
      return;
    }
    const companyId = companyContextValue.data.companyId;

    // Validation
    if (!tempCompanyName.trim()) {
      showAlert("Validation Error", "Company name is required.", "error");
      return;
    }

    if (tempVatNumber && !/^[0-9]{15}$/.test(tempVatNumber)) {
      showAlert("Validation Error", "VAT number must be exactly 15 digits.", "error");
      return;
    }

    try {
      // Update company info in Firestore
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("$lib/firebase");
      const { Timestamp } = await import("firebase/firestore");

      const updatedData = {
        name: tempCompanyName.trim(),
        vatNumber: tempVatNumber || null,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, "companies", companyId), updatedData);

      // Update the cached company context immediately to avoid stale data
      const { companyContextData } = await import("$lib/stores/companyContext");
      companyContextData.update((s: any) => {
        if (s.data) {
          return {
            ...s,
            data: {
              ...s.data,
              company: {
                ...s.data.company,
                ...updatedData
              }
            }
          };
        }
        return s;
      });

      // Update local temp state to match the saved value
      tempCompanyName = tempCompanyName.trim();
      tempVatNumber = tempVatNumber || "";

      showAlert("Success", "Company information saved successfully!", "success");
    } catch (error) {
      console.error("Save company info error:", error);
      showAlert("Save Failed", "Failed to save company information. Please try again.", "error");
    }
  }

  async function handleSaveSMTP() {
    // Get company context
    const companyContextValue = get(companyContext);
    if (!companyContextValue.data) {
      showAlert("Authentication Error", "Company context not available.", "error");
      return;
    }
    const companyId = companyContextValue.data.companyId;

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

      const result = await smtpStore.saveConfig(configToSave);

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

      const response = await authenticatedFetch("/api/test-email", {
        method: "POST",
        body: JSON.stringify({
          to: testEmail,
          smtpConfig: configForTest,
          companyId: get(companyContext).data?.companyId || '',
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

    // Get company context
    const companyContextValue = get(companyContext);
    if (!companyContextValue.data) {
      showAlert("Authentication Error", "Company context not available.", "error");
      return;
    }
    const companyId = companyContextValue.data.companyId;
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

       // Compress the image for non-SVG files
       isCompressingLogo = true;
       try {
         let processedFile = file;

         if (file.type !== "image/svg+xml") {
           // Use branding compression preset for logos
           processedFile = await compressImage(file, COMPRESSION_PRESETS.BRANDING);
         }

         selectedLogoFile = processedFile;

         // Create preview for all file types including SVG
         const reader = new FileReader();
         reader.onload = (e) => {
           logoPreview = e.target?.result as string;
         };
         reader.readAsDataURL(processedFile);
       } catch (error) {
         console.error("Image compression failed:", error);
         showAlert("Compression Error", "Failed to compress image. Please try again.", "error");
         target.value = ""; // Clear the input
         return;
       } finally {
         isCompressingLogo = false;
       }
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

    // Get company context
    const companyContextValue = get(companyContext);
    if (!companyContextValue.data) {
      showAlert("Authentication Error", "Company context not available.", "error");
      return;
    }
    const companyId = companyContextValue.data.companyId;
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
    // Get company context
    const companyContextValue = get(companyContext);
    if (!companyContextValue.data) {
      showAlert("Authentication Error", "Company context not available.", "error");
      return;
    }
    const companyId = companyContextValue.data.companyId;

    // Validation - no longer needed for company info since it's readonly

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
      "This will generate sample data including companies, clients, orders, and payments. This action cannot be easily undone. Are you sure you want to continue?",
      async () => {
        isGeneratingSampleData = true;
        sampleDataResult = null;

        try {
          // Get current company ID
          const companyContextValue = get(companyContext);
          const companyId = companyContextValue.data?.companyId;
          
          console.log('Generating sample data for company:', companyId);
          console.log('Company context:', companyContextValue);
          
          const response = await authenticatedFetch("/api/sample-data", {
            method: "POST",
            body: JSON.stringify({
              companyId: companyId || undefined
            }),
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

  // Track if invitations have been loaded to prevent infinite loops
  let invitationsLoaded = $state(false);
  
  // Load invitations when mounted or when invitations tab is activated
  $effect(() => {
    if (!mounted) return;
    
    const companyContextValue = get(companyContext);
    if (!companyContextValue.data) {
      console.log('🔄 Waiting for company context...');
      return;
    }
    
    console.log('📊 Company context loaded, checking if should load invitations...');
    console.log('📊 Active section:', activeSection, 'Invitations length:', invitations.length, 'Loaded:', invitationsLoaded);
    
    // Reset flag when switching away from invitations tab
    if (activeSection !== 'invitations') {
      invitationsLoaded = false;
      return;
    }
    
    // Load invitations if on invitations tab and not loaded yet
    if (activeSection === 'invitations' && !invitationsLoaded) {
      loadInvitations();
    }
  });

  async function loadInvitations() {
    const companyContextValue = get(companyContext);
    if (!companyContextValue.data) return;
    
    const companyId = companyContextValue.data.companyId;
    console.log('🔍 Loading invitations for companyId:', companyId);
    isLoadingInvitations = true;
    
    try {
      console.log('🌐 Making API call to:', `/api/invitations?companyId=${companyId}`);
      const response = await authenticatedFetch(`/api/invitations?companyId=${companyId}`);
      console.log('📡 API response status:', response.status);
      console.log('📡 API response ok:', response.ok);
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ API error response:', errorText);
      }
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Raw invitations data:', data);
        const rawInvitations = data.invitations || [];
        console.log('📋 Raw invitations array:', rawInvitations);
        
        // Update the array with a new reference to trigger reactivity
        invitations = [...rawInvitations];
        invitationsLoaded = true; // Mark as loaded to prevent infinite loops
        console.log('Updated invitations array:', invitations);
        console.log('Invitations length after update:', invitations.length);
      } else {
        console.error("Failed to load invitations");
      }
    } catch (error) {
      console.error("Error loading invitations:", error);
    } finally {
      isLoadingInvitations = false;
    }
  }

  async function handleCreateInvitation() {
    const companyContextValue = get(companyContext);
    if (!companyContextValue.data) {
      showAlert("Authentication Error", "Company context not available.", "error");
      return;
    }
    
    const companyId = companyContextValue.data.companyId;
    
    // Validate email if provided
    if (newInvitationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newInvitationEmail)) {
      showAlert("Validation Error", "Please enter a valid email address.", "error");
      return;
    }
    
    console.log('Creating invitation with role:', newInvitationRole);
    isCreatingInvitation = true;
    
    try {
      const requestBody = {
        companyId,
        email: newInvitationEmail || undefined,
        role: newInvitationRole,
      };
      console.log('Request body:', requestBody);
      
      const response = await authenticatedFetch("/api/invitations", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Creation result:', result);
        showAlert("Success", `Invitation created with code: ${result.code}`, "success");
        
        // Reset form
        newInvitationEmail = "";
        newInvitationRole = "client";
        
        // Reload invitations
        await loadInvitations();
      } else {
        const error = await response.json();
        console.error('Creation error:', error);
        showAlert("Creation Failed", error.error || "Failed to create invitation", "error");
      }
    } catch (error) {
      console.error("Error creating invitation:", error);
      showAlert("Creation Failed", "Failed to create invitation. Please try again.", "error");
    } finally {
      isCreatingInvitation = false;
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    showConfirm(
      "Revoke Invitation",
      "Are you sure you want to revoke this invitation? It will no longer be usable but will remain in your records.",
      async () => {
        try {
          const response = await authenticatedFetch(`/api/invitations/${invitationId}`, {
            method: "DELETE",
          });
          
          if (response.ok) {
            showAlert("Success", "Invitation revoked successfully", "success");
            await loadInvitations();
          } else {
            const error = await response.json();
            showAlert("Revoke Failed", error.error || "Failed to revoke invitation", "error");
          }
        } catch (error) {
          console.error("Error revoking invitation:", error);
          showAlert("Revoke Failed", "Failed to revoke invitation. Please try again.", "error");
        }
      }
    );
  }

  async function handleDeleteInvitation(invitationId: string) {
    showConfirm(
      "Delete Invitation",
      "⚠️ This will permanently delete this invitation and remove all records of it. This action cannot be undone. Are you sure?",
      async () => {
        try {
          const response = await authenticatedFetch(`/api/invitations/${invitationId}?hard=true`, {
            method: "DELETE",
          });
          
          if (response.ok) {
            showAlert("Success", "Invitation deleted permanently", "success");
            await loadInvitations();
          } else {
            const error = await response.json();
            showAlert("Delete Failed", error.error || "Failed to delete invitation", "error");
          }
        } catch (error) {
          console.error("Error deleting invitation:", error);
          showAlert("Delete Failed", "Failed to delete invitation. Please try again.", "error");
        }
      }
    );
  }

  function copyInvitationCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      showAlert("Copied", "Invitation code copied to clipboard", "success");
    }).catch(() => {
      showAlert("Copy Failed", "Failed to copy invitation code", "error");
    });
  }
</script>

{#if mounted}
  <DashboardLayout title="Company Settings" description="Manage your company's email, branding, invitations, and data settings">
    <!-- Main Navigation Tabs -->
    <Tabs.Root bind:value={activeSection} class="w-full">
      <Tabs.List class="grid w-full grid-cols-4">
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

      <!-- SMTP Email Configuration Tab -->
      <Tabs.Content value="smtp" class="space-y-6 mt-6">
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
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <Switch id="smtp-secure" bind:checked={smtpConfig.secure} />
                  <Label for="smtp-secure">Use SSL/TLS encryption</Label>
                </div>
                <p class="text-xs text-muted-foreground">
                  {smtpConfig.port === "587" 
                    ? "Port 587 typically uses STARTTLS, so this should usually be OFF" 
                    : smtpConfig.port === "465" 
                    ? "Port 465 typically uses SSL/TLS, so this should usually be ON"
                    : "Check your email provider's documentation"}
                </p>
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
                    <div class="relative">
                      <Input
                        id="smtp-pass"
                        type={showPassword ? "text" : "password"}
                        bind:value={smtpConfig.auth.pass}
                        placeholder="your-password"
                        required
                        class="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onclick={() => showPassword = !showPassword}
                      >
                        <Icon 
                          icon={showPassword ? "mdi:eye-off" : "mdi:eye"} 
                          class="h-4 w-4 text-muted-foreground" 
                        />
                      </Button>
                    </div>
                    {#if smtpConfig.auth.pass}
                      <p class="text-xs text-muted-foreground mt-1">
                        Password loaded (click eye icon to view)
                      </p>
                    {:else}
                      <p class="text-xs text-muted-foreground mt-1">
                        No password saved
                      </p>
                    {/if}
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
      </Tabs.Content>

      <!-- Company Branding Tab -->
      <Tabs.Content value="branding" class="space-y-6 mt-6">
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
                      <Input id="company-name" bind:value={tempCompanyName} placeholder="Your Company Name" />
                      <p class="text-xs text-muted-foreground mt-1">Company name can be edited here</p>
                    </div>
                    <div>
                      <Label for="vat-number">VAT Number</Label>
                      <Input id="vat-number" bind:value={tempVatNumber} placeholder="15-digit Saudi VAT number" maxlength={15} pattern="[0-9]{15}" />
                      <p class="text-xs text-muted-foreground mt-1">Saudi VAT numbers must be exactly 15 digits</p>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end border-t pt-4">
                  <Button onclick={handleSaveCompanyInfo}>
                    <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
                    Save Company Info
                  </Button>
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
      </Tabs.Content>

      <!-- Member Invitations Tab -->
      <Tabs.Content value="invitations" class="space-y-6 mt-6">

      <!-- Member Invitations -->
      <Card>
        <CardHeader>
          <CardTitle>Member Invitations</CardTitle>
          <CardDescription>
            Generate invitation codes for new members to join your company during onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
           <!-- Create New Invitation -->
           <div class="space-y-4">
             <div class="flex items-center justify-between">
               <h4 class="text-sm font-medium">Create New Invitation</h4>
               <Button
                 size="sm"
                 variant="outline"
                 onclick={loadInvitations}
                 disabled={isLoadingInvitations}
               >
                 {#if isLoadingInvitations}
                   <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
                   Refreshing...
                 {:else}
                   <Icon icon="lucide:refresh-cw" class="h-4 w-4 mr-2" />
                   Refresh
                 {/if}
               </Button>
             </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label for="member-email">Email (Optional)</Label>
                <Input
                  id="member-email"
                  type="email"
                  bind:value={newInvitationEmail}
                  placeholder="email@example.com"
                />
                <p class="text-xs text-muted-foreground mt-1">
                  Email is optional - invitation codes can be shared directly
                </p>
              </div>
              <div>
                <Label for="invitation-role">Role</Label>
                <Select.Root type="single" bind:value={newInvitationRole}>
                  <Select.Trigger class="w-full">
                    {newInvitationRole ? newInvitationRole.charAt(0).toUpperCase() + newInvitationRole.slice(1).replace('-', ' ') : "Select role"}
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="client">Client</Select.Item>
                    <Select.Item value="company-member">Company Member</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <Button
                onclick={handleCreateInvitation}
                disabled={isCreatingInvitation}
                variant="default"
              >
                {#if isCreatingInvitation}
                  <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                {:else}
                  <Icon icon="lucide:plus" class="h-4 w-4 mr-2" />
                  Create Invitation
                {/if}
              </Button>
              <div class="flex items-center space-x-2 text-sm text-muted-foreground">
                <Icon icon="lucide:info" class="h-4 w-4" />
                <span>Invitations expire in 30 days</span>
              </div>
            </div>
          </div>

          <!-- Tabbed Invitations List -->
          <div class="space-y-4 border-t pt-4">
            <h4 class="text-sm font-medium">Recent Invitations</h4>
            <Tabs.Root bind:value={activeTab} class="w-full">
              <Tabs.List class="grid w-full grid-cols-2">
                <Tabs.Trigger value="clients" class="flex items-center space-x-2">
                  <Icon icon="lucide:users" class="h-4 w-4" />
                  <span>Clients ({clientInvitations.length})</span>
                </Tabs.Trigger>
                <Tabs.Trigger value="members" class="flex items-center space-x-2">
                  <Icon icon="lucide:user-plus" class="h-4 w-4" />
                  <span>Company Members ({memberInvitations.length})</span>
                </Tabs.Trigger>
              </Tabs.List>
              
              <Tabs.Content value="clients" class="space-y-4 mt-4">
                {#if isLoadingInvitations}
                  <div class="text-center py-4">
                    <Icon icon="lucide:loader" class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p class="text-sm text-muted-foreground mt-2">Loading client invitations...</p>
                  </div>
                {:else if clientInvitations.length > 0}
                  <div class="space-y-3">
                    {#each clientInvitations as invitation}
                      {@const invitationType = invitation.role === 'client' ? 'client' : 'company-member'}
                      <div class="flex items-center justify-between p-4 border rounded-lg">
                        <div class="flex-1 space-y-1">
                          <div class="flex items-center space-x-3">
                            <code class="px-2 py-1 bg-muted rounded text-sm font-mono">{invitation.code}</code>
                            <Badge variant={invitation.status === 'active' ? 'default' : invitation.status === 'used' ? 'secondary' : 'destructive'}>
                              {invitation.status}
                            </Badge>
                             <Badge variant="outline" class="text-primary border-primary">Client</Badge>
                           </div>
                           <div class="text-sm text-muted-foreground">
                             {#if invitation.email}
                               Created for: {invitation.email}
                             {:else}
                               No email specified
                             {/if}
                             • Created: {formatDateTime(invitation.createdAt)}
                             {#if invitation.expiresAt}
                               • Expires: {formatDateTime(invitation.expiresAt)}
                             {/if}
                             {#if invitation.usedAt}
                               • Used: {formatDateTime(invitation.usedAt)}
                             {/if}
                           </div>
                         </div>
                         <div class="flex items-center space-x-2">
                           {#if invitation.status === 'active'}
                             <Button
                               size="sm"
                               variant="outline"
                               onclick={() => copyInvitationCode(invitation.code)}
                             >
                               <Icon icon="lucide:copy" class="h-4 w-4 mr-1" />
                               Copy
                             </Button>
                              <DropdownMenu.Root>
                                 <DropdownMenu.Trigger>
                                   <Button
                                     size="sm"
                                     variant="destructive"
                                   >
                                    <Icon icon="lucide:more-horizontal" class="h-4 w-4" />
                                  </Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content>
                                  <DropdownMenu.Item onclick={() => handleRevokeInvitation(invitation.id)}>
                                    <Icon icon="lucide:x" class="h-4 w-4 mr-2" />
                                    Revoke (Mark as Expired)
                                 </DropdownMenu.Item>
                                 <DropdownMenu.Separator />
                                 <DropdownMenu.Item onclick={() => handleDeleteInvitation(invitation.id)} class="text-destructive focus:text-destructive">
                                   <Icon icon="lucide:trash-2" class="h-4 w-4 mr-2" />
                                   Delete Permanently
                                 </DropdownMenu.Item>
                               </DropdownMenu.Content>
                             </DropdownMenu.Root>
                           {/if}
                         </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="text-center py-8 text-muted-foreground">
                    <Icon icon="lucide:users" class="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p class="text-sm">No client invitations created yet</p>
                    <p class="text-xs mt-1">Create your first client invitation to get started</p>
                  </div>
                {/if}
              </Tabs.Content>
              
              <Tabs.Content value="members" class="space-y-4 mt-4">
                {#if isLoadingInvitations}
                  <div class="text-center py-4">
                    <Icon icon="lucide:loader" class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p class="text-sm text-muted-foreground mt-2">Loading member invitations...</p>
                  </div>
                {:else if memberInvitations.length > 0}
                  <div class="space-y-3">
                    {#each memberInvitations as invitation}
                      <div class="flex items-center justify-between p-4 border rounded-lg">
                        <div class="flex-1 space-y-1">
                          <div class="flex items-center space-x-3">
                            <code class="px-2 py-1 bg-muted rounded text-sm font-mono">{invitation.code}</code>
                            <Badge variant={invitation.status === 'active' ? 'default' : invitation.status === 'used' ? 'secondary' : 'destructive'}>
                              {invitation.status}
                            </Badge>
                             <Badge variant="outline" class="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">Company Member</Badge>
                           </div>
                           <div class="text-sm text-muted-foreground">
                             {#if invitation.email}
                               Created for: {invitation.email}
                             {:else}
                               No email specified
                             {/if}
                             • Created: {formatDateTime(invitation.createdAt)}
                             {#if invitation.expiresAt}
                               • Expires: {formatDateTime(invitation.expiresAt)}
                             {/if}
                             {#if invitation.usedAt}
                               • Used: {formatDateTime(invitation.usedAt)}
                             {/if}
                           </div>
                         </div>
                         <div class="flex items-center space-x-2">
                           {#if invitation.status === 'active'}
                             <Button
                               size="sm"
                               variant="outline"
                               onclick={() => copyInvitationCode(invitation.code)}
                             >
                               <Icon icon="lucide:copy" class="h-4 w-4 mr-1" />
                               Copy
                             </Button>
                              <DropdownMenu.Root>
                                 <DropdownMenu.Trigger>
                                   <Button
                                     size="sm"
                                     variant="destructive"
                                   >
                                    <Icon icon="lucide:more-horizontal" class="h-4 w-4" />
                                  </Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content>
                                  <DropdownMenu.Item onclick={() => handleRevokeInvitation(invitation.id)}>
                                    <Icon icon="lucide:x" class="h-4 w-4 mr-2" />
                                    Revoke (Mark as Expired)
                                 </DropdownMenu.Item>
                                 <DropdownMenu.Separator />
                                 <DropdownMenu.Item onclick={() => handleDeleteInvitation(invitation.id)} class="text-destructive focus:text-destructive">
                                   <Icon icon="lucide:trash-2" class="h-4 w-4 mr-2" />
                                   Delete Permanently
                                 </DropdownMenu.Item>
                               </DropdownMenu.Content>
                             </DropdownMenu.Root>
                           {/if}
                         </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <div class="text-center py-8 text-muted-foreground">
                    <Icon icon="lucide:user-plus" class="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p class="text-sm">No company member invitations created yet</p>
                    <p class="text-xs mt-1">Create your first member invitation to get started</p>
                  </div>
                {/if}
              </Tabs.Content>
            </Tabs.Root>
          </div>

           <!-- Instructions -->
           <div class="space-y-3 border-t pt-4">
             <h4 class="text-sm font-medium">How to Use Invitations</h4>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="bg-primary/5 border border-primary/20 rounded-lg p-4">
                 <div class="flex items-center space-x-2 mb-2">
                   <Icon icon="lucide:users" class="h-4 w-4 text-primary" />
                   <h5 class="text-sm font-medium text-primary">For Clients</h5>
                 </div>
                 <div class="space-y-1 text-sm text-foreground">
                   <p>1. Create a client invitation</p>
                   <p>2. Share the code with your client</p>
                   <p>3. They select "Client" role during onboarding</p>
                   <p>4. They enter the invitation code to join</p>
                 </div>
               </div>
               <div class="bg-green-500/5 border border-green-500/20 rounded-lg p-4 dark:bg-green-400/5 dark:border-green-400/20">
                 <div class="flex items-center space-x-2 mb-2">
                   <Icon icon="lucide:user-plus" class="h-4 w-4 text-green-600 dark:text-green-400" />
                   <h5 class="text-sm font-medium text-green-700 dark:text-green-300">For Company Members</h5>
                 </div>
                 <div class="space-y-1 text-sm text-foreground">
                   <p>1. Create a member invitation</p>
                   <p>2. Share the code with the team member</p>
                   <p>3. They select "Company Member" role</p>
                   <p>4. They enter the invitation code to join</p>
                 </div>
               </div>
             </div>
           </div>

           <!-- Revoke vs Delete Explanation -->
           <div class="space-y-3 border-t pt-4">
             <h4 class="text-sm font-medium">Managing Invitations</h4>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div class="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 dark:bg-amber-400/5 dark:border-amber-400/20">
                 <div class="flex items-center space-x-2 mb-2">
                   <Icon icon="lucide:x" class="h-4 w-4 text-amber-600 dark:text-amber-400" />
                   <h5 class="text-sm font-medium text-amber-700 dark:text-amber-300">Revoke (Mark as Expired)</h5>
                 </div>
                 <div class="space-y-1 text-sm text-foreground">
                   <p>• Invitation becomes unusable immediately</p>
                   <p>• Record remains in your system for audit</p>
                   <p>• Can be tracked for analytics</p>
                   <p>• Safer option for most cases</p>
                 </div>
               </div>
               <div class="bg-red-500/5 border border-red-500/20 rounded-lg p-4 dark:bg-red-400/5 dark:border-red-400/20">
                 <div class="flex items-center space-x-2 mb-2">
                   <Icon icon="lucide:trash-2" class="h-4 w-4 text-red-600 dark:text-red-400" />
                   <h5 class="text-sm font-medium text-red-700 dark:text-red-300">Delete Permanently</h5>
                 </div>
                 <div class="space-y-1 text-sm text-foreground">
                   <p>• Invitation is completely removed</p>
                   <p>• No record remains in the system</p>
                   <p>• Cannot be recovered or tracked</p>
                   <p>• Use for sensitive data cleanup</p>
                 </div>
               </div>
             </div>
           </div>
        </CardContent>
      </Card>
      </Tabs.Content>

      <!-- Data Management Tab -->
      <Tabs.Content value="data" class="space-y-6 mt-6">
     <Card>
       <CardHeader>
         <CardTitle>Data Management</CardTitle>
         <CardDescription>
           Generate sample data for testing and demonstration purposes.
           This will populate your database with realistic company, client, and order data.
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
                <li>• Document templates for orders</li>
                <li>• Sample orders with payment records</li>
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
                         <li>• {sampleDataResult.data.ordersCount} orders</li>
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
      </Tabs.Content>
    </Tabs.Root>

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