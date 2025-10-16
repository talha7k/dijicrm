<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		roleSelected: { role: 'client' | 'company-member' | 'create-company' };
	}>();

	function selectRole(role: 'client' | 'company-member' | 'create-company') {
		dispatch('roleSelected', { role });
	}
</script>

<div class="role-selection">
	<h3 class="text-lg font-semibold mb-4 text-center">Select Your Role</h3>

	<div class="grid gap-4 grid-cols-1">
		<!-- Client Role -->
		<button
			class="role-card p-6 border rounded-lg text-left hover:border-primary transition-colors"
			onclick={() => selectRole('client')}
		>
			<div class="flex items-center mb-2">
				<div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
					<svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
					</svg>
				</div>
				<h4 class="font-medium text-foreground">Client</h4>
			</div>
			<p class="text-sm text-muted-foreground">
				Join an existing company using an invitation code to access your orders and documents.
			</p>
		</button>

		<!-- Company Member Role -->
		<button
			class="role-card p-6 border rounded-lg text-left hover:border-primary transition-colors"
			onclick={() => selectRole('company-member')}
		>
			<div class="flex items-center mb-2">
				<div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
					<svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
					</svg>
				</div>
				<h4 class="font-medium text-foreground">Company Member</h4>
			</div>
			<p class="text-sm text-muted-foreground">
				Join an existing company using a company code to collaborate on client management.
			</p>
		</button>

		<!-- Create Company Role -->
		<button
			class="role-card p-6 border rounded-lg text-left hover:border-primary transition-colors"
			onclick={() => selectRole('create-company')}
		>
			<div class="flex items-center mb-2">
				<div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
					<svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
					</svg>
				</div>
				<h4 class="font-medium text-foreground">Create Company</h4>
			</div>
			<p class="text-sm text-muted-foreground">
				Start a new company and become the admin to manage clients, orders, and documents.
			</p>
		</button>
	</div>
</div>

<style>
	.role-card {
		transition: all 0.2s ease;
	}

	.role-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
</style>