<script lang="ts">
	import Avatar from '$lib/components/app/account/avatar.svelte';
	import BasicInformation from '$lib/components/app/account/basic-information.svelte';
	import Preferences from '$lib/components/app/account/preferences.svelte';
	import CompanyInformation from '$lib/components/app/account/company-information.svelte';
	import PasswordUpdate from '$lib/components/app/account/password-update.svelte';
	import * as Card from '$lib/components/ui/card';
	import Button from '$lib/components/ui/button/button.svelte';

	let activeTab = $state('personal');
</script>

<div class="flex h-full flex-col items-center justify-center">
	<div class="max-w-4xl w-full">
		<Card.Root>
			<Card.Header>
				<Card.Title>Account</Card.Title>
				<Card.Description>Manage your name, password and account settings.</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="space-y-6">
					<!-- Tab Navigation -->
					<div class="flex space-x-1 bg-muted p-1 rounded-lg">
						<Button
							variant={activeTab === 'personal' ? 'default' : 'ghost'}
							size="sm"
							class="flex-1"
							onclick={() => activeTab = 'personal'}
						>
							Personal
						</Button>
						<Button
							variant={activeTab === 'password' ? 'default' : 'ghost'}
							size="sm"
							class="flex-1"
							onclick={() => activeTab = 'password'}
						>
							Password
						</Button>
						<Button
							variant={activeTab === 'company' ? 'default' : 'ghost'}
							size="sm"
							class="flex-1"
							onclick={() => activeTab = 'company'}
						>
							Company
						</Button>
					</div>

					<!-- Tab Content -->
					{#if activeTab === 'personal'}
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<BasicInformation />
							<div class="space-y-6">
								<Avatar />
								<Preferences />
							</div>
						</div>
					{:else if activeTab === 'password'}
						<PasswordUpdate />
					{:else if activeTab === 'company'}
						<CompanyInformation />
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
