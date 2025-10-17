<script lang="ts">
	import { firekitAuth } from 'svelte-firekit';
	import { signInSchema } from '../../schemas/sign-in.js';
	import { Input } from '../ui/input/index.js';
	import Button from '../ui/button/button.svelte';
	import * as v from 'valibot';

	import * as Form from '../ui/form/index.js';
	import { toast } from 'svelte-sonner';
	import { initializeApp, resetInitialization } from '$lib/services/initService';
	import { auth } from '$lib/firebase';

	// Function to create session cookie
	async function createSessionCookie(idToken: string) {
		const response = await fetch('/api/session', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ idToken }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to create session');
		}

		return response.json();
	}

	let formData = $state({
		email: '',
		password: ''
	});

	let errors = $state({
		email: '',
		password: ''
	});

	let isSubmitting = $state(false);

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

			// Sign in
			const userCredential = await firekitAuth.signInWithEmail(formData.email, formData.password);
			
			// Create session cookie after successful sign-in
			if (userCredential?.user) {
				// Get the ID token from the authenticated user
				const idToken = await auth.currentUser!.getIdToken();
				await createSessionCookie(idToken);
			}
			
			toast.success('Signed in successfully');
			resetInitialization();
			await initializeApp();
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('An error occurred');
			}
		} finally {
			isSubmitting = false;
			// Notify parent of state change
			if (onIsSubmittingChange) {
				onIsSubmittingChange(isSubmitting);
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
			disabled={isSubmitting}
		/>
		{#if errors.email}
			<p class="text-sm text-destructive">{errors.email}</p>
		{/if}
	</div>
	<div class="space-y-2">
		<div class="flex w-full items-center justify-between">
			<label for="password" class="text-sm font-medium">Password</label>
			<Button variant="link" class="text-sm" href="/forgot-password" disabled={isSubmitting}>
				I forgot my password
			</Button>
		</div>
		<Input
			id="password"
			bind:value={formData.password}
			placeholder="*********"
			type="password"
			disabled={isSubmitting}
		/>
		{#if errors.password}
			<p class="text-sm text-destructive">{errors.password}</p>
		{/if}
	</div>
	<Button type="submit" class="w-full" disabled={isSubmitting}>
		{isSubmitting ? 'Signing in...' : 'Sign in'}
	</Button>
</form>
