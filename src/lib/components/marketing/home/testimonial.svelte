<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import Icon from '@iconify/svelte';
</script>

<section class="bg-muted-foreground/5 py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div
			class="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-y-8 md:max-w-3xl md:flex-wrap md:gap-y-0 xl:max-w-full xl:flex-row xl:flex-nowrap xl:justify-between xl:gap-x-8"
		>
			<div class="w-full xl:w-1/3">
				<span class="mb-4 block text-sm font-medium text-indigo-600">Customer Success Stories</span>
				<h2 class="font-manrope mb-4 text-4xl font-bold leading-[3.25rem]">
					What our clients are saying
				</h2>
				<p class="mb-14 text-base">Real businesses, real results, real client experiences</p>
				<Button variant="outline" class="flex items-center gap-4">
					View all testimonials
					<span>→</span>
				</Button>
			</div>

			<div class="relative w-full md:-mt-20 xl:mt-0 xl:w-2/3">
				<div class="flex flex-col items-center gap-8 md:flex-row">
					<!-- First Card -->
					<div class="w-full xl:w-1/2">
						<Card.Root class="shadow-sm">
							<Card.Content class="p-8">
								<div class="flex items-center gap-2 text-amber-500">
									{#each Array(5) as _}
										<Icon icon="lucide:star" width={20} fill="currentColor" />
									{/each}
								</div>
								<p class="py-6 text-lg leading-8">
									"Dijicrm transformed our invoicing process! We went from manual spreadsheets to automated invoice management in days. Our clients love the professional invoices."
								</p>
								<div class="flex items-center">
									<div class="flex items-center gap-4">
										<Avatar.Root>
											<Avatar.Image src="https://placehold.co/24x24" alt="Sarah Chen" />
											<Avatar.Fallback>SC</Avatar.Fallback>
										</Avatar.Root>
										<h6 class="font-medium">Sarah Chen</h6>
									</div>
									<span
										class="ml-4 border-l border-solid border-gray-300 pl-4 text-sm font-medium text-indigo-600"
									>
										Small Business Owner
									</span>
								</div>
							</Card.Content>
						</Card.Root>
					</div>

					<!-- Right Column Cards -->
					<div class="grid w-full gap-8 xl:w-1/2">
						<Card.Root class="shadow-sm">
							<Card.Content class="p-8">
								<div class="flex items-center gap-2 text-amber-500">
									{#each Array(5) as _}
										<Icon icon="lucide:star" width={20} fill="currentColor" />
									{/each}
								</div>
								<p class="py-6 text-lg leading-8">
									"Managing client relationships and invoices has never been easier. Dijicrm's multi-dashboard system keeps everything organized for our team."
								</p>
								<div class="flex items-center">
									<div class="flex items-center gap-4">
										<Avatar.Root>
											<Avatar.Image src="https://placehold.co/24x24" alt="Alex Rivera" />
											<Avatar.Fallback>AR</Avatar.Fallback>
										</Avatar.Root>
										<h6 class="font-medium">Alex Rivera</h6>
									</div>
									<span
										class="ml-4 border-l border-solid border-gray-300 pl-4 text-sm font-medium text-indigo-600"
									>
										Account Manager
									</span>
								</div>
							</Card.Content>
						</Card.Root>

						<Card.Root class="shadow-sm">
							<Card.Content class="p-8">
								<div class="flex items-center gap-2 text-amber-500">
									{#each Array(5) as _}
										<Icon icon="lucide:star" width={20} fill="currentColor" />
									{/each}
								</div>
								<p class="py-6 text-lg leading-8">
									"The notification system keeps us on top of payments and overdue invoices. Our cash flow has improved significantly since switching to Dijicrm."
								</p>
								<div class="flex items-center">
									<div class="flex items-center gap-4">
										<Avatar.Root>
											<Avatar.Image src="https://placehold.co/24x24" alt="Marcus Kim" />
											<Avatar.Fallback>MK</Avatar.Fallback>
										</Avatar.Root>
										<h6 class="font-medium">Marcus Kim</h6>
									</div>
									<span
										class="ml-4 border-l border-solid border-gray-300 pl-4 text-sm font-medium text-indigo-600"
									>
										Finance Director
									</span>
								</div>
							</Card.Content>
						</Card.Root>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
