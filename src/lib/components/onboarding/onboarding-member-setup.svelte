<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import CompanyCodeInput from '$lib/components/auth/company-code-input.svelte';

	const dispatch = createEventDispatcher<{
		companyValidated: { code: string };
		back: void;
	}>();

	function handleCompanyValidated(event: CustomEvent<{ code: string }>) {
		dispatch('companyValidated', { code: event.detail.code });
	}

	function handleBack() {
		dispatch('back');
	}
</script>

<div class="space-y-4">
	<CompanyCodeInput on:validate={handleCompanyValidated} />

	<div class="flex justify-between pt-4">
		<Button variant="outline" onclick={handleBack}>
			Back
		</Button>
	</div>
</div>