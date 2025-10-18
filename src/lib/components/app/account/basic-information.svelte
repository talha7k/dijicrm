<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { userProfile } from '$lib/services/authService';
	import { toast } from 'svelte-sonner';

	const userData = $derived($userProfile);

	// Create form state with initial values from userData
	let formData = $state({
		displayName: '',
		email: '',
		firstName: '',
		lastName: '',
		username: '',
		bio: '',
		phoneNumber: ''
	});

	$effect(() => {
		if (userData) {
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
		}
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
			const { updateDoc, doc } = await import('firebase/firestore');
			const { db } = await import('$lib/firebase');

			if (userData?.uid) {
				await updateDoc(doc(db, 'users', userData.uid), {
					displayName: formData.displayName.trim(),
					email: formData.email.trim(),
					firstName: formData.firstName.trim() || undefined,
					lastName: formData.lastName.trim() || undefined,
					username: formData.username.trim() || undefined,
					bio: formData.bio.trim() || undefined,
					phoneNumber: formData.phoneNumber.trim() || undefined,
					updatedAt: new Date()
				});
			}

			toast.success('Profile updated successfully');
		} catch (error) {
			console.error('Failed to update profile:', error);
			toast.error('Failed to update profile');
		}
	}
</script>

{#if userData}
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
{/if}