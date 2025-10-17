<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import CompanyCodeInput from '$lib/components/auth/company-code-input.svelte';

	const dispatch = createEventDispatcher<{
		companyValidated: { code: string; invitation: any; company: any };
		back: void;
	}>();

	let invitationCode = $state('');
	let validationError = $state('');
	let isValidating = $state(false);

	async function handleInvitationValidation(event: CustomEvent<{ code: string }>) {
		invitationCode = event.detail.code;
		isValidating = true;
		validationError = '';

		try {
			const response = await fetch('/api/invitations/validate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ code: invitationCode }),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.valid) {
					dispatch('companyValidated', { 
						code: invitationCode,
						invitation: result.invitation,
						company: result.company
					});
				} else {
					validationError = 'Invalid invitation code';
				}
			} else {
				const error = await response.json();
				validationError = error.error || 'Failed to validate invitation code';
			}
		} catch (error) {
			validationError = 'Network error occurred';
		} finally {
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