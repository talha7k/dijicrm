<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { requireCompany } from '$lib/utils/auth';
  import { clientManagementStore } from '$lib/stores/clientManagement';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { toast } from 'svelte-sonner';
  import type { UserProfile } from '$lib/types/user';

   // Company access is checked at layout level

  const clientStore = clientManagementStore;
  const clientId = page.params.id as string;

  let client = $state<UserProfile | undefined>(undefined);
  let loading = $state(true);
  let saving = $state(false);

  let formData = $state({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    isActive: true,
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });

  let errors = $state({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });

  onMount(async () => {
    // Load client data
    client = clientStore.getClient(clientId);
    if (client) {
      formData = {
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email,
        phoneNumber: client.phoneNumber || '',
        isActive: client.isActive,
        street: client.address?.street || '',
        city: client.address?.city || '',
        state: client.address?.state || '',
        country: client.address?.country || '',
        postalCode: client.address?.postalCode || ''
      };
    }
    loading = false;
  });

  async function handleSubmit(event: Event) {
    event.preventDefault();
    saving = true;

    // Clear previous errors
    errors = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    };

    // Basic validation
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      saving = false;
      return;
    }

    try {
      const address = formData.street || formData.city || formData.state || formData.country || formData.postalCode ? {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode
      } : undefined;

      await clientStore.updateClient(clientId, {
        displayName: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        isActive: formData.isActive,
        address
      });

      toast.success('Client updated successfully!');
      goto('/clients');
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      saving = false;
    }
  }

  async function handleToggleStatus() {
    if (!client) return;

    try {
      await clientStore.toggleClientStatus(clientId, !formData.isActive);
      formData.isActive = !formData.isActive;
      toast.success(`Client ${formData.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling client status:', error);
      toast.error('Failed to update client status');
    }
  }

  function handleCancel() {
    goto('/clients');
  }
</script>

<svelte:head>
  <title>Edit Client - CRM</title>
</svelte:head>

{#if loading}
  <div class="flex items-center justify-center min-h-[400px]">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span class="ml-2">Loading client...</span>
  </div>
{:else if !client}
  <div class="flex flex-col items-center justify-center min-h-[400px]">
    <h2 class="text-2xl font-bold">Client Not Found</h2>
    <p class="text-muted-foreground mt-2">The requested client could not be found.</p>
    <Button onclick={handleCancel} class="mt-4">Back to Clients</Button>
  </div>
{:else}
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="flex items-center space-x-4">
      <Button variant="ghost" onclick={handleCancel}>
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Clients
      </Button>
    </div>

    <Card.Root>
      <Card.Header>
        <Card.Title>Edit Client</Card.Title>
        <Card.Description>
          Update client information and manage account status.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form onsubmit={handleSubmit} class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="firstName">First Name *</Label>
              <Input
                id="firstName"
                bind:value={formData.firstName}
                placeholder="John"
                disabled={saving}
              />
              {#if errors.firstName}
                <p class="text-sm text-destructive">{errors.firstName}</p>
              {/if}
            </div>
            <div class="space-y-2">
              <Label for="lastName">Last Name *</Label>
              <Input
                id="lastName"
                bind:value={formData.lastName}
                placeholder="Doe"
                disabled={saving}
              />
              {#if errors.lastName}
                <p class="text-sm text-destructive">{errors.lastName}</p>
              {/if}
            </div>
          </div>

          <div class="space-y-2">
            <Label for="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              bind:value={formData.email}
              placeholder="john.doe@company.com"
              disabled={saving}
            />
            {#if errors.email}
              <p class="text-sm text-destructive">{errors.email}</p>
            {/if}
          </div>

          <div class="space-y-2">
            <Label for="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              bind:value={formData.phoneNumber}
              placeholder="+1 (555) 123-4567"
              disabled={saving}
            />
            {#if errors.phoneNumber}
              <p class="text-sm text-destructive">{errors.phoneNumber}</p>
            {/if}
          </div>

          <div class="space-y-4">
            <Label>Address (Optional)</Label>
            <div class="space-y-2">
              <Input
                bind:value={formData.street}
                placeholder="Street Address"
                disabled={saving}
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <Input
                bind:value={formData.city}
                placeholder="City"
                disabled={saving}
              />
              <Input
                bind:value={formData.state}
                placeholder="State/Province"
                disabled={saving}
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <Input
                bind:value={formData.country}
                placeholder="Country"
                disabled={saving}
              />
              <Input
                bind:value={formData.postalCode}
                placeholder="Postal Code"
                disabled={saving}
              />
            </div>
          </div>

          <div class="flex items-center justify-between p-4 border rounded-lg">
            <div class="space-y-1">
              <Label for="isActive">Account Status</Label>
              <p class="text-sm text-muted-foreground">
                {formData.isActive ? 'Client account is active' : 'Client account is inactive'}
              </p>
            </div>
            <Switch
              id="isActive"
              bind:checked={formData.isActive}
              onclick={handleToggleStatus}
              disabled={saving}
            />
          </div>

          <div class="flex justify-end space-x-4">
            <Button type="button" variant="outline" onclick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
{/if}