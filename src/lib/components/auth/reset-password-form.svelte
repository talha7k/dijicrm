<script lang="ts">
	import { goto } from '$app/navigation';
	import { firekitAuth } from 'svelte-firekit';
	import { Input } from '../ui/input/index.js';
	import { resetPasswordSchema } from '../../schemas/reset-password.js';
	import { toast } from 'svelte-sonner';
	import * as v from 'valibot';
	import Button from '../ui/button/button.svelte';

	let formData = $state({
		email: ''
	});

	let error = $state('');
	let isSubmitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;
		error = '';

		try {
			// Validate form data
			const result = v.safeParse(resetPasswordSchema, formData);
			if (!result.success) {
				error = result.issues[0]?.message || 'Invalid email';
				return;
			}

			// Send password reset
			await firekitAuth.sendPasswordReset(formData.email);
			toast.success('Password reset email sent');
			goto('/sign-in');
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'An error occurred';
			}
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div class="space-y-2">
		<label for="email" class="text-sm font-medium">Email address</label>
		<Input
			id="email"
			bind:value={formData.email}
			placeholder="you@email.com"
			disabled={isSubmitting}
		/>
		{#if error}
			<p class="text-sm text-destructive">{error}</p>
		{/if}
	</div>

	<Button type="submit" class="w-full" disabled={isSubmitting}>
		{isSubmitting ? 'Sending...' : 'Send Email'}
	</Button>
</form>
