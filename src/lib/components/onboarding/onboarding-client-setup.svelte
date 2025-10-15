<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import InvitationCodeInput from '$lib/components/auth/invitation-code-input.svelte';

	const dispatch = createEventDispatcher<{
		invitationValidated: { code: string; invitation: any; company: any };
		back: void;
	}>();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let invitationCode = $state('');

	async function validateInvitation(code: string) {
		loading = true;
		error = null;

		try {
			const response = await fetch('/api/invitations/validate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ code }),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to validate invitation');
			}

			dispatch('invitationValidated', {
				code,
				invitation: result.invitation,
				company: result.company,
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred while validating the invitation';
		} finally {
			loading = false;
		}
	}

	function handleInvitationValidated(event: CustomEvent<{ code: string }>) {
		invitationCode = event.detail.code;
		validateInvitation(event.detail.code);
	}

	function handleBack() {
		dispatch('back');
	}
</script>

<div class="space-y-4">
	<InvitationCodeInput
		{error}
		{loading}
		on:validate={handleInvitationValidated}
	/>

	<div class="flex justify-between pt-4">
		<Button variant="outline" onclick={handleBack}>
			Back
		</Button>
	</div>
</div>