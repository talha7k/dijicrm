 <script lang="ts">
   import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
   import { Button } from "$lib/components/ui/button";
   import { Input } from "$lib/components/ui/input";
   import { Label } from "$lib/components/ui/label";
   import * as Select from "$lib/components/ui/select/index.js";
   import * as Dialog from "$lib/components/ui/dialog/index.js";
   import Icon from "@iconify/svelte";
   import { companyContext } from "$lib/stores/companyContext";
   import { get } from "svelte/store";
   import { authenticatedFetch } from "$lib/utils/authUtils";
   import { formatCurrency } from "$lib/utils/currency";
   import type { CompanyBranding } from "$lib/types/branding";

  interface Props {
    data?: {
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
  }

  let { data }: Props = $props();

  // Currency settings
  let selectedCurrency = $state('SAR');
  let currentCompanyCurrency = $state('SAR');
  let updatingCurrency = $state(false);

  // VAT settings
  let vatAmount = $state(15);
  let currentVatAmount = $state(15);
  let updatingVat = $state(false);

  // Company information state
   let tempCompanyName = $state<string>("");
   let tempVatNumber = $state<string>("");
   let savingCompanyInfo = $state(false);

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

  function getCurrencyDisplayName(currency: string): string {
    const currencyNames = {
      SAR: 'Saudi Riyal (SAR)',
      USD: 'US Dollar (USD)',
      EUR: 'Euro (EUR)',
      GBP: 'British Pound (GBP)',
      AED: 'UAE Dirham (AED)',
    };
    return currencyNames[currency as keyof typeof currencyNames] || currency;
  }

  async function updateCompanyCurrency() {
    // Prevent double-clicking if already processing
    if (updatingCurrency || !selectedCurrency || selectedCurrency === currentCompanyCurrency) return;

    updatingCurrency = true;
    try {
      const companyContextValue = get(companyContext);
      if (!companyContextValue.data) {
        throw new Error('No company context available');
      }

      // Update company settings in database
      const response = await authenticatedFetch(`/api/companies/${companyContextValue.data.companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            ...companyContextValue.data.company.settings,
            currency: selectedCurrency,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update currency');
      }

      const result = await response.json();

      // Note: Rely on Firebase listener for updates to avoid loops

      // Update local currency configuration
      currentCompanyCurrency = selectedCurrency;

      showAlert('Currency Updated', `Company currency has been changed to ${getCurrencyDisplayName(selectedCurrency)}`, 'success');
    } catch (error) {
      console.error('Error updating currency:', error);
      showAlert('Update Failed', 'Failed to update company currency. Please try again.', 'error');
    } finally {
      updatingCurrency = false;
    }
  }

  async function updateCompanyVat() {
    // Prevent double-clicking if already processing
    if (updatingVat || !vatAmount || vatAmount === currentVatAmount) return;

    updatingVat = true;
    try {
      const companyContextValue = get(companyContext);
      if (!companyContextValue.data) {
        throw new Error('No company context available');
      }

      // Update company settings in database
      const response = await authenticatedFetch(`/api/companies/${companyContextValue.data.companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            ...companyContextValue.data.company.settings,
            vatAmount: vatAmount,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update VAT amount');
      }

      const result = await response.json();

      // Note: Rely on Firebase listener for updates to avoid loops

      // Update local VAT configuration
      currentVatAmount = vatAmount;

      showAlert('VAT Amount Updated', `Company VAT amount has been changed to ${vatAmount}%`, 'success');
    } catch (error) {
      console.error('Error updating VAT amount:', error);
      showAlert('Update Failed', error instanceof Error ? error.message : 'Failed to update company VAT amount. Please try again.', 'error');
    } finally {
      updatingVat = false;
    }
  }

   async function handleSaveCompanyInfo() {
     // Prevent double-clicking if already processing
     if (savingCompanyInfo) return;
     
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

     savingCompanyInfo = true;
     try {
       // Update company info via API endpoint
       const response = await authenticatedFetch(`/api/companies/${companyId}`, {
         method: 'PATCH',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           name: tempCompanyName.trim(),
           vatNumber: tempVatNumber || null,
         }),
       });

       if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.error || 'Failed to update company information');
       }

       const result = await response.json();

        // Note: Rely on Firebase listener for updates to avoid loops

       // Update local temp state to match the saved value
       tempCompanyName = tempCompanyName.trim();
       tempVatNumber = tempVatNumber || "";

       showAlert("Success", "Company information saved successfully!", "success");
     } catch (error) {
       console.error("Save company info error:", error);
       showAlert("Save Failed", error instanceof Error ? error.message : "Failed to save company information. Please try again.", "error");
     } finally {
       savingCompanyInfo = false;
     }
   }

  // Initialize from parent
  $effect(() => {
    if (data?.company) {
      tempCompanyName = data.company.name || "";
      tempVatNumber = data.company.vatNumber || "";
    }
    if (data?.company?.settings) {
      currentCompanyCurrency = data.company.settings.currency || 'SAR';
      selectedCurrency = currentCompanyCurrency;
      currentVatAmount = data.company.settings.vatAmount || 15;
      vatAmount = currentVatAmount;
    }
  });
</script>

<Card>
  <CardHeader>
    <CardTitle class="flex items-center space-x-2">
      <Icon icon="lucide:settings" class="h-5 w-5" />
      <span>General Settings</span>
    </CardTitle>
    <CardDescription>
      Configure your company's basic settings including currency and preferences.
    </CardDescription>
  </CardHeader>
  <CardContent class="space-y-6">
    <!-- Two-column layout for larger screens -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Left Column: Currency and VAT Settings -->
      <div class="space-y-6">
        <!-- Currency Setting -->
        <div class="space-y-4">
          <div>
            <Label for="currency">Default Currency</Label>
            <p class="text-sm text-muted-foreground mb-3">
              Set the default currency for your company. This will be used for all pricing, invoices, and financial displays.
            </p>
            <Select.Root type="single" bind:value={selectedCurrency}>
              <Select.Trigger class="w-full">
                {selectedCurrency ? getCurrencyDisplayName(selectedCurrency) : "Select currency"}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="SAR">Saudi Riyal (SAR)</Select.Item>
                <Select.Item value="USD">US Dollar (USD)</Select.Item>
                <Select.Item value="EUR">Euro (EUR)</Select.Item>
                <Select.Item value="GBP">British Pound (GBP)</Select.Item>
                <Select.Item value="AED">UAE Dirham (AED)</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>

          {#if selectedCurrency !== currentCompanyCurrency}
            <div class="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div class="flex items-center space-x-2">
                <Icon icon="lucide:alert-triangle" class="h-4 w-4 text-amber-600" />
                <span class="text-sm text-amber-800">
                  Currency changed from {getCurrencyDisplayName(currentCompanyCurrency)} to {getCurrencyDisplayName(selectedCurrency)}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onclick={updateCompanyCurrency}
                disabled={updatingCurrency}
              >
                {#if updatingCurrency}
                  <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                {:else}
                  <Icon icon="lucide:check" class="h-4 w-4 mr-2" />
                  Apply Changes
                {/if}
              </Button>
            </div>
          {/if}
        </div>

        <!-- Preview -->
        <div class="space-y-4">
          <Label>Preview</Label>
          <div class="p-4 bg-muted/50 rounded-lg">
            <p class="text-sm text-muted-foreground mb-2">How currency will appear:</p>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Product Price:</span>
                <span class="font-medium">{formatCurrency(150.75)}</span>
              </div>
              <div class="flex justify-between">
                <span>Invoice Total:</span>
                <span class="font-medium">{formatCurrency(1250.00)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- VAT Amount Setting -->
        <div class="space-y-4">
          <div>
            <Label for="vat-amount">VAT %</Label>
            <p class="text-sm text-muted-foreground mb-3">
              Set the default VAT percentage for your company. This will be used for all pricing calculations and invoices.
            </p>
            <Input
              id="vat-amount"
              type="number"
              min="0"
              max="100"
              step="0.01"
              bind:value={vatAmount}
              placeholder="15"
            />
          </div>

          {#if vatAmount !== currentVatAmount}
            <div class="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div class="flex items-center space-x-2">
                <Icon icon="lucide:alert-triangle" class="h-4 w-4 text-amber-600" />
                <span class="text-sm text-amber-800">
                  VAT amount changed from {currentVatAmount}% to {vatAmount}%
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onclick={updateCompanyVat}
                disabled={updatingVat}
              >
                {#if updatingVat}
                  <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                {:else}
                  <Icon icon="lucide:check" class="h-4 w-4 mr-2" />
                  Apply Changes
                {/if}
              </Button>
            </div>
          {/if}
        </div>

        <!-- VAT Preview -->
        <div class="space-y-4">
          <Label>VAT Preview</Label>
          <div class="p-4 bg-muted/50 rounded-lg">
            <p class="text-sm text-muted-foreground mb-2">How VAT will appear in calculations:</p>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Product Price:</span>
                <span class="font-medium">{formatCurrency(100)}</span>
              </div>
              <div class="flex justify-between">
                <span>VAT ({vatAmount}%):</span>
                <span class="font-medium">{formatCurrency(100 * (vatAmount / 100))}</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span>Total (incl. VAT):</span>
                <span class="font-medium">{formatCurrency(100 * (1 + vatAmount / 100))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Company Information -->
      <div class="space-y-6">
        <!-- Company Information Section -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium">Company Information</h3>
          <div class="space-y-4">
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
           <div class="flex justify-end">
             <Button onclick={handleSaveCompanyInfo} disabled={savingCompanyInfo}>
               {#if savingCompanyInfo}
                 <Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
                 Saving...
               {:else}
                 <Icon icon="lucide:save" class="h-4 w-4 mr-2" />
                 Save Company Info
               {/if}
             </Button>
           </div>
        </div>
      </div>
    </div>
   </CardContent>
 </Card>

 <!-- Alert Dialog -->
 {#if showAlertDialog}
   <Dialog.Root open={showAlertDialog} onOpenChange={() => showAlertDialog = false}>
     <Dialog.Content>
       <Dialog.Header>
         <Dialog.Title>{alertTitle}</Dialog.Title>
         <Dialog.Description>{alertMessage}</Dialog.Description>
       </Dialog.Header>
       <Dialog.Footer>
         <Dialog.Close>OK</Dialog.Close>
       </Dialog.Footer>
     </Dialog.Content>
   </Dialog.Root>
 {/if}