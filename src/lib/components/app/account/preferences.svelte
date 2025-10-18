<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { userProfile } from '$lib/services/authService';
	import { toast } from 'svelte-sonner';

	const userData = $derived($userProfile);

	// Create form state with initial values from userData
	let formData = $state({
		emailNotifications: true,
		pushNotifications: true,
		theme: 'system' as 'light' | 'dark' | 'system',
		language: 'en'
	});

	$effect(() => {
		if (userData) {
			formData.emailNotifications = userData.emailNotifications ?? true;
			formData.pushNotifications = userData.pushNotifications ?? true;
			formData.theme = userData.theme ?? 'system';
			formData.language = userData.language ?? 'en';
		}
	});

	let hasChanges = $derived(
		formData.emailNotifications !== (userData?.emailNotifications ?? true) ||
		formData.pushNotifications !== (userData?.pushNotifications ?? true) ||
		formData.theme !== (userData?.theme ?? 'system') ||
		formData.language !== (userData?.language ?? 'en')
	);

	async function saveChanges() {
		try {
			const { updateDoc, doc } = await import('firebase/firestore');
			const { db } = await import('$lib/firebase');

			if (userData?.uid) {
				await updateDoc(doc(db, 'users', userData.uid), {
					emailNotifications: formData.emailNotifications,
					pushNotifications: formData.pushNotifications,
					theme: formData.theme,
					language: formData.language,
					updatedAt: new Date()
				});
			}

			toast.success('Preferences updated successfully');
		} catch (error) {
			console.error('Failed to update preferences:', error);
			toast.error('Failed to update preferences');
		}
	}
</script>

{#if userData}
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">Preferences</h3>

		<div class="grid grid-cols-4">
			<Label class="font-normal text-muted-foreground">Theme</Label>
			<div class="col-span-3">
				<Select.Root type="single" bind:value={formData.theme}>
					<Select.Trigger class="w-full">
						{formData.theme === 'light' ? 'Light' : formData.theme === 'dark' ? 'Dark' : 'System'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="light">Light</Select.Item>
						<Select.Item value="dark">Dark</Select.Item>
						<Select.Item value="system">System</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<div class="grid grid-cols-4">
			<Label class="font-normal text-muted-foreground">Language</Label>
			<div class="col-span-3">
				<Select.Root type="single" bind:value={formData.language}>
					<Select.Trigger class="w-full">
						{formData.language === 'en' ? 'English' : formData.language === 'ar' ? 'العربية' : formData.language}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="en">English</Select.Item>
						<Select.Item value="ar">العربية</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<div class="grid grid-cols-4">
			<Label class="font-normal text-muted-foreground">Email Notifications</Label>
			<div class="col-span-3 flex items-center space-x-2">
				<Switch bind:checked={formData.emailNotifications} />
				<span class="text-sm text-muted-foreground">
					Receive email notifications about your account and activities
				</span>
			</div>
		</div>

		<div class="grid grid-cols-4">
			<Label class="font-normal text-muted-foreground">Push Notifications</Label>
			<div class="col-span-3 flex items-center space-x-2">
				<Switch bind:checked={formData.pushNotifications} />
				<span class="text-sm text-muted-foreground">
					Receive push notifications in your browser
				</span>
			</div>
		</div>

		<div class="flex justify-end pt-4 border-t">
			<Button onclick={saveChanges} disabled={!hasChanges}>
				Save preferences
			</Button>
		</div>
	</div>
{/if}