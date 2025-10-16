<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
</script>

<section class="py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-14 text-center">
			<h2
				class="mb-6 max-w-max text-center text-4xl font-bold leading-[3.25rem] lg:mx-auto lg:max-w-2xl"
			>
				Streamline Your Invoice Management with TK-Crm
			</h2>
			<p class="mb-8 text-base font-normal lg:mx-auto lg:max-w-xl">
				A comprehensive CRM system built with SvelteKit and Firebase for managing client relationships and orders
			</p>
			<div
				class="mx-auto flex max-w-lg flex-col justify-center gap-5 md:max-w-2xl md:flex-row lg:max-w-full"
			>
				<Button size="lg" href="/sign-in"
					>Get Started</Button
				>

			</div>
		</div>

		<div
			class="mx-auto grid max-w-lg grid-cols-1 gap-8 md:max-w-2xl md:grid-cols-2 lg:max-w-full lg:grid-cols-4"
		>
			<!-- First Card (Double Width) -->
			<div class="md:col-span-2">
				<Card.Root>
					<Card.Content class="p-0">
						<div class="flex flex-row flex-wrap justify-between rounded-lg">
							<div class="w-full p-5 md:w-1/2 xl:p-8">
								<div class="block">
									<Icon icon="lucide:credit-card" width={30} />
								</div>
								<h3 class="w-full py-5 text-lg font-bold xl:w-64 xl:text-xl">
									Invoice Management
								</h3>
								<p class="mb-8 w-full text-xs font-normal xl:w-64">
									Create, send, and track orders effortlessly. Manage billing cycles and payment statuses in one place.
								</p>
								<Button variant="outline" href="/features">
									Learn More
									<span class="ml-2">→</span>
								</Button>
							</div>
							<div class="relative hidden h-auto md:block md:w-1/2">
								<img
									src="https://placehold.co/400x320"
									alt="Invoice Management Feature"
									class="ml-auto h-full object-cover"
								/>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Second Card -->
			<Card.Root>
				<Card.Content class="p-5 xl:p-8">
					<div class="block">
						<Icon icon="lucide:layout-dashboard" width={30} />
					</div>
					<h3 class="py-5 text-lg font-bold xl:text-xl">Multi-Dashboard System</h3>
					<p class="mb-8 text-xs font-normal">
						Separate interfaces for clients and company admins with role-based access and personalized views
					</p>
					<Button variant="outline" href="/features">
						View Dashboards
						<span class="ml-2">→</span>
					</Button>
				</Card.Content>
			</Card.Root>

			<!-- Third Card -->
			<Card.Root>
				<Card.Content class="p-5 xl:p-8">
					<div class="block">
						<Icon icon="lucide:bell" width={30} />
					</div>
					<h3 class="py-5 text-lg font-bold xl:text-xl">Notification System</h3>
					<p class="mb-8 text-xs font-normal">
						Stay informed with automated notifications for order updates, payments, and important events
					</p>
					<Button variant="outline" href="/features">
						Explore Notifications
						<span class="ml-2">→</span>
					</Button>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</section>
