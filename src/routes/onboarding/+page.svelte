<script lang="ts">
	import { goto } from '$app/navigation';
	import { firekitUser } from 'svelte-firekit';
	import { authStore } from '$lib/services/authService';
	import { app } from '$lib/stores/app';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import OnboardingRoleSelection from '$lib/components/onboarding/onboarding-role-selection.svelte';
	import OnboardingClientSetup from '$lib/components/onboarding/onboarding-client-setup.svelte';
	import OnboardingMemberSetup from '$lib/components/onboarding/onboarding-member-setup.svelte';
	import OnboardingCompanyCreation from '$lib/components/onboarding/onboarding-company-creation.svelte';
	import OnboardingComplete from '$lib/components/onboarding/onboarding-complete.svelte';

	// Redirect if onboarding is already completed (auth is handled by layout)
	$effect(() => {
		if (!$app.initializing && $app.authenticated) {
			// If onboarding is already completed, redirect to appropriate dashboard
			const profile = $authStore.profile;
			if (profile?.onboardingCompleted) {
				if (profile.role === 'client') {
					goto('/client-dashboard');
				} else {
					goto('/dashboard');
				}
			}
		}
	});

	// Get user info for personalization
	let user = $derived(firekitUser.user);

	// Multi-step state
	let currentStep = $state(1);
	let selectedRole: 'client' | 'company-member' | 'create-company' | null = $state(null);

	// Debug logging for currentStep changes
	$effect(() => {
		console.log('📍 currentStep changed to:', currentStep);
	});
	let onboardingData = $state({
		invitationCode: '',
		companyCode: '',
		companyName: '',
		companyDescription: '',
		invitation: null as any,
		company: null as any
	});

	// Handle role selection
	function handleRoleSelected(event: CustomEvent<{ role: 'client' | 'company-member' | 'create-company' }>) {
		selectedRole = event.detail.role;
		// Stay on step 2 to show the appropriate setup component
		// Don't move to step 3 until validation is complete
	}

 	// Handle company code validation
	function handleCompanyValidated(event: CustomEvent<{ code: string; company: any; invitation?: any }>) {
		console.log('🎯 handleCompanyValidated called with:', event.detail);
		console.log('🎯 selectedRole is:', selectedRole);
		console.log('🎯 currentStep is:', currentStep);
		onboardingData.invitationCode = event.detail.code;
		onboardingData.company = event.detail.company;
		onboardingData.invitation = event.detail.invitation;
		console.log('📊 Moving to step 3, currentStep was:', currentStep);
		currentStep = 3;
		console.log('📊 currentStep is now:', currentStep);
	}

 	// Handle company creation
 	function handleCompanyCreated(event: CustomEvent<{ name: string; description: string }>) {
 		onboardingData.companyName = event.detail.name;
 		onboardingData.companyDescription = event.detail.description;
 		currentStep = 3;
 	}

	// Handle onboarding completion
	function handleOnboardingComplete() {
		// Redirect to appropriate dashboard
		if (selectedRole === 'client') {
			goto('/client-dashboard');
		} else {
			goto('/dashboard');
		}
	}

 	// Go back to previous step
 	function goBack() {
 		if (currentStep > 1) {
 			currentStep = currentStep - 1;
 			// If going back from step 3, reset selections to allow re-choice
 			if (currentStep === 2) {
 				selectedRole = null;
 				onboardingData = {
 					invitationCode: '',
 					companyCode: '',
 					companyName: '',
 					companyDescription: '',
 					invitation: null,
 					company: null
 				};
 			}
 		}
 	}

	// Get step title
	function getStepTitle(): string {
		switch (currentStep) {
			case 1: return 'Welcome!';
			case 2: return selectedRole === 'client' ? 'Join with Invitation' :
						   selectedRole === 'company-member' ? 'Join Company' :
						   'Create Company';
			case 3: return 'Complete Setup';
			default: return 'Welcome!';
		}
	}

	// Get step description
	function getStepDescription(): string {
		switch (currentStep) {
			case 1: return 'Let\'s get your account set up so you can start managing your orders.';
			case 2: return selectedRole === 'client' ? 'Enter your invitation code to join a company.' :
						   selectedRole === 'company-member' ? 'Enter your invitation code to join an organization.' :
						   'Provide details for your new company.';
			case 3: return 'Your account is being set up. This will only take a moment.';
			default: return 'Let\'s get your account set up so you can start managing your orders.';
		}
	}
</script>

 <Card.Root class="w-full max-w-5xl mx-auto">
 	<Card.Header class="text-center">
 		<div class="flex items-center justify-between w-full">
 			{#if currentStep > 1}
 				<Button onclick={goBack} variant="ghost" size="sm" class="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 p-0">
 					<svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
 					</svg>
 				</Button>
 			{:else}
 				<div></div>
 			{/if}
 			<div class="flex-1 text-center">
 				<Card.Title class="text-2xl font-bold">{getStepTitle()}</Card.Title>
 				<Card.Description class="text-lg">
 					{getStepDescription()}
 				</Card.Description>
 			</div>
 			{#if currentStep > 1}
 				<div class="w-16"></div> <!-- Spacer for balance -->
 			{/if}
 		</div>
 	</Card.Header>

	<Card.Content class="space-y-5">
		{#if currentStep === 1}
			<!-- Welcome Step -->
			<div class="text-center space-y-4">
				<div class="bg-primary/10 border border-primary/20 rounded-lg p-4">
					<h3 class="font-semibold text-primary mb-2">What happens next?</h3>
					<p class="text-primary/80 text-sm">
						We'll help you choose your role and set up your company or join an existing one.
						This will only take a few minutes.
					</p>
				</div>

				<div class="space-y-3">
					<div class="flex items-center space-x-3 text-sm text-muted-foreground">
						<div class="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">1</div>
						<span>Select your role (Client, Company Member, or Create Company)</span>
					</div>
					<div class="flex items-center space-x-3 text-sm text-muted-foreground">
						<div class="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-semibold">2</div>
						<span>Provide company details or join existing organization</span>
					</div>
					<div class="flex items-center space-x-3 text-sm text-muted-foreground">
						<div class="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-semibold">3</div>
						<span>Complete your profile and start using the app</span>
					</div>
				</div>
			</div>

			<Button onclick={() => currentStep = 2} class="w-full" size="lg">
				Get Started
			</Button>
		{:else if currentStep === 2}
			{#if !selectedRole}
				<!-- Role Selection Step -->
				<OnboardingRoleSelection on:roleSelected={handleRoleSelected} />
 			{:else if selectedRole === 'client'}
 				<!-- Client Setup Step -->
 				<OnboardingClientSetup
 					on:companyValidated={handleCompanyValidated}
 					on:back={goBack}
 				/>
			{:else if selectedRole === 'company-member'}
				<!-- Company Member Setup Step -->
				<OnboardingMemberSetup
					on:companyValidated={handleCompanyValidated}
					on:back={goBack}
				/>
			{:else if selectedRole === 'create-company'}
				<!-- Company Creation Step -->
				<OnboardingCompanyCreation
					on:companyCreated={handleCompanyCreated}
					on:back={goBack}
				/>
			{/if}
		{:else if currentStep === 3}
			<!-- Completion Step -->
			<OnboardingComplete
				{selectedRole}
				{onboardingData}
				on:complete={handleOnboardingComplete}
			/>
		{/if}
	</Card.Content>
</Card.Root>