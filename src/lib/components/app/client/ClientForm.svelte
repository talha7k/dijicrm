<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { clientManagementStore } from '$lib/stores/clientManagement';
  import { toast } from 'svelte-sonner';
  import type { UserProfile } from '$lib/types/user';

  interface Props {
    client: UserProfile | null;
    onSave: (client: UserProfile) => void;
    onCancel: () => void;
  }

  let { client, onSave, onCancel }: Props = $props();

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

  onMount(() => {
    if (client) {
      formData.firstName = client.firstName || '';
      formData.lastName = client.lastName || '';
      formData.email = client.email || '';
      formData.phoneNumber = client.phoneNumber || '';
      formData.street = client.address?.street || '';
      formData.city = client.address?.city || '';
      formData.state = client.address?.state || '';
      formData.country = client.address?.country || '';
      formData.postalCode = client.address?.postalCode || '';
    }
  });

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

      if (client) {
        // Update existing client
        await clientManagementStore.updateClient(client.uid, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber || undefined,
          address
        });
        const updatedClient = { ...client, ...formData, address };
        toast.success('Client updated successfully!');
        onSave(updatedClient);
      } else {
        // Add new client
        await clientManagementStore.addClient({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber || undefined,
          address
        });
        toast.success('Client added successfully!');
        onSave(null as any); // Pass null since the component will refresh the list
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(`Failed to ${client ? 'update' : 'add'} client`);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-4">
  <div class="grid grid-cols-2 gap-4">
    <div>
      <Label for="firstName">First Name *</Label>
      <Input
        id="firstName"
        bind:value={formData.firstName}
        class={errors.firstName ? 'border-red-500' : ''}
        required
      />
      {#if errors.firstName}
        <p class="text-sm text-red-500 mt-1">{errors.firstName}</p>
      {/if}
    </div>
    <div>
      <Label for="lastName">Last Name *</Label>
      <Input
        id="lastName"
        bind:value={formData.lastName}
        class={errors.lastName ? 'border-red-500' : ''}
        required
      />
      {#if errors.lastName}
        <p class="text-sm text-red-500 mt-1">{errors.lastName}</p>
      {/if}
    </div>
  </div>

  <div>
    <Label for="email">Email *</Label>
    <Input
      id="email"
      type="email"
      bind:value={formData.email}
      class={errors.email ? 'border-red-500' : ''}
      required
    />
    {#if errors.email}
      <p class="text-sm text-red-500 mt-1">{errors.email}</p>
    {/if}
  </div>

  <div>
    <Label for="phoneNumber">Phone Number</Label>
    <Input
      id="phoneNumber"
      type="tel"
      bind:value={formData.phoneNumber}
      class={errors.phoneNumber ? 'border-red-500' : ''}
    />
    {#if errors.phoneNumber}
      <p class="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label>Address</Label>
    <div class="space-y-2">
      <Input
        placeholder="Street"
        bind:value={formData.street}
      />
      <div class="grid grid-cols-3 gap-2">
        <Input
          placeholder="City"
          bind:value={formData.city}
        />
        <Input
          placeholder="State"
          bind:value={formData.state}
        />
        <Input
          placeholder="Postal Code"
          bind:value={formData.postalCode}
        />
      </div>
      <Input
        placeholder="Country"
        bind:value={formData.country}
      />
    </div>
  </div>

  <div class="flex gap-2 pt-4">
    <Button
      type="button"
      variant="outline"
      onclick={onCancel}
      disabled={isSubmitting}
    >
      Cancel
    </Button>
    <Button
      type="submit"
      disabled={isSubmitting}
    >
      {isSubmitting ? 'Saving...' : (client ? 'Update Client' : 'Add Client')}
    </Button>
  </div>
</form>