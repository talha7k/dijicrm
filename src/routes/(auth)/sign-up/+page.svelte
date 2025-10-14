<script lang="ts">
	import SignInWithGoogle from '$lib/components/auth/google-sign-in.svelte';
	import SignUpForm from '$lib/components/auth/sign-up-form.svelte';
	import RoleSelection from '$lib/components/auth/role-selection.svelte';
	import InvitationCodeInput from '$lib/components/auth/invitation-code-input.svelte';
	import CompanyCodeInput from '$lib/components/auth/company-code-input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// Check for invitation token in URL
	let invitationToken = $derived($page.url.searchParams.get('token'));

	// Multi-step state
	let currentStep = $state(1);
	let selectedRole: 'client' | 'company-member' | 'create-company' | null = $state(null);
	let invitationCode = $state('');
	let companyCode = $state('');
	let companyName = $state('');
	let companyDescription = $state('');

	function handleRoleSelected(event: CustomEvent<{ role: 'client' | 'company-member' | 'create-company' }>) {
		selectedRole = event.detail.role;
		currentStep = 2;
	}

	function handleInvitationValidated(event: CustomEvent<{ code: string }>) {
		invitationCode = event.detail.code;
		currentStep = 3;
	}

	function handleCompanyValidated(event: CustomEvent<{ code: string }>) {
		companyCode = event.detail.code;
		currentStep = 3;
	}

	function handleCreateCompany() {
		if (companyName.trim()) {
			currentStep = 3;
		}
	}

	function goBack() {
		if (currentStep > 1) {
			currentStep = currentStep - 1;
		}
	}
</script>

<Card.Root class="sm:w-[448px]">
	<Card.Header>
		<Card.Title class="text-center text-2xl">
			{#if currentStep === 1}
				Sign Up
			{:else if currentStep === 2}
				{selectedRole === 'client' ? 'Join with Invitation' : selectedRole === 'company-member' ? 'Join Company' : 'Create Company'}
			{:else}
				Create Account
			{/if}
		</Card.Title>
		<Card.Description class="text-center">
			{#if currentStep === 1}
				Already have an account?
				<Button variant="link" href="/sign-in" class="p-0">Sign in here</Button>
			{:else}
				<Button variant="link" onclick={goBack} class="p-0">← Back</Button>
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-5">
		{#if currentStep === 1}
			<RoleSelection on:roleSelected={handleRoleSelected} />
		{:else if currentStep === 2}
			{#if selectedRole === 'client'}
				<InvitationCodeInput on:validate={handleInvitationValidated} />
			{:else if selectedRole === 'company-member'}
				<CompanyCodeInput on:validate={handleCompanyValidated} />
			{:else if selectedRole === 'create-company'}
				<div class="space-y-4">
					<div>
						<label for="companyName" class="block text-sm font-medium text-gray-700 mb-2">
							Company Name
						</label>
						<input
							id="companyName"
							type="text"
							bind:value={companyName}
							placeholder="Enter company name"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label for="companyDescription" class="block text-sm font-medium text-gray-700 mb-2">
							Description (optional)
						</label>
						<textarea
							id="companyDescription"
							bind:value={companyDescription}
							placeholder="Brief description of your company"
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						></textarea>
					</div>
					<Button onclick={handleCreateCompany} disabled={!companyName.trim()} class="w-full">
						Create Company
					</Button>
				</div>
			{/if}
		{:else if currentStep === 3}
			<div class="space-y-5">
				<SignInWithGoogle
					label="Sign up with"
					{selectedRole}
					disabled={!selectedRole}
				/>

				<div
					class="before:muted-foreground after:muted-foreground flex items-center text-xs uppercase text-muted-foreground before:me-6 before:flex-1 before:border-t after:ms-6 after:flex-1 after:border-t dark:before:border-muted-foreground dark:after:border-muted-foreground"
				>
					Or
				</div>

				<SignUpForm
					{invitationToken}
					{selectedRole}
				/>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
