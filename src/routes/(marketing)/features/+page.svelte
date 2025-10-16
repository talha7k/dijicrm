<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
</script>

<section class="py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto mb-16 max-w-3xl xl:max-w-full">
			<span class="mb-2 block text-center text-sm uppercase lg:text-left">Features</span>
			<h2 class="text-center text-4xl font-semibold leading-[3.2rem] lg:text-left">
				Everything you need for <span class="text-primary">Invoice Management</span> and CRM
			</h2>
		</div>

		<div
			class="mx-auto grid max-w-md grid-cols-1 gap-x-5 gap-y-5 sm:max-w-3xl sm:grid-cols-2 xl:max-w-full xl:grid-cols-4 xl:gap-x-8 xl:gap-y-8"
		>
			<!-- Firebase Authentication -->
			<Card.Root>
				<Card.Content class="p-4 xl:p-7">
					<div class="mb-6">
						<Icon icon="lucide:flame" width={26} />
					</div>
					<h4 class="mb-2 text-base font-semibold capitalize">Firebase Authentication</h4>
					<p class="text-sm leading-5">
						Secure authentication with Firebase, supporting multiple providers for clients and companies
					</p>
				</Card.Content>
			</Card.Root>

			<!-- Multi-dashboard system -->
			<Card.Root>
				<Card.Content class="p-4 xl:p-7">
					<div class="mb-6">
						<Icon icon="lucide:layout-dashboard" width={26} />
					</div>
					<h4 class="mb-2 text-base font-semibold capitalize">Multi-dashboard System</h4>
					<p class="text-sm leading-5">
						Separate dashboards for client access and company administration with role-based views
					</p>
				</Card.Content>
			</Card.Root>

			<!-- Invoice management and billing -->
			<Card.Root>
				<Card.Content class="p-4 xl:p-7">
					<div class="mb-6">
						<Icon icon="lucide:credit-card" width={26} />
					</div>
					<h4 class="mb-2 text-base font-semibold capitalize">Invoice Management & Billing</h4>
					<p class="text-sm leading-5">
						Comprehensive order creation, tracking, and billing system for efficient financial management
					</p>
				</Card.Content>
			</Card.Root>

			<!-- Notification system -->
			<Card.Root>
				<Card.Content class="p-4 xl:p-7">
					<div class="mb-6">
						<Icon icon="lucide:bell" width={26} />
					</div>
					<h4 class="mb-2 text-base font-semibold capitalize">Notification System</h4>
					<p class="text-sm leading-5">
						Built-in notification system to keep clients and companies informed of important updates
					</p>
				</Card.Content>
			</Card.Root>

			<!-- Styling with Shadcn/Svelte -->
			<Card.Root>
				<Card.Content class="p-4 xl:p-7">
					<div class="mb-6">
						<Icon icon="lucide:palette" width={26} />
					</div>
					<h4 class="mb-2 text-base font-semibold capitalize">Modern UI with Shadcn/Svelte</h4>
					<p class="text-sm leading-5">
						Beautiful, responsive design using Shadcn/Svelte components for a professional look
					</p>
				</Card.Content>
			</Card.Root>

			<!-- Protected routes with auth guards -->
			<Card.Root>
				<Card.Content class="p-4 xl:p-7">
					<div class="mb-6">
						<Icon icon="lucide:shield-check" width={26} />
					</div>
					<h4 class="mb-2 text-base font-semibold capitalize">Protected Routes & Auth Guards</h4>
					<p class="text-sm leading-5">
						Secure routing with authentication guards ensuring proper access control for all users
					</p>
				</Card.Content>
			</Card.Root>

			<!-- CTA Section -->
			<div class="relative mt-8 rounded-2xl sm:col-span-2 xl:mt-0">
				<p class="mb-9 text-center text-base leading-6 xl:text-left">
					Start managing your orders and client relationships with TK-Crm today
				</p>
				<div class="flex flex-col items-center justify-center gap-7 xl:flex-row xl:justify-start">
					<Button size="lg">Get Started</Button>
					<span class="text-sm">*Built with SvelteKit and Firebase</span>
				</div>
			</div>
		</div>
	</div>
</section>
