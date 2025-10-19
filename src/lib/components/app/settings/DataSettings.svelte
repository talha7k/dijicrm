<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import Icon from "@iconify/svelte";
  import { authenticatedFetch } from "$lib/utils/authUtils";
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
  }

  let { data }: Props = $props();

  // Sample data generation
  let isGeneratingSampleData = $state(false);
  let sampleDataResult = $state<{ success: boolean; message: string; data?: any } | null>(null);

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

  async function handleGenerateSampleData() {
    // Prevent double-clicking if already processing
    if (isGeneratingSampleData) return;
    
    showConfirm(
      "Generate Sample Data",
      "This will generate sample data including companies, clients, orders, and payments. This action cannot be easily undone. Are you sure you want to continue?",
      async () => {
        isGeneratingSampleData = true;
        sampleDataResult = null;

        try {
          // Get current company ID from props - it should be available as data.companyId
          const companyId = data?.companyId;

          console.log('Generating sample data for company:', companyId);
          console.log('Data prop:', data);

          if (!companyId) {
            throw new Error('Company ID is not available');
          }

          const response = await authenticatedFetch("/api/sample-data", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              companyId: companyId
            }),
          });

          if (response.ok) {
            const result = await response.json();
            sampleDataResult = { success: true, message: result.message || "Sample data generated successfully!" };
          } else {
            const errorResult = await response.json().catch(() => ({}));
            sampleDataResult = { 
              success: false, 
              message: errorResult.message || `Failed to generate sample data: ${response.status} ${response.statusText}` 
            };
          }
        } catch (error) {
          console.error("Sample data generation error:", error);
          sampleDataResult = { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
        } finally {
          isGeneratingSampleData = false;
        }
      }
    );
  }
</script>

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
            <p class="text-sm">{sampleDataResult.message}</p>
          </div>
        </div>
      {/if}
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