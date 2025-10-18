<script lang="ts">
	import { signInSchema } from '../../schemas/sign-in.js';
	import { Input } from '../ui/input/index.js';
	import Button from '../ui/button/button.svelte';
	import * as v from 'valibot';
	import { toast } from 'svelte-sonner';
	import { signIn } from '$lib/services/authService';
	import { goto, invalidateAll } from '$app/navigation';

	let formData = $state({
		email: '',
		password: ''
	});

	let errors = $state({
		email: '',
		password: ''
	});

	let isSubmitting = $state(false);
	let isRedirecting = $state(false);

	// Define callback prop to notify parent of state changes
	let { onIsSubmittingChange } = $props();

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;
		
		// Notify parent of state change
		if (onIsSubmittingChange) {
			onIsSubmittingChange(isSubmitting);
		}

		// Clear previous errors
		errors = { email: '', password: '' };

		try {
			// Validate form data
			const result = v.safeParse(signInSchema, formData);
			if (!result.success) {
				// Set validation errors
				for (const issue of result.issues) {
					if (issue.path?.[0]?.key === 'email') {
						errors.email = issue.message;
					} else if (issue.path?.[0]?.key === 'password') {
						errors.password = issue.message;
					}
				}
				return;
			}

			// Check if this is an invited client who hasn't activated yet
			// In real implementation, check user status from database
			const isInvitedNotActivated = formData.email === 'jane.smith@client.com';

			if (isInvitedNotActivated) {
				toast.error('Please complete your account setup first. Check your email for the invitation link.');
				return;
			}

			// Sign in using unified auth service
			await signIn(formData.email, formData.password);
			
			// Show redirecting state
			isRedirecting = true;
			if (onIsSubmittingChange) {
				onIsSubmittingChange(isRedirecting);
			}
			
			// Wait for auth state to be fully updated
			await new Promise(resolve => setTimeout(resolve, 300));
			
			// Invalidate all server data to refresh session validation
			await invalidateAll();
			
			// Show success toast before navigation
			toast.success('Signed in successfully');
			
			// Navigate to dashboard (don't await as it will trigger page unload)
			goto('/dashboard', { replaceState: true });
			
			// Don't reset loading states here since page will navigate away
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('An error occurred');
			}
			
			isSubmitting = false;
			isRedirecting = false;
			// Notify parent of state change
			if (onIsSubmittingChange) {
				onIsSubmittingChange(isSubmitting || isRedirecting);
			}
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-2">
	<div class="space-y-2">
		<label for="email" class="text-sm font-medium">Email</label>
		<Input
			id="email"
			bind:value={formData.email}
			placeholder="you@email.com"
			disabled={isSubmitting || isRedirecting}
			autocomplete="email"
		/>
		{#if errors.email}
			<p class="text-sm text-destructive">{errors.email}</p>
		{/if}
	</div>
	<div class="space-y-2">
		<div class="flex w-full items-center justify-between">
			<label for="password" class="text-sm font-medium">Password</label>
			<Button variant="link" class="text-sm" href="/forgot-password" disabled={isSubmitting || isRedirecting}>
				I forgot my password
			</Button>
		</div>
		<Input
			id="password"
			bind:value={formData.password}
			placeholder="*********"
			type="password"
			disabled={isSubmitting || isRedirecting}
			autocomplete="current-password"
		/>
		{#if errors.password}
			<p class="text-sm text-destructive">{errors.password}</p>
		{/if}
	</div>
	<Button type="submit" class="w-full" disabled={isSubmitting || isRedirecting}>
		{isSubmitting ? 'Signing in...' : isRedirecting ? 'Redirecting...' : 'Sign in'}
	</Button>
</form>