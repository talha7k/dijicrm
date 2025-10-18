<script lang="ts">
	import SignInWithGoogle from '$lib/components/auth/google-sign-in.svelte';
	import SignInForm from '$lib/components/auth/sign-in-form.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';

	let formSubmitting = $state(false);
	let googleSigningIn = $state(false);
</script>

{#if formSubmitting || googleSigningIn}
  <div class="flex h-full w-full items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p class="text-muted-foreground">
        {googleSigningIn
          ? 'Signing in with Google...'
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
      <SignInWithGoogle label="Sign in with" onIsLoadingChange={(isLoading: boolean) => googleSigningIn = isLoading} />

      <div
        class="before:muted-foreground after:muted-foreground flex items-center text-xs uppercase text-muted-foreground before:me-6 before:flex-1 before:border-t after:ms-6 after:flex-1 after:border-t dark:before:border-muted-foreground dark:after:border-muted-foreground"
      >
        Or
      </div>

      <SignInForm onIsSubmittingChange={(isSubmitting: boolean) => formSubmitting = isSubmitting} />
    </Card.Content>
  </Card.Root>
{/if}