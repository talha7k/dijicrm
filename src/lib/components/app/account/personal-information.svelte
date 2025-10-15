<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import { userProfile } from '$lib/stores/user';
	import { toast } from 'svelte-sonner';

	const userData = $derived($userProfile.data);

	// Create form state with initial values from userData
	let formData = $state({
		displayName: '',
		email: '',
		firstName: '',
		lastName: '',
		username: '',
		bio: '',
		phoneNumber: '',
		emailNotifications: true,
		pushNotifications: true,
		theme: 'system' as 'light' | 'dark' | 'system',
		language: 'en'
	});

	$effect(() => {
		if (userData) {
			// Only update if we haven't initialized yet or if values are empty
			if (!formData.displayName || formData.displayName === '') {
				formData.displayName = userData.displayName || '';
			}
			if (!formData.email || formData.email === '') {
				formData.email = userData.email || '';
			}
			if (!formData.firstName || formData.firstName === '') {
				formData.firstName = userData.firstName || '';
			}
			if (!formData.lastName || formData.lastName === '') {
				formData.lastName = userData.lastName || '';
			}
			if (!formData.username || formData.username === '') {
				formData.username = userData.username || '';
			}
			if (!formData.bio || formData.bio === '') {
				formData.bio = userData.bio || '';
			}
			if (!formData.phoneNumber || formData.phoneNumber === '') {
				formData.phoneNumber = userData.phoneNumber || '';
			}
			formData.emailNotifications = userData.emailNotifications ?? true;
			formData.pushNotifications = userData.pushNotifications ?? true;
			formData.theme = userData.theme ?? 'system';
			formData.language = userData.language ?? 'en';
		}
	});

	// Keep track of original values for comparison
	let originalData = $derived({
		displayName: userData?.displayName ?? '',
		email: userData?.email ?? '',
		firstName: userData?.firstName ?? '',
		lastName: userData?.lastName ?? '',
		username: userData?.username ?? '',
		bio: userData?.bio ?? '',
		phoneNumber: userData?.phoneNumber ?? '',
		emailNotifications: userData?.emailNotifications ?? true,
		pushNotifications: userData?.pushNotifications ?? true,
		theme: userData?.theme ?? 'system',
		language: userData?.language ?? 'en'
	});

	let errors = $state({
		displayName: '',
		email: '',
		firstName: '',
		lastName: '',
		username: '',
		bio: '',
		phoneNumber: ''
	});

	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	let hasChanges = $derived(
		formData.displayName !== originalData.displayName ||
		formData.email !== originalData.email ||
		formData.firstName !== originalData.firstName ||
		formData.lastName !== originalData.lastName ||
		formData.username !== originalData.username ||
		formData.bio !== originalData.bio ||
		formData.phoneNumber !== originalData.phoneNumber ||
		formData.emailNotifications !== originalData.emailNotifications ||
		formData.pushNotifications !== originalData.pushNotifications ||
		formData.theme !== originalData.theme ||
		formData.language !== originalData.language
	);

	function validateForm(): boolean {
		errors = {
			displayName: '',
			email: '',
			firstName: '',
			lastName: '',
			username: '',
			bio: '',
			phoneNumber: ''
		};

		if (!formData.displayName.trim()) {
			errors.displayName = 'Display name is required';
		} else if (formData.displayName.length < 2) {
			errors.displayName = 'Display name must be at least 2 characters';
		}

		if (!formData.email.trim()) {
			errors.email = 'Email is required';
		} else if (!isValidEmail(formData.email)) {
			errors.email = 'Please enter a valid email address';
		}

		if (formData.firstName && formData.firstName.length < 2) {
			errors.firstName = 'First name must be at least 2 characters if provided';
		}

		if (formData.lastName && formData.lastName.length < 2) {
			errors.lastName = 'Last name must be at least 2 characters if provided';
		}

		if (formData.username && formData.username.length < 3) {
			errors.username = 'Username must be at least 3 characters if provided';
		}

		if (formData.bio && formData.bio.length > 500) {
			errors.bio = 'Bio must be less than 500 characters';
		}

		if (formData.phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
			errors.phoneNumber = 'Please enter a valid phone number';
		}

		return !errors.displayName && !errors.email && !errors.firstName && !errors.lastName &&
			   !errors.username && !errors.bio && !errors.phoneNumber;
	}

	async function saveChanges() {
		if (!validateForm()) return;

		try {
			await $userProfile.update({
				displayName: formData.displayName.trim(),
				email: formData.email.trim(),
				firstName: formData.firstName.trim() || undefined,
				lastName: formData.lastName.trim() || undefined,
				username: formData.username.trim() || undefined,
				bio: formData.bio.trim() || undefined,
				phoneNumber: formData.phoneNumber.trim() || undefined,
				emailNotifications: formData.emailNotifications,
				pushNotifications: formData.pushNotifications,
				theme: formData.theme,
				language: formData.language
			});
			toast.success('Profile updated successfully');
		} catch (error) {
			console.error('Failed to update profile:', error);
			toast.error('Failed to update profile');
		}
	}
</script>

{#if userData}
	<div class="flex flex-col gap-6">
		<!-- Basic Information -->
		<div class="space-y-4">
			<h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basic Information</h3>

			<div class="grid grid-cols-4">
				<Label class="font-normal text-muted-foreground">Display Name</Label>
				<div class="col-span-3 space-y-2">
					<Input
						placeholder="Enter full name"
						bind:value={formData.displayName}
						class={errors.displayName ? 'border-red-500' : ''}
					/>
					{#if errors.displayName}
						<p class="text-xs text-red-500">{errors.displayName}</p>
					{:else}
						<p class="text-xs text-muted-foreground">Enter your full name, or a display name</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-4">
				<Label class="font-normal text-muted-foreground">Email</Label>
				<div class="col-span-3 space-y-2">
					<Input
						placeholder="Enter email address"
						bind:value={formData.email}
						type="email"
						class={errors.email ? 'border-red-500' : ''}
					/>
					{#if errors.email}
						<p class="text-xs text-red-500">{errors.email}</p>
					{:else}
						<p class="text-xs text-muted-foreground">
							Enter the email address you want to use to log in with.
						</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-4">
				<Label class="font-normal text-muted-foreground">First Name</Label>
				<div class="col-span-3 space-y-2">
					<Input
						placeholder="Enter first name"
						bind:value={formData.firstName}
						class={errors.firstName ? 'border-red-500' : ''}
					/>
					{#if errors.firstName}
						<p class="text-xs text-red-500">{errors.firstName}</p>
					{:else}
						<p class="text-xs text-muted-foreground">Optional: Your first name</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-4">
				<Label class="font-normal text-muted-foreground">Last Name</Label>
				<div class="col-span-3 space-y-2">
					<Input
						placeholder="Enter last name"
						bind:value={formData.lastName}
						class={errors.lastName ? 'border-red-500' : ''}
					/>
					{#if errors.lastName}
						<p class="text-xs text-red-500">{errors.lastName}</p>
					{:else}
						<p class="text-xs text-muted-foreground">Optional: Your last name</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-4">
				<Label class="font-normal text-muted-foreground">Username</Label>
				<div class="col-span-3 space-y-2">
					<Input
						placeholder="Enter username"
						bind:value={formData.username}
						class={errors.username ? 'border-red-500' : ''}
					/>
					{#if errors.username}
						<p class="text-xs text-red-500">{errors.username}</p>
					{:else}
						<p class="text-xs text-muted-foreground">Optional: A unique username</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-4">
				<Label class="font-normal text-muted-foreground">Phone Number</Label>
				<div class="col-span-3 space-y-2">
					<Input
						placeholder="Enter phone number"
						bind:value={formData.phoneNumber}
						type="tel"
						class={errors.phoneNumber ? 'border-red-500' : ''}
					/>
					{#if errors.phoneNumber}
						<p class="text-xs text-red-500">{errors.phoneNumber}</p>
					{:else}
						<p class="text-xs text-muted-foreground">Optional: Your phone number</p>
					{/if}
				</div>
			</div>

			<div class="grid grid-cols-4">
				<Label class="font-normal text-muted-foreground">Bio</Label>
				<div class="col-span-3 space-y-2">
					<Textarea
						placeholder="Tell us about yourself..."
						bind:value={formData.bio}
						class={errors.bio ? 'border-red-500' : ''}
						rows={3}
					/>
					{#if errors.bio}
						<p class="text-xs text-red-500">{errors.bio}</p>
					{:else}
						<p class="text-xs text-muted-foreground">Optional: A short bio about yourself ({formData.bio.length}/500)</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Preferences -->
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
		</div>

		<div class="flex justify-end pt-4 border-t">
			<Button onclick={saveChanges} disabled={!hasChanges || $userProfile.loading}>
				{#if $userProfile.loading}
					Saving...
				{:else}
					Save changes
				{/if}
			</Button>
		</div>
	</div>
{/if}
