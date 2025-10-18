<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { firekitUser, firekitDoc } from 'svelte-firekit';
  import { completeUserOnboarding, validateOnboardingData } from '$lib/services/onboardingService';
  import { userProfile } from '$lib/stores/user';
  import { companyContext, initializeFromUser } from '$lib/stores/companyContext';
  import { app } from '$lib/stores/app';
  import { authStore } from '$lib/services/authService';
  import type { User } from 'firebase/auth';
  import type { UserProfile } from '$lib/types/user';
  import { toast } from 'svelte-sonner';
  import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import { refreshUserData } from '$lib/services/authService';

  let {
    selectedRole,
    onboardingData
  }: {
    selectedRole: 'client' | 'company-member' | 'create-company' | null;
    onboardingData: {
      invitationCode: string;
      companyCode: string;
      companyName: string;
      companyDescription: string;
      invitation?: any;
      company?: any;
    };
  } = $props();

  const dispatch = createEventDispatcher<{
    complete: void;
  }>();

  let isCreating = $state(false);
  let creationError = $state<string | null>(null);

  async function handleComplete() {
    console.log('🚀 handleComplete called, isCreating:', isCreating);
    if (isCreating) return;
    creationError = null; // Reset error state

    try {
      console.log('🚀 Starting onboarding completion...');
      isCreating = true;

      // Validate onboarding data before proceeding
      const validation = validateOnboardingData({
        role: selectedRole!,
        invitationCode: onboardingData.invitationCode,
        companyCode: onboardingData.companyCode,
        companyName: onboardingData.companyName,
        companyDescription: onboardingData.companyDescription,
      });

      if (!validation.isValid) {
        toast.error(`Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      console.log('Starting profile creation with validated data');

      const createdProfile = await completeUserOnboarding(firekitUser.user as User, {
        role: selectedRole!,
        invitationCode: onboardingData.invitationCode || onboardingData.companyCode,
        companyCode: onboardingData.companyCode,
        companyName: onboardingData.companyName,
        companyDescription: onboardingData.companyDescription,
      });

      console.log('Profile creation completed successfully');
      console.log('🔍 Created profile data:', {
        uid: createdProfile.uid,
        email: createdProfile.email,
        companyAssociations: createdProfile.companyAssociations,
        currentCompanyId: createdProfile.currentCompanyId,
        onboardingCompleted: createdProfile.onboardingCompleted
      });

      // Refresh the user data to ensure auth store is up to date
      // This ensures the company context has access to the latest data
      await refreshUserData();
      console.log('✅ Auth store refreshed using refreshUserData service');

      console.log('Profile store updated with created data');

      // Wait a moment for the profile to be fully persisted
      await new Promise(resolve => setTimeout(resolve, 500));

      // Initialize company context now that user has company associations
      try {
        console.log('Initializing company context after onboarding...');
        await initializeFromUser();
        
        // Company readiness will be handled by the unified auth service
        
        console.log('Company context initialized successfully');
        toast.success('Company setup completed successfully!');
      } catch (companyError) {
        console.error('Error initializing company context:', companyError);
        // Don't fail the onboarding, but log the error
        toast.error('Company setup completed, but context initialization failed. You may need to refresh the page.');
      }

      // Also verify the profile was actually saved by reading it directly
      try {
        const profileRef = doc(db, "users", firekitUser.user!.uid);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          console.log('Profile verified in Firestore:', profileDoc.data());
        } else {
          console.error('Profile not found in Firestore after creation!');
        }
      } catch (verifyError) {
        console.error('Error verifying profile in Firestore:', verifyError);
      }

      // Wait a moment for everything to sync, then dispatch complete
      setTimeout(() => {
        console.log('🚀 Dispatching complete event for redirect');
        dispatch('complete');
      }, 2000); // Increased delay to allow auth state to settle
    } catch (error) {
      console.error('Error creating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to complete setup: ${errorMessage}`);
      creationError = errorMessage;
    } finally {
      isCreating = false;
    }
  }

  function getRoleDisplayName(): string {
    switch (selectedRole) {
      case 'client': return 'Client';
      case 'company-member': return 'Company Member';
      case 'create-company': return 'Company Owner';
      default: return 'User';
    }
  }

  function getSetupSummary(): string {
    switch (selectedRole) {
      case 'client':
        return `Joined ${onboardingData.company?.name || 'company'} using invitation code: ${onboardingData.invitationCode}`;
      case 'company-member':
        return `Joined ${onboardingData.company?.name || 'company'} using invitation code: ${onboardingData.invitationCode}`;
      case 'create-company':
        return `Created company "${onboardingData.companyName}"`;
      default:
        return 'Account setup completed';
    }
  }
</script>

<div class="text-center space-y-6">
  <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
    <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
  </div>

  <div>
    <h3 class="text-xl font-semibold text-foreground mb-2">Setup Complete!</h3>
    <p class="text-muted-foreground">
      Your account has been configured as a <strong class="text-foreground">{getRoleDisplayName()}</strong>.
    </p>
  </div>

  <div class="bg-muted/50 border border-border rounded-lg p-4 text-left">
    <h4 class="font-medium text-foreground mb-2">What was set up:</h4>
    <p class="text-sm text-muted-foreground">{getSetupSummary()}</p>
    {#if selectedRole === 'create-company' && onboardingData.companyDescription}
      <p class="text-sm text-muted-foreground mt-1">
        Description: {onboardingData.companyDescription}
      </p>
    {/if}
  </div>

  <div class="space-y-3">
    <p class="text-sm text-muted-foreground">
      {#if creationError}
        <span class="text-destructive">Error occurred during setup. Please try again.</span>
      {:else}
        You're all set! Click below to start using the application.
      {/if}
    </p>

    {#if creationError}
      <Button onclick={handleComplete} class="w-full" size="lg" variant="outline">
        Try Again
      </Button>
    {:else}
      <Button onclick={handleComplete} class="w-full" size="lg" disabled={isCreating}>
        {#if isCreating}
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
          Setting up your account...
        {:else}
          Get Started
        {/if}
      </Button>
    {/if}
  </div>
</div>