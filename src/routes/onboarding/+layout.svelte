<script lang="ts">
	import { goto } from '$app/navigation';
	import { firekitUser } from 'svelte-firekit';
	import { userProfile } from '$lib/stores/user';
	import { isProfileComplete } from '$lib/services/profileValidationService';

	let { children } = $props();

	// Track if we've already handled navigation to prevent loops
	let hasHandledNavigation = $state(false);

	$effect(() => {
		if (hasHandledNavigation) return;

		// Check if user is authenticated
		if (firekitUser.initialized && !firekitUser.isAuthenticated) {
			hasHandledNavigation = true;
			goto('/sign-in');
			return;
		}

		// Check if user has a complete profile
		const profile = $userProfile;
		if (firekitUser.initialized && firekitUser.isAuthenticated && profile.data && isProfileComplete(profile.data)) {
			hasHandledNavigation = true;
			// User has complete profile, redirect to appropriate dashboard
			if (profile.data.role === 'client') {
				goto('/client-dashboard');
			} else {
				goto('/dashboard');
			}
			return;
		}
	});
</script>

<main class="flex h-[100dvh] flex-col items-center justify-center bg-background">
	<div class="w-full max-w-md">
		{@render children()}
	</div>
</main>