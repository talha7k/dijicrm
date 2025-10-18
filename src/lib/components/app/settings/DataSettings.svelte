<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import Icon from "@iconify/svelte";
  import { companyContext } from "$lib/stores/companyContext";
  import { get } from "svelte/store";
  import { authenticatedFetch } from "$lib/utils/authUtils";
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