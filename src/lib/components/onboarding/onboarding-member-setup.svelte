<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import CompanyCodeInput from '$lib/components/auth/company-code-input.svelte';

	const dispatch = createEventDispatcher<{
		companyValidated: { code: string; company: any; invitation?: any };
		back: void;
	}>();

	let invitationCode = $state('');
	let validationError = $state('');
	let isValidating = $state(false);

	async function handleInvitationValidation(event: CustomEvent<{ code: string }>) {
		console.log('🔍 handleInvitationValidation called with:', event.detail);
		invitationCode = event.detail.code;
		isValidating = true;
		validationError = '';

		try {
			console.log('📡 Sending validation request for code:', invitationCode);
			const response = await fetch('/api/invitations/validate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ code: invitationCode }),
			});

			console.log('📡 Response status:', response.status);
			const result = await response.json();
			console.log('📡 Response result:', result);

			if (response.ok) {
				if (result.valid) {
					console.log('✅ Invitation valid, dispatching companyValidated');
					dispatch('companyValidated', { 
						code: invitationCode,
						company: result.company,
						invitation: result.invitation
					});
				} else {
					console.log('❌ Invitation invalid:', result.error);
					validationError = result.error || 'Invalid invitation code';
				}
			} else {
				console.log('❌ API error:', result);
				validationError = result.error || 'Failed to validate invitation code';
			}
		} catch (error) {
			console.error('❌ Network error:', error);
			validationError = 'Network error occurred';
		} finally {
			console.log('🏁 Validation finished, isValidating:', false);
			isValidating = false;
		}
	}

	function handleBack() {
		dispatch('back');
	}
</script>

<div class="space-y-4">
	<div class="space-y-2">
		<label for="invitation-code" class="block text-sm font-medium text-foreground mb-2">
			Invitation Code
		</label>
		<p class="text-sm text-muted-foreground">
			Enter the invitation code provided by your company administrator.
		</p>
	</div>

	<CompanyCodeInput 
		code={invitationCode}
		error={validationError}
		loading={isValidating}
		placeholder="Enter invitation code"
		on:validate={handleInvitationValidation} 
	/>

	{#if validationError}
		<div class="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
			<p class="text-sm text-destructive">{validationError}</p>
		</div>
	{/if}

	<div class="flex justify-between pt-4">
		<Button variant="outline" onclick={handleBack}>
			Back
		</Button>
	</div>
</div>