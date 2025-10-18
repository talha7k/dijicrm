<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Switch } from "$lib/components/ui/switch";
  import * as Select from "$lib/components/ui/select/index.js";
  import Icon from "@iconify/svelte";
  import { companyContext } from "$lib/stores/companyContext";
  import { get } from "svelte/store";
  import { authenticatedFetch } from "$lib/utils/authUtils";
  import { smtpService } from "$lib/services/smtpService";
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

  // SMTP Configuration state
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

  // Dialog state
  let showAlertDialog = $state(false);
  let showConfirmDialog = $state(false);
  let alertTitle = $state('');
  let alertMessage = $state('');
  let alertType = $state<'info' | 'success' | 'warning' | 'error'>('info');

  // Helper functions for dialogs
  function showAlert(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    alertTitle = title;
    alertMessage = message;
    alertType = type;
    showAlertDialog = true;
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

      const result = await smtpService.saveSMTPConfig(companyId, configToSave);

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

  // Initialize from parent - only on first load
  let initialized = $state(false);
  
  $effect(() => {
    // Initialize SMTP config if available and not yet initialized
    if (data?.smtpConfig && !initialized) {
      smtpConfig = { ...smtpConfig, ...data.smtpConfig };
      initialized = true;
    }
  });
</script>

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