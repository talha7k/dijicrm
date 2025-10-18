<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { getInitials } from '$lib/utils';
	import Button from '$lib/components/ui/button/button.svelte';
	import { firekitAuth, firekitUploadTask, firekitUser } from 'svelte-firekit';
	import { toast } from 'svelte-sonner';
	import { userProfile, refreshUserData } from '$lib/services/authService';
	import { compressImage, COMPRESSION_PRESETS } from '$lib/utils/imageCompression';

	// State management
	let user = $derived($userProfile);
	let uploadState = $state({
		imageUrl: '',
		selectedImage: null as File | null,
		compressedImage: null as File | null,
		uploadTask: null as any,
		progress: 0,
		isUploading: false,
		isCompressing: false,
		isDeleting: false,
		error: ''
	});

	// Computed progress
	let progress = $derived(uploadState.uploadTask?.progress || 0);

	// File input reference
	let fileInput: HTMLInputElement | undefined = $state();

	// Upload effect
	$effect(() => {
		if (progress === 100 && uploadState.uploadTask?.downloadURL) {
			handleUploadComplete(uploadState.uploadTask.downloadURL);
		}
	});

	// Handle upload completion
	async function handleUploadComplete(downloadURL: string) {
		try {
			// Update the user's profile in Firebase Auth
			await firekitAuth.updateUserProfile({
				photoURL: downloadURL
			});

			// Also update the user's profile in Firestore
			const { updateDoc, doc } = await import('firebase/firestore');
			const { db } = await import('$lib/firebase');
			
			if (user?.uid) {
				await updateDoc(doc(db, 'users', user.uid), {
					photoURL: downloadURL,
					updatedAt: new Date()
				});
			}

			// Refresh the user profile store to get the updated photoURL
			await refreshUserData();

			// Clear the upload state
			uploadState.isUploading = false;
			uploadState.error = '';
			uploadState.selectedImage = null;
			uploadState.compressedImage = null;
			if (fileInput) fileInput.value = '';

			toast.success('Profile photo updated successfully');
		} catch (error) {
			handleError('Failed to update profile photo');
		}
	}

	// Validate file
	async function validateFile(file: File): Promise<boolean> {
		try {
			// Only validate file type, not size (compression will handle size)
			const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
			if (!allowedTypes.includes(file.type)) {
				throw new Error('Please upload a valid image file (JPEG, PNG, or WebP)');
			}
			return true;
		} catch (error) {
			handleError(error instanceof Error ? error.message : 'Validation failed');
			return false;
		}
	}

	// Handle file selection
	async function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		if (!(await validateFile(file))) {
			target.value = '';
			return;
		}

		try {
			uploadState.isCompressing = true;
			uploadState.isUploading = true;
			uploadState.selectedImage = file;
			uploadState.imageUrl = URL.createObjectURL(file);

			// Compress the image
			const compressedFile = await compressImage(file, COMPRESSION_PRESETS.AVATAR);
			uploadState.compressedImage = compressedFile;
			uploadState.isCompressing = false;

			// Start upload with compressed file
			uploadState.uploadTask = firekitUploadTask(`users-profile/${firekitUser.uid}/profile`, compressedFile);
		} catch (error) {
			uploadState.isCompressing = false;
			handleError(error instanceof Error ? error.message : 'Failed to process image');
		}
	}

	// Handle delete
	async function handleDelete() {
		try {
			uploadState.isDeleting = true;
			
			await firekitAuth.updateUserProfile({
				photoURL: ''
			});
			
			// Also update the user's profile in Firestore
			const { updateDoc, doc } = await import('firebase/firestore');
			const { db } = await import('$lib/firebase');
			
			if (user?.uid) {
				await updateDoc(doc(db, 'users', user.uid), {
					photoURL: '',
					updatedAt: new Date()
				});
			}
			
			// Refresh the user profile store to get the updated photoURL
			await refreshUserData();
			
			uploadState.imageUrl = '';
			uploadState.selectedImage = null;
			if (fileInput) fileInput.value = '';
			toast('Profile photo deleted successfully');
		} catch (error) {
			handleError('Failed to delete profile photo');
		} finally {
			uploadState.isDeleting = false;
		}
	}

	// Error handler
	function handleError(message: string) {
		console.error(message);
		uploadState.error = message;
		uploadState.isUploading = false;
		uploadState.isDeleting = false;
		toast.error(message);
		throw new Error(message);
	}
</script>

{#if user}
 	<div class="flex flex-col gap-4">
 		<Label class="font-normal text-muted-foreground">Avatar</Label>
 		<div class="flex gap-4">
			<Avatar.Root class="size-16">
				<Avatar.Image src={uploadState.imageUrl || user.photoURL} alt={user.displayName} />
				<Avatar.Fallback>{getInitials(user.displayName)}</Avatar.Fallback>
			</Avatar.Root>
			<div class="flex flex-col gap-2">
				<div class="flex gap-2">
					<Button size="sm" disabled={uploadState.isUploading} onclick={() => fileInput?.click()}>
						{#if uploadState.isCompressing}
							Compressing...
						{:else if uploadState.isUploading}
							Uploading {progress}%
						{:else}
							Upload photo
						{/if}
					</Button>
					<Button
						variant="outline"
						class="text-destructive"
						size="sm"
						disabled={uploadState.isUploading || uploadState.isDeleting || !user.photoURL}
						onclick={handleDelete}
					>
						{#if uploadState.isDeleting}
							Deleting...
						{:else}
							Delete
						{/if}
					</Button>
				</div>
				<p class="text-xs text-muted-foreground">Pick a photo (JPEG, PNG, or WebP). Images will be compressed to 20KB max.</p>
				{#if uploadState.error}
					<p class="text-xs text-destructive">{uploadState.error}</p>
				{/if}
				<input
					bind:this={fileInput}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					class="hidden"
					onchange={handleImageUpload}
				/>
			</div>
		</div>
	</div>
{/if}
