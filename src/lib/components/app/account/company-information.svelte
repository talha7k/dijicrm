<script lang="ts">
	import { get } from 'svelte/store';
	import { userProfile, profileCompleteness } from '$lib/stores/user';
	import { companyContext, activeCompanyId } from '$lib/stores/companyContext';
	import { getCompanyRole } from '$lib/utils/company-validation';
	import type { UserProfile } from '$lib/types/user';
	import Button from '$lib/components/ui/button/button.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Card from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';

	const userData = $derived($userProfile.data);
	const companyData = $derived($companyContext.data);
	const completeness = $derived($profileCompleteness);

	// Debug logging
	$effect(() => {
		console.log("CompanyInformation: userData:", userData);
		console.log("CompanyInformation: companyData:", companyData);
		console.log("CompanyInformation: completeness:", completeness);
		console.log("CompanyInformation: companyContext loading:", $companyContext.loading);
	});

	// Helper function to get company name from associations
	function getCompanyName(companyId: string): string {
		if (companyData?.companyId === companyId) {
			return companyData.company.name;
		}
		// If not the active company, we can't fetch the name without additional API calls
		// For now, just show the ID
		return `Company ${companyId}`;
	}

	// Helper function to format role
	function formatRole(role: string): string {
		return role.charAt(0).toUpperCase() + role.slice(1);
	}

	// Check if user can switch companies
	const canSwitchCompanies = $derived(
		userData?.companyAssociations && userData.companyAssociations.length > 1
	);

	async function switchCompany(companyId: string) {
		try {
			await get(companyContext).switchCompany(companyId);
		} catch (error) {
			console.error('Failed to switch company:', error);
		}
	}

	function goToOnboarding() {
		goto('/onboarding');
	}

	async function refreshProfile() {
		try {
			// Force a profile refresh by clearing the current store
			userProfile.update(store => ({
				...store,
				loading: true,
				error: null
			}));

			// Import and use the direct read function
			const { doc, getDoc } = await import('firebase/firestore');
			const { db } = await import('$lib/firebase');

			if (userData?.uid) {
				const profileRef = doc(db, "users", userData.uid);
				const profileDoc = await getDoc(profileRef);

				if (profileDoc.exists()) {
					const profileData = profileDoc.data() as UserProfile;
					userProfile.update(store => ({
						...store,
						data: profileData,
						loading: false,
						error: null
					}));
					console.log('Profile refreshed successfully');

					// After refreshing profile, try to initialize company context
					setTimeout(() => {
						console.log('CompanyInformation: Re-initializing company context after profile refresh');
						get(companyContext).initializeFromUser();
					}, 100);
				} else {
					userProfile.update(store => ({
						...store,
						loading: false,
						error: 'No profile found'
					}));
				}
			}
		} catch (error) {
			console.error('Error refreshing profile:', error);
			userProfile.update(store => ({
				...store,
				loading: false,
				error: 'Failed to refresh profile'
			}));
		}
	}

	async function forceCompanyInit() {
		try {
			console.log('CompanyInformation: Force initializing company context');
			await get(companyContext).initializeFromUser();
		} catch (error) {
			console.error('Error forcing company initialization:', error);
		}
	}
</script>

<!-- Loading State -->
{#if $userProfile.loading}
	<Card.Root>
		<Card.Header>
			<Card.Title>Company Information</Card.Title>
			<Card.Description>Loading your profile...</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center justify-center py-8">
				<Icon icon="lucide:loader" class="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		</Card.Content>
	</Card.Root>

<!-- Error State -->
{:else if $userProfile.error}
	<Card.Root>
		<Card.Header>
			<Card.Title>Company Information</Card.Title>
			<Card.Description>Unable to load your profile</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="text-center py-8">
				<Icon icon="lucide:alert-circle" class="h-8 w-8 text-red-500 mx-auto mb-4" />
				<p class="text-sm text-muted-foreground mb-4">
					{$userProfile.error}
				</p>
				<Button onclick={() => window.location.reload()}>
					<Icon icon="lucide:refresh-cw" class="h-4 w-4 mr-2" />
					Refresh Page
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

<!-- No Profile Data -->
{:else if !userData}
	<Card.Root>
		<Card.Header>
			<Card.Title>Company Information</Card.Title>
			<Card.Description>Profile not found</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="text-center py-8">
				<Icon icon="lucide:user-x" class="h-8 w-8 text-amber-500 mx-auto mb-4" />
				<p class="text-sm text-muted-foreground mb-4">
					Your profile could not be found. Please complete your account setup.
				</p>
				<Button onclick={goToOnboarding}>
					<Icon icon="lucide:settings" class="h-4 w-4 mr-2" />
					Complete Setup
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

<!-- Profile Data Available -->
{:else}
	<Card.Root>
		<Card.Header>
			<Card.Title>Company Information</Card.Title>
			<Card.Description>
				Manage your company associations and current active company
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-6">
				<!-- Profile Completeness Status -->
				<div class="space-y-2">
					<Label class="font-normal text-muted-foreground">Profile Status</Label>
					<div class="flex items-center gap-2">
						{#if completeness.isComplete}
							<Icon icon="lucide:check-circle" class="h-4 w-4 text-green-600" />
							<span class="text-sm text-green-600">Profile is complete</span>
						{:else}
							<Icon icon="lucide:alert-triangle" class="h-4 w-4 text-amber-600" />
							<span class="text-sm text-amber-600">Profile is incomplete</span>
						{/if}
					</div>
					{#if !completeness.isComplete && completeness.validation}
						<div class="mt-3 p-3 bg-muted/50 rounded-lg">
							<div class="text-xs text-muted-foreground space-y-2">
								{#if completeness.validation.errors?.length}
									<div>
										<strong class="text-red-600">Missing requirements:</strong>
										<ul class="list-disc list-inside mt-1">
											{#each completeness.validation.errors as error}
												<li>{error}</li>
											{/each}
										</ul>
									</div>
								{/if}
								{#if completeness.validation.warnings?.length}
									<div>
										<strong class="text-amber-600">Warnings:</strong>
										<ul class="list-disc list-inside mt-1">
											{#each completeness.validation.warnings as warning}
												<li>{warning}</li>
											{/each}
										</ul>
									</div>
								{/if}
								<div class="pt-2 border-t border-muted">
									<strong>Current Profile Data:</strong>
									<div class="mt-1 space-y-1 text-xs">
										<div>UID: {userData.uid ? '✓' : '✗'}</div>
										<div>Email: {userData.email ? '✓' : '✗'}</div>
										<div>Role: {userData.role ? '✓' : '✗'}</div>
										<div>Current Company ID: {userData.currentCompanyId ? '✓' : '✗'}</div>
										<div>Onboarding Completed: {userData.onboardingCompleted ? '✓' : '✗'}</div>
										<div>Company Associations: {userData.companyAssociations?.length ? `✓ (${userData.companyAssociations.length})` : '✗'}</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Current Active Company -->
				<div class="space-y-2">
					<Label class="font-normal text-muted-foreground">Active Company</Label>
					{#if companyData}
						<div class="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
							<div class="flex items-center gap-3">
								<Icon icon="lucide:building-2" class="h-5 w-5 text-muted-foreground" />
								<div>
									<p class="font-medium">{companyData.company.name}</p>
									<p class="text-sm text-muted-foreground">
										Role: {formatRole(companyData.role)}
									</p>
								</div>
							</div>
							<div class="text-xs text-muted-foreground">
								{companyData.company.code}
							</div>
						</div>
					{:else}
						<div class="flex items-center justify-between p-3 border rounded-lg border-dashed">
							<div class="flex items-center gap-3">
								<Icon icon="lucide:building-2" class="h-5 w-5 text-muted-foreground" />
								<div>
									<p class="text-muted-foreground">No active company</p>
									<p class="text-xs text-muted-foreground">
										Complete onboarding to set up your company
									</p>
								</div>
							</div>
							<Button size="sm" variant="outline" onclick={goToOnboarding}>
								Complete Setup
							</Button>
						</div>
					{/if}
				</div>

				<!-- Company Associations -->
				{#if userData.companyAssociations && userData.companyAssociations.length > 0}
					<div class="space-y-2">
						<Label class="font-normal text-muted-foreground">
							Company Associations ({userData.companyAssociations.length})
						</Label>
						<div class="space-y-2">
							{#each userData.companyAssociations as association}
								<div class="flex items-center justify-between p-3 border rounded-lg">
									<div class="flex items-center gap-3">
										<Icon
											icon={association.companyId === $activeCompanyId ? "lucide:check-circle" : "lucide:circle"}
											class="h-4 w-4 {association.companyId === $activeCompanyId ? 'text-green-600' : 'text-muted-foreground'}"
										/>
										<div>
											<p class="font-medium">{getCompanyName(association.companyId)}</p>
											<p class="text-sm text-muted-foreground">
												Role: {formatRole(association.role)}
											</p>
										</div>
									</div>
									{#if canSwitchCompanies && association.companyId !== $activeCompanyId}
										<Button
											size="sm"
											variant="outline"
											onclick={() => switchCompany(association.companyId)}
											disabled={$companyContext.loading}
										>
											{#if $companyContext.loading}
												Switching...
											{:else}
												Switch
											{/if}
										</Button>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="space-y-2">
						<Label class="font-normal text-muted-foreground">Company Associations</Label>
						<div class="p-4 border rounded-lg border-dashed text-center">
							<Icon icon="lucide:users" class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
							<p class="text-sm text-muted-foreground">No company associations found</p>
							<p class="text-xs text-muted-foreground mt-1">
								Complete onboarding to join or create a company
							</p>
						</div>
					</div>
				{/if}

				<!-- User Role Information -->
				<div class="space-y-2">
					<Label class="font-normal text-muted-foreground">Account Type</Label>
					<div class="flex items-center gap-2">
						<Icon
							icon={userData.role === 'company' ? 'lucide:building-2' : 'lucide:user'}
							class="h-4 w-4 text-muted-foreground"
						/>
						<span class="text-sm capitalize">{userData.role} Account</span>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex gap-2 pt-4 border-t">
					{#if !completeness.isComplete}
						<Button onclick={goToOnboarding} class="flex-1">
							<Icon icon="lucide:settings" class="h-4 w-4 mr-2" />
							Complete Profile Setup
						</Button>
					{/if}
					<Button onclick={refreshProfile} variant="outline" size="sm">
						<Icon icon="lucide:refresh-cw" class="h-4 w-4 mr-2" />
						Refresh Profile
					</Button>
					{#if !companyData && userData?.companyAssociations?.length}
						<Button onclick={forceCompanyInit} variant="outline" size="sm">
							<Icon icon="lucide:building-2" class="h-4 w-4 mr-2" />
							Init Company
						</Button>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>
{/if}