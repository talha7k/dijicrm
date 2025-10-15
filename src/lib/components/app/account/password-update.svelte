<script lang="ts">
	import { firekitUser } from 'svelte-firekit';
	import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { toast } from 'svelte-sonner';

	// Check if user signed in with password (not OAuth)
	const isPasswordUser = $derived(
		firekitUser.isAuthenticated &&
		firekitUser.user?.providerData.some(provider => provider.providerId === 'password')
	);

	let formData = $state({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});

	let errors = $state({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});

	let isUpdating = $state(false);
	let showForm = $state(false);

	function validateForm(): boolean {
		errors = {
			currentPassword: '',
			newPassword: '',
			confirmPassword: ''
		};

		if (!formData.currentPassword.trim()) {
			errors.currentPassword = 'Current password is required';
		}

		if (!formData.newPassword.trim()) {
			errors.newPassword = 'New password is required';
		} else if (formData.newPassword.length < 8) {
			errors.newPassword = 'Password must be at least 8 characters long';
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
			errors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
		}

		if (!formData.confirmPassword.trim()) {
			errors.confirmPassword = 'Please confirm your new password';
		} else if (formData.newPassword !== formData.confirmPassword) {
			errors.confirmPassword = 'Passwords do not match';
		}

		return !errors.currentPassword && !errors.newPassword && !errors.confirmPassword;
	}

	async function handleUpdatePassword() {
		if (!validateForm()) return;

		isUpdating = true;

		try {
			// Get Firebase Auth user
			const { auth } = await import('$lib/firebase');
			const firebaseUser = auth.currentUser;

			if (!firebaseUser || !firebaseUser.email) {
				toast.error('Unable to update password. Please sign in again.');
				return;
			}

			// Re-authenticate user with current password
			const credential = EmailAuthProvider.credential(
				firebaseUser.email,
				formData.currentPassword
			);

			await reauthenticateWithCredential(firebaseUser, credential);

			// Update password
			await updatePassword(firebaseUser, formData.newPassword);

			// Reset form
			formData = {
				currentPassword: '',
				newPassword: '',
				confirmPassword: ''
			};
			showForm = false;

			toast.success('Password updated successfully');
		} catch (error: any) {
			console.error('Password update error:', error);

			if (error.code === 'auth/wrong-password') {
				errors.currentPassword = 'Current password is incorrect';
			} else if (error.code === 'auth/weak-password') {
				errors.newPassword = 'Password is too weak';
			} else if (error.code === 'auth/requires-recent-login') {
				toast.error('Please sign in again to update your password');
			} else {
				toast.error('Failed to update password. Please try again.');
			}
		} finally {
			isUpdating = false;
		}
	}

	function toggleForm() {
		showForm = !showForm;
		if (!showForm) {
			// Reset form when closing
			formData = {
				currentPassword: '',
				newPassword: '',
				confirmPassword: ''
			};
			errors = {
				currentPassword: '',
				newPassword: '',
				confirmPassword: ''
			};
		}
	}
</script>

{#if isPasswordUser}
	<Card.Root>
		<Card.Header>
			<Card.Title>Password</Card.Title>
			<Card.Description>
				Update your account password
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				{#if !showForm}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3">
							<Icon icon="lucide:lock" class="h-5 w-5 text-muted-foreground" />
							<div>
								<p class="font-medium">Password</p>
								<p class="text-sm text-muted-foreground">Last updated recently</p>
							</div>
						</div>
						<Button variant="outline" onclick={toggleForm}>
							<Icon icon="lucide:edit" class="h-4 w-4 mr-2" />
							Update Password
						</Button>
					</div>
				{:else}
					<div class="space-y-4">
						<div class="grid grid-cols-4">
							<Label class="font-normal text-muted-foreground">Current Password</Label>
							<div class="col-span-3 space-y-2">
								<Input
									type="password"
									placeholder="Enter current password"
									bind:value={formData.currentPassword}
									class={errors.currentPassword ? 'border-red-500' : ''}
									disabled={isUpdating}
								/>
								{#if errors.currentPassword}
									<p class="text-xs text-red-500">{errors.currentPassword}</p>
								{:else}
									<p class="text-xs text-muted-foreground">Enter your current password to verify</p>
								{/if}
							</div>
						</div>

						<div class="grid grid-cols-4">
							<Label class="font-normal text-muted-foreground">New Password</Label>
							<div class="col-span-3 space-y-2">
								<Input
									type="password"
									placeholder="Enter new password"
									bind:value={formData.newPassword}
									class={errors.newPassword ? 'border-red-500' : ''}
									disabled={isUpdating}
								/>
								{#if errors.newPassword}
									<p class="text-xs text-red-500">{errors.newPassword}</p>
								{:else}
									<p class="text-xs text-muted-foreground">
										Password must be at least 8 characters with uppercase, lowercase, and numbers
									</p>
								{/if}
							</div>
						</div>

						<div class="grid grid-cols-4">
							<Label class="font-normal text-muted-foreground">Confirm Password</Label>
							<div class="col-span-3 space-y-2">
								<Input
									type="password"
									placeholder="Confirm new password"
									bind:value={formData.confirmPassword}
									class={errors.confirmPassword ? 'border-red-500' : ''}
									disabled={isUpdating}
								/>
								{#if errors.confirmPassword}
									<p class="text-xs text-red-500">{errors.confirmPassword}</p>
								{:else}
									<p class="text-xs text-muted-foreground">Re-enter your new password</p>
								{/if}
							</div>
						</div>

						<div class="flex justify-end gap-2 pt-4 border-t">
							<Button variant="outline" onclick={toggleForm} disabled={isUpdating}>
								Cancel
							</Button>
							<Button onclick={handleUpdatePassword} disabled={isUpdating}>
								{#if isUpdating}
									<Icon icon="lucide:loader" class="h-4 w-4 mr-2 animate-spin" />
									Updating...
								{:else}
									Update Password
								{/if}
							</Button>
						</div>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
{:else if firekitUser.isAuthenticated}
	<Card.Root>
		<Card.Header>
			<Card.Title>Password</Card.Title>
			<Card.Description>
				Password management
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
				<Icon icon="lucide:shield-check" class="h-5 w-5 text-green-600" />
				<div>
					<p class="font-medium">Secure sign-in</p>
					<p class="text-sm text-muted-foreground">
						You're signed in with Google. Your account is secure and password-protected.
					</p>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
{/if}