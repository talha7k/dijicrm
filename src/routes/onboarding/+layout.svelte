<script lang="ts">
 	import { goto } from '$app/navigation';
 	import { firekitUser } from 'svelte-firekit';
 	import { userProfile } from '$lib/stores/user';
 	import { isProfileCompleteWithCompanyValidation } from '$lib/services/profileValidationService';

 	let { children } = $props();

 	// Track navigation state to prevent loops
 	let hasHandledNavigation = $state(false);
 	let isValidating = $state(false);

 	$effect(() => {
 		if (hasHandledNavigation || isValidating) return;

 		// Check if user is authenticated
 		if (firekitUser.initialized && !firekitUser.isAuthenticated) {
 			hasHandledNavigation = true;
 			goto('/sign-in');
 			return;
 		}

 		// Check if user has a complete profile with company validation
 		const profile = $userProfile;
 		if (firekitUser.initialized && firekitUser.isAuthenticated && profile.data && !profile.loading) {
 			isValidating = true;

 			// Use async validation to check company existence
 			isProfileCompleteWithCompanyValidation(profile.data).then((validation) => {
 				isValidating = false;

 				if (validation.isValid) {
 					hasHandledNavigation = true;
 					// User has complete profile and valid company, redirect to appropriate dashboard
 					if (profile.data!.role === 'client') {
 						goto('/client-dashboard');
 					} else {
 						goto('/dashboard');
 					}
 				}
 				// If validation fails, stay on onboarding page
 			}).catch((error) => {
 				console.error('Error validating profile:', error);
 				isValidating = false;
 				// Stay on onboarding page on error
 			});
 		}
 	});
</script>

<main class="flex h-[100dvh] flex-col items-center justify-center bg-background">
 	<div class="w-full max-w-md">
 		{#if isValidating}
 			<!-- Loading state during profile validation -->
 			<div class="text-center space-y-4">
 				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
 				<p class="text-sm text-muted-foreground">Validating your profile...</p>
 			</div>
 		{:else}
 			{@render children()}
 		{/if}
 	</div>
</main>