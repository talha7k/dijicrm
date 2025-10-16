<script lang="ts">
	import { onMount } from 'svelte';
	import { getRedirectResult } from 'firebase/auth';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { handlePostAuthentication } from '$lib/services/authService';

	import SignInWithGoogle from '$lib/components/auth/google-sign-in.svelte';
	import SignInForm from '$lib/components/auth/sign-in-form.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { app } from '$lib/stores/app';

	let checkingRedirect = $state(true);

	onMount(async () => {
		if (!browser) return;

		console.log('Sign-in page mounted, current URL:', window.location.href);
		console.log('Checking for redirect result...');

		try {
			const { auth } = await import('$lib/firebase');

			// Check for redirect result first
			const result = await getRedirectResult(auth);

			if (result) {
				console.log('Redirect result found:', result.user);
				// Handle the authentication result directly
				await handlePostAuthentication(result.user);
				toast.success('Successfully signed in with Google!');
			} else {
				console.log('No redirect result found');
			}
		} catch (error) {
			console.error('Error checking redirect:', error);
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('An error occurred during sign-in');
			}
		} finally {
			checkingRedirect = false;
		}
	});
</script>

{#if checkingRedirect}
  <div class="flex h-full w-full items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-muted-foreground">Completing sign-in...</p>
    </div>
  </div>
{:else}
  <Card.Root class="sm:w-[448px]">
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

      <SignInForm />
    </Card.Content>
  </Card.Root>
{/if}
