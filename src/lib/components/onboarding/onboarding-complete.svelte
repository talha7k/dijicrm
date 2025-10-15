<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { firekitUser, firekitDoc } from 'svelte-firekit';
  import { createUserProfile, validateOnboardingData } from '$lib/services/profileCreationService';
  import { userProfile } from '$lib/stores/user';
  import type { User } from 'firebase/auth';
  import type { UserProfile } from '$lib/types/user';
  import { toast } from 'svelte-sonner';
  import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
  import { db } from '$lib/firebase';

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

   async function handleComplete() {
   		if (isCreating) return;

   		try {
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

   			const createdProfile = await createUserProfile(firekitUser.user as User, {
   				role: selectedRole!,
   				invitationCode: onboardingData.invitationCode,
   				companyCode: onboardingData.companyCode,
   				companyName: onboardingData.companyName,
   				companyDescription: onboardingData.companyDescription,
   			});

   			console.log('Profile creation completed successfully');

   			// Immediately update the user profile store with the created data
   			// This bypasses any firekitDoc listener issues
   			userProfile.set({
   				data: createdProfile,
   				loading: false,
   				error: null,
   				update: async (data: Partial<UserProfile>) => {
   					// This will be overridden by the layout, but provide a basic implementation
   					console.log('Profile update called from onboarding:', data);
   				}
   			});

   			console.log('Profile store updated with created data');

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
   				dispatch('complete');
   			}, 1000);
   		} catch (error) {
   			console.error('Error creating profile:', error);
   			toast.error(`Failed to complete setup: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
				return `Joined company using invitation code: ${onboardingData.invitationCode}`;
			case 'company-member':
				return `Joined company using code: ${onboardingData.companyCode}`;
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
			You're all set! Click below to start using the application.
		</p>

 		<Button onclick={handleComplete} class="w-full" size="lg" disabled={isCreating}>
 			{#if isCreating}
 				<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
 				Setting up your account...
 			{:else}
 				Get Started
 			{/if}
 		</Button>
	</div>
</div>