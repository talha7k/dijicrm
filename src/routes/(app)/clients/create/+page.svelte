<script lang="ts">
  import { goto } from '$app/navigation';
  import { requireCompany } from '$lib/utils/auth';
  import { useClientManagement } from '$lib/hooks/useClientManagement';
  import { userProfile } from '$lib/stores/user';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { toast } from 'svelte-sonner';

  // Require company access
  requireCompany();

  const clientStore = useClientManagement;

  let formData = $state({
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

  let isSubmitting = $state(false);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    isSubmitting = true;

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
      isSubmitting = false;
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

      await clientStore.createClient({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || undefined,
        address
      }, 'company-user-1', 'company-1'); // Mock values for now

      toast.success('Client invitation sent successfully!');
      goto('/clients');
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to send client invitation');
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto('/clients');
  }
</script>

<svelte:head>
  <title>Invite Client - CRM</title>
</svelte:head>

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
      <Card.Title>Invite New Client</Card.Title>
      <Card.Description>
        Send an invitation to a new client. They'll receive an email with instructions to complete their account setup.
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
            {#if errors.street}
              <p class="text-sm text-destructive">{errors.street}</p>
            {/if}
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Input
                bind:value={formData.city}
                placeholder="City"
                disabled={isSubmitting}
              />
              {#if errors.city}
                <p class="text-sm text-destructive">{errors.city}</p>
              {/if}
            </div>
            <div class="space-y-2">
              <Input
                bind:value={formData.state}
                placeholder="State/Province"
                disabled={isSubmitting}
              />
              {#if errors.state}
                <p class="text-sm text-destructive">{errors.state}</p>
              {/if}
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Input
                bind:value={formData.country}
                placeholder="Country"
                disabled={isSubmitting}
              />
              {#if errors.country}
                <p class="text-sm text-destructive">{errors.country}</p>
              {/if}
            </div>
            <div class="space-y-2">
              <Input
                bind:value={formData.postalCode}
                placeholder="Postal Code"
                disabled={isSubmitting}
              />
              {#if errors.postalCode}
                <p class="text-sm text-destructive">{errors.postalCode}</p>
              {/if}
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-4">
          <Button type="button" variant="outline" onclick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>
</div>