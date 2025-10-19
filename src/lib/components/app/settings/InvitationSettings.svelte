<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Badge } from "$lib/components/ui/badge";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import Icon from "@iconify/svelte";
  import { companyContext } from "$lib/stores/companyContext";
  import { get } from "svelte/store";
  import { authenticatedFetch } from "$lib/utils/authUtils";
  import { formatDateTime } from "$lib/utils/helpers";
  import { onMount } from "svelte";
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

  // Filtered invitations by role - use derived values to avoid infinite loops
  const clientInvitations = $derived(invitations.filter(inv => inv.role === 'client'));
  const memberInvitations = $derived(invitations.filter(inv => inv.role === 'company-member'));

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

  async function loadInvitations() {
    // Get company ID from props data
    const companyContextValue = get(companyContext);
    const companyId = data?.companyId || companyContextValue.data?.companyId;

    if (!companyId) {
      console.error('No company ID available');
      return;
    }

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
    // Prevent double-clicking if already processing
    if (isCreatingInvitation) return;
    
    // Get company ID from props data
    const companyContextValue = get(companyContext);
    const companyId = data?.companyId || companyContextValue.data?.companyId;

    if (!companyId) {
      showAlert("Authentication Error", "Company ID not available.", "error");
      return;
    }

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

  // Initialize from parent
  onMount(() => {
    // Load invitations when component is initialized
    loadInvitations();
  });
</script>

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