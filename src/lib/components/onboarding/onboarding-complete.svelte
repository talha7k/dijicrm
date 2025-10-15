<script lang="ts">
 	import { createEventDispatcher } from 'svelte';
 	import Button from '$lib/components/ui/button/button.svelte';
 	import { firekitUser } from 'svelte-firekit';
 	import { createUserProfile } from '$lib/services/profileCreationService';
 	import type { User } from 'firebase/auth';
 	import { toast } from 'svelte-sonner';

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

 			// Create user profile based on selected role
 			const profileData = {
 				role: selectedRole === 'create-company' ? 'company' : 'client',
 				currentCompanyId: onboardingData.company?.id || '',
 				// Add other profile data as needed
 			};

 			await createUserProfile(firekitUser.user as User, {
 				role: selectedRole!,
 				invitationCode: onboardingData.invitationCode,
 				companyCode: onboardingData.companyCode,
 				companyName: onboardingData.companyName,
 				companyDescription: onboardingData.companyDescription,
 			});

 			dispatch('complete');
 		} catch (error) {
 			console.error('Error creating profile:', error);
 			toast.error('Failed to complete setup. Please try again.');
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