<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	import SignInWithGoogle from '$lib/components/auth/google-sign-in.svelte';
	import SignInForm from '$lib/components/auth/sign-in-form.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { app } from '$lib/stores/app';
	import { get } from 'svelte/store';

	let checkingStatus = $state(false);
	let authenticating = $state(false);
	let formSubmitting = $state(false);

	// Create a reactive variable to track authentication state
	let isAuthenticated = $state(false);

	// Update the reactive variable when the store changes
	$effect(() => {
		const unsubscribe = app.subscribe((state) => {
			isAuthenticated = state.authenticated;
			// If we're authenticated, stop showing the authenticating state
			if (state.authenticated) {
				authenticating = false;
			}
		});
		
		// Clean up subscription
		return () => unsubscribe();
	});

	onMount(async () => {
		if (!browser) return;

		console.log('Sign-in page mounted, current URL:', window.location.href);
		
		checkingStatus = true;

		// Check for authentication state
		const appState = get(app);
		if (appState.authenticated) {
			console.log('Already authenticated, redirecting to dashboard...');
			setTimeout(() => goto('/dashboard', { replaceState: true }), 0);
		}
		
		checkingStatus = false;
	});

	// React to changes in authentication state
	$effect(() => {
		if (isAuthenticated) {
			console.log('App state authenticated, redirecting to dashboard...');
			authenticating = true; // Show loading during redirect
			setTimeout(() => goto('/dashboard', { replaceState: true }), 0);
		}
	});
</script>

{#if checkingStatus || authenticating || formSubmitting}
  <div class="flex h-full w-full items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-muted-foreground">
        {checkingStatus 
          ? 'Checking authentication status...' 
          : authenticating
            ? 'Redirecting to dashboard...'
            : 'Signing in...'}
      </p>
    </div>
  </div>
{:else}
  <Card.Root class="sm:w-[448px] relative">
    <Card.Header>
      <Card.Title class="text-center text-2xl">Sign in</Card.Title>
      <Card.Description class="text-center">
        Don't have an account yet?
        <Button variant="link" href="/sign-up" class="p-0">Sign up here</Button>
      </Card.Description>
    </Card.Header>
    <Card.Content class="space-y-5">
      <SignInWithGoogle label="Sign in with" />

      <div
        class="before:muted-foreground after:muted-foreground flex items-center text-xs uppercase text-muted-foreground before:me-6 before:flex-1 before:border-t after:ms-6 after:flex-1 after:border-t dark:before:border-muted-foreground dark:after:border-muted-foreground"
      >
        Or
      </div>

      <SignInForm onIsSubmittingChange={(isSubmitting: boolean) => formSubmitting = isSubmitting} />
    </Card.Content>
  </Card.Root>
{/if}
