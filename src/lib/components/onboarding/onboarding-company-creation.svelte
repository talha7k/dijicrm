<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';

 	const dispatch = createEventDispatcher<{
 		companyCreated: { name: string; description: string };
 		back: void;
 	}>();

	let companyName = $state('');
	let companyDescription = $state('');

	function handleSubmit() {
		if (companyName.trim()) {
			dispatch('companyCreated', {
				name: companyName.trim(),
				description: companyDescription.trim()
			});
		}
	}

	function handleBack() {
		dispatch('back');
	}
</script>

<div class="space-y-4">
	<div>
		<label for="companyName" class="block text-sm font-medium text-gray-700 mb-2">
			Company Name *
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

	<div class="flex justify-between pt-4">
		<Button variant="outline" onclick={handleBack}>
			Back
		</Button>
		<Button onclick={handleSubmit} disabled={!companyName.trim()}>
			Create Company
		</Button>
	</div>
</div>