<script lang="ts">
	import { contactSchema } from '$lib/schemas/contact';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import { toast } from 'svelte-sonner';
	import * as v from 'valibot';
	import Button from '$lib/components/ui/button/button.svelte';

	let formData = $state({
		name: '',
		email: '',
		message: ''
	});

	let errors = $state({
		name: '',
		email: '',
		message: ''
	});

	let isSubmitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;

		// Clear previous errors
		errors = { name: '', email: '', message: '' };

		try {
			// Validate form data
			const result = v.safeParse(contactSchema, formData);
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

			// Handle form submission
			toast.success('Message sent successfully!');
			// Reset form
			formData = { name: '', email: '', message: '' };
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

<Card.Root class="w-full max-w-xl">
	<Card.Content class="p-8">
		<h3 class="mb-6 text-2xl font-semibold">Send Us Message</h3>

		<form onsubmit={handleSubmit} class="space-y-6">
			<div class="space-y-2">
				<label for="name" class="text-sm font-medium">Name</label>
				<Input
					id="name"
					bind:value={formData.name}
					placeholder="Your name"
					disabled={isSubmitting}
				/>
				{#if errors.name}
					<p class="text-sm text-destructive">{errors.name}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<label for="email" class="text-sm font-medium">Email</label>
				<Input
					id="email"
					bind:value={formData.email}
					placeholder="you@example.com"
					disabled={isSubmitting}
				/>
				{#if errors.email}
					<p class="text-sm text-destructive">{errors.email}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<label for="message" class="text-sm font-medium">Message</label>
				<Textarea
					id="message"
					bind:value={formData.message}
					placeholder="Your message"
					class="min-h-[150px] resize-none"
					disabled={isSubmitting}
				/>
				{#if errors.message}
					<p class="text-sm text-destructive">{errors.message}</p>
				{/if}
			</div>

			<Button type="submit" class="w-full" disabled={isSubmitting}>
				{isSubmitting ? 'Sending...' : 'Submit'}
			</Button>
		</form>
	</Card.Content>
</Card.Root>
