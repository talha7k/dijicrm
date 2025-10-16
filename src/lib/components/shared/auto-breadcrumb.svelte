<script lang="ts">
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { clientManagementStore } from '$lib/stores/clientManagement';
	import { get } from 'svelte/store';
	import type { UserProfile } from '$lib/types/user';

	const path = $derived(page.url.pathname);
	const segments = $derived(path.split('/').filter(Boolean)); // split path and remove empty segments

	// Get client data for name resolution
	let clients = $state<UserProfile[]>([]);
	$effect(() => {
		clientManagementStore.subscribe(state => {
			clients = state.clients;
		});
	});

	const breadcrumbs = $derived(
		segments.map((segment, index) => {
			// Construct the path up to this segment
			const href = '/' + segments.slice(0, index + 1).join('/');

			// Check if this segment is a client ID and try to resolve it to a name
			let displayName = segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

			// If we're in a clients route and this looks like a client ID, try to find the client name
			if (segments[0] === 'clients' && index === 1 && segment.length > 10) {
				const client = clients.find(c => c.uid === segment);
				if (client) {
					displayName = client.displayName || `${client.firstName} ${client.lastName}`;
				}
			}

			// Handle other special cases
			if (segment === 'create') {
				displayName = 'Create';
			} else if (segment === 'edit') {
				displayName = 'Edit';
			} else if (segment === 'orders') {
				displayName = 'Orders';
			}

			return {
				name: displayName,
				href
			};
		})
	);
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		{#each breadcrumbs as breadcrumb, i}
			{#if i > 0}
				<Breadcrumb.Separator class="hidden md:block" />
			{/if}
			<Breadcrumb.Item>
				<!-- Check if it's the last breadcrumb item to render as Page instead of Link -->
				{#if i === breadcrumbs.length - 1}
					<Breadcrumb.Page>{breadcrumb.name}</Breadcrumb.Page>
				{:else}
					<Breadcrumb.Link href={breadcrumb.href} class="hidden md:block"
						>{breadcrumb.name}</Breadcrumb.Link
					>
				{/if}
			</Breadcrumb.Item>
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
