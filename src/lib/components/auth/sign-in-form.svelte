<script lang="ts">
	import { firekitAuth } from 'svelte-firekit';
	import { signInSchema } from '../../schemas/sign-in.js';
	import { Input } from '../ui/input/index.js';
	import Button from '../ui/button/button.svelte';
	import * as v from 'valibot';

	import * as Form from '../ui/form/index.js';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let formData = $state({
		email: '',
		password: ''
	});

	let errors = $state({
		email: '',
		password: ''
	});

	let isSubmitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;

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

			// Sign in
			await firekitAuth.signInWithEmail(formData.email, formData.password);
			toast.success('Signed in successfully');
			goto('/dashboard');
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('An error occurred');
			}
		} finally {
			isSubmitting = false;
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
