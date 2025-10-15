<script lang="ts">
	import Avatar from '$lib/components/app/account/avatar.svelte';
	import PersonalInformation from '$lib/components/app/account/personal-information.svelte';
	import CompanyInformation from '$lib/components/app/account/company-information.svelte';
	import PasswordUpdate from '$lib/components/app/account/password-update.svelte';
	import * as Card from '$lib/components/ui/card';
</script>

<div class="flex h-full flex-col items-center justify-center">
	<div class="max-w-4xl w-full space-y-6">
		<!-- Personal Information Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Account</Card.Title>
				<Card.Description>Manage your name, password and account settings.</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex flex-col justify-start gap-6">
					<Avatar />
					<PersonalInformation />
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Password Update Card -->
		<PasswordUpdate />

		<!-- Company Information Card -->
		<CompanyInformation />
	</div>
</div>
