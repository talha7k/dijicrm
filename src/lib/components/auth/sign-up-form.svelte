<script lang="ts">
	import { firekitAuth } from 'svelte-firekit';
	import { Input } from '../ui/input/index.js';
	import { signUpSchema } from '../../schemas/sign-up.js';
	import { toast } from 'svelte-sonner';
	import * as v from 'valibot';
	import Button from '../ui/button/button.svelte';
	import Checkbox from '../ui/checkbox/checkbox.svelte';
	import { goto } from '$app/navigation';
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

	interface Props {
		invitationToken?: string | null;
	}

	let { invitationToken }: Props = $props();

	let formData = $state({
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		agreeToTerms: false
	});

	let errors = $state({
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		agreeToTerms: ''
	});

	let isSubmitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;

		// Clear previous errors
		errors = { firstName: '', lastName: '', email: '', password: '', agreeToTerms: '' };

		try {
			// Validate form data
			const result = v.safeParse(signUpSchema, formData);
			if (!result.success) {
				// Set validation errors
				for (const issue of result.issues) {
					const field = issue.path?.[0]?.key as keyof typeof errors;
					if (field && field in errors) {
						errors[field] = issue.message;
					}
				}
				return;
			}

			// TODO: Check if this is an invited client by querying database for invitation
			// For now, skip this check

			// Sign up
			const displayName = `${formData.firstName} ${formData.lastName}`;
			const userCredential = await firekitAuth.registerWithEmail(formData.email, formData.password, displayName);
			
			// Create basic profile immediately after successful registration
			if (userCredential?.user) {
				const { createBasicUserProfile } = await import('$lib/services/authService');
				const firebaseUser = userCredential.user as any; // Type assertion for Firebase User
				await createBasicUserProfile(firebaseUser);
				console.log("Basic profile created during sign-up for:", firebaseUser.uid);
				
				// Get the ID token to create session cookie
				const idToken = await auth.currentUser!.getIdToken();
				await createSessionCookie(idToken);
			}
			
			toast.success('Account created successfully');
			goto('/onboarding');
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
	<div class="grid grid-cols-2 gap-4">
		<div class="space-y-2">
			<label for="firstName" class="text-sm font-medium">First Name</label>
			<Input
				id="firstName"
				bind:value={formData.firstName}
				placeholder="John"
				disabled={isSubmitting}
			/>
			{#if errors.firstName}
				<p class="text-sm text-destructive">{errors.firstName}</p>
			{/if}
		</div>
		<div class="space-y-2">
			<label for="lastName" class="text-sm font-medium">Last Name</label>
			<Input
				id="lastName"
				bind:value={formData.lastName}
				placeholder="Smith"
				disabled={isSubmitting}
			/>
			{#if errors.lastName}
				<p class="text-sm text-destructive">{errors.lastName}</p>
			{/if}
		</div>
	</div>
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
		<label for="password" class="text-sm font-medium">Password</label>
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
	<div class="space-y-2">
		<div class="flex items-center gap-2">
			<Checkbox
				id="agreeToTerms"
				bind:checked={formData.agreeToTerms}
				disabled={isSubmitting}
			/>
			<label for="agreeToTerms" class="text-sm font-medium">
				By signing up, you agree to our
				<Button variant="link" href="/terms-and-condition" class="p-0 h-auto">
					Terms and Conditions
				</Button>
			</label>
		</div>
		{#if errors.agreeToTerms}
			<p class="text-sm text-destructive">{errors.agreeToTerms}</p>
		{/if}
	</div>
	<Button type="submit" class="w-full" disabled={isSubmitting}>
		{isSubmitting ? 'Signing up...' : 'Sign Up'}
	</Button>
</form>
