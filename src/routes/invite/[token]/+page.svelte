<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { firekitAuth } from 'svelte-firekit';
  import Button from '$lib/components/ui/button/button.svelte';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { toast } from 'svelte-sonner';
  import type { UserProfile } from '$lib/types/user';
  import { Timestamp } from 'firebase/firestore';

  const token = $page.params.token;

  let invitationValid = $state(false);
  let clientData = $state<UserProfile | null>(null);
  let loading = $state(true);
  let accepting = $state(false);

  let formData = $state({
    password: '',
    confirmPassword: ''
  });

  let errors = $state({
    password: '',
    confirmPassword: '',
    general: ''
  });

  onMount(async () => {
    try {
      // Validate invitation token
      // In a real implementation, this would query the database
      // For now, we'll mock validation

      // Mock client data based on token
      if (token === 'mock-token-123') {
        clientData = {
          uid: 'client-2',
          email: 'jane.smith@client.com',
          displayName: 'Jane Smith',
          photoURL: null,
          isActive: false,
          lastLoginAt: Timestamp.now(),
          createdAt: Timestamp.fromDate(new Date('2024-01-05')),
          updatedAt: Timestamp.fromDate(new Date('2024-01-10')),
          firstName: 'Jane',
          lastName: 'Smith',
          phoneNumber: '+1-555-0456',
          emailNotifications: true,
          pushNotifications: false,
          theme: 'dark',
          language: 'en',
          role: 'client',
          permissions: [],
          metadata: {
            accountStatus: 'invited'
          },
          invitationToken: token,
          invitationExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
          invitedBy: 'company-user-1',
          invitationStatus: 'pending'
        };
        invitationValid = true;
      } else {
        invitationValid = false;
        errors.general = 'Invalid or expired invitation link.';
      }
    } catch (error) {
      console.error('Error validating invitation:', error);
      invitationValid = false;
      errors.general = 'Failed to validate invitation.';
    } finally {
      loading = false;
    }
  });

  async function handleAcceptInvitation(event: Event) {
    event.preventDefault();
    accepting = true;

    // Clear previous errors
    errors = { password: '', confirmPassword: '', general: '' };

    // Validate passwords
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (errors.password || errors.confirmPassword) {
      accepting = false;
      return;
    }

    try {
      if (!clientData) {
        throw new Error('Client data not available');
      }

      // Create Firebase Auth account
      await firekitAuth.registerWithEmail(clientData.email, formData.password, clientData.displayName);

      // Update client status to active
      // In real implementation, update the database
      console.log('Activating client account:', clientData.uid);

      toast.success('Account activated successfully! Welcome to the client portal.');
      goto('/client-dashboard');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          errors.general = 'An account with this email already exists. Please sign in instead.';
        } else {
          errors.general = error.message;
        }
      } else {
        errors.general = 'Failed to activate account. Please try again.';
      }
    } finally {
      accepting = false;
    }
  }

  function handleSignIn() {
    goto('/sign-in');
  }
</script>

<svelte:head>
  <title>Accept Invitation - CRM</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    {#if loading}
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p class="mt-4 text-gray-600">Validating invitation...</p>
      </div>
    {:else if !invitationValid}
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-center text-red-600">Invalid Invitation</Card.Title>
        </Card.Header>
        <Card.Content>
          <p class="text-center text-gray-600 mb-4">
            {errors.general || 'This invitation link is invalid or has expired.'}
          </p>
          <div class="text-center">
            <Button onclick={handleSignIn} variant="outline">
              Go to Sign In
            </Button>
          </div>
        </Card.Content>
      </Card.Root>
    {:else if clientData}
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-center">Complete Your Account Setup</Card.Title>
          <Card.Description class="text-center">
            Welcome, {clientData.firstName}! Set up your password to access your client portal.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 class="font-medium text-blue-900 mb-2">Account Details</h3>
            <p class="text-sm text-blue-700">
              <strong>Name:</strong> {clientData.displayName}<br>
              <strong>Email:</strong> {clientData.email}<br>
              <strong>Company:</strong> Company Name
            </p>
          </div>

          {#if errors.general}
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{errors.general}</p>
            </div>
          {/if}

          <form onsubmit={handleAcceptInvitation} class="space-y-4">
            <div class="space-y-2">
              <Label for="password">Password *</Label>
              <Input
                id="password"
                type="password"
                bind:value={formData.password}
                placeholder="Create a strong password"
                disabled={accepting}
                required
              />
              {#if errors.password}
                <p class="text-sm text-red-600">{errors.password}</p>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                bind:value={formData.confirmPassword}
                placeholder="Confirm your password"
                disabled={accepting}
                required
              />
              {#if errors.confirmPassword}
                <p class="text-sm text-red-600">{errors.confirmPassword}</p>
              {/if}
            </div>

            <Button type="submit" class="w-full" disabled={accepting}>
              {accepting ? 'Setting up account...' : 'Complete Setup'}
            </Button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Already have an account?
              <Button variant="link" onclick={handleSignIn} class="p-0 h-auto">
                Sign in here
              </Button>
            </p>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
  </div>
</div>