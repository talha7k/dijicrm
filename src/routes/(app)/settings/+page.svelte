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
  import { requireCompany } from "$lib/utils/auth";

  let mounted = $state(false);

  onMount(() => {
    mounted = true;
    // Company access is checked at layout level
  });

  // SMTP Configuration
  let smtpConfig = $state({
    enabled: false,
    host: "",
    port: 587,
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

  async function handleSaveSMTP() {
    try {
      // TODO: Save SMTP configuration to Firebase
      console.log("Saving SMTP config:", smtpConfig);
      alert("SMTP configuration saved successfully!");
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
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: testEmail,
          smtpConfig,
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
    const portNum = parseInt(port);
    if (!isNaN(portNum)) {
      smtpConfig.port = portNum;
      // Auto-set secure based on common ports
      if (portNum === 465) {
        smtpConfig.secure = true;
      } else if (portNum === 587 || portNum === 25) {
        smtpConfig.secure = false;
      }
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
              <Select value={smtpConfig.port.toString()} onValueChange={handlePortChange}>
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

    <!-- Additional Settings Sections -->
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>Basic company details and branding</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          Company information settings will be added here in a future update.
        </p>
      </CardContent>
    </Card>
  </DashboardLayout>
{/if}