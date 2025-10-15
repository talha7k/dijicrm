<script>
	import { goto } from '$app/navigation';
	import { firekitUser } from 'svelte-firekit';
	import { userProfile } from '$lib/stores/user';
	import { isProfileComplete } from '$lib/services/profileValidationService';
	import { redirectToDashboard } from '$lib/utils/auth';

	let { children } = $props();

	// Track if we've already handled navigation to prevent loops
	let hasHandledNavigation = $state(false);

	$effect(() => {
		if (hasHandledNavigation) return;

		if (firekitUser.initialized && firekitUser.isAuthenticated) {
			const profile = $userProfile;

			// Check if user has a complete profile
			if (profile.data && isProfileComplete(profile.data)) {
				// User has complete profile, redirect to appropriate dashboard
				hasHandledNavigation = true;
				redirectToDashboard();
			} else if (profile.data === undefined && !profile.loading) {
				// Profile loaded but doesn't exist - redirect to onboarding
				hasHandledNavigation = true;
				goto('/onboarding');
			}
			// If profile is still loading, wait for it to complete
		}
	});
</script>

{#if firekitUser.initialized && !firekitUser.isAuthenticated}
	<main class="flex h-[100dvh] flex-col items-center justify-center">
		{@render children()}
	</main>
{/if}
