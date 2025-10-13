<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible';
	import Icon from '@iconify/svelte';

	let { title = 'Frequently asked questions', faqs = [
		{
			question: 'How do I get started with Dijicrm?',
			answer:
				"Getting started is easy! Sign up for an account, complete your company profile, and start adding clients. Our intuitive dashboard guides you through creating your first invoice in minutes."
		},
		{
			question: 'How does the multi-dashboard system work?',
			answer:
				'Dijicrm provides separate dashboards for clients and company administrators. Clients can view their invoices and payment history, while admins have full access to client management, billing, and analytics.'
		},
		{
			question: 'Can I customize my invoices?',
			answer:
				"Yes! Dijicrm allows you to customize invoice templates with your branding, add company logos, choose color schemes, and include custom fields. Professional invoices that reflect your business."
		},
		{
			question: 'What payment methods are supported?',
			answer:
				'We support multiple payment methods including credit cards, bank transfers, PayPal, and Stripe integration. Clients can pay invoices directly through the platform with secure payment processing.'
		},
		{
			question: 'How secure is Dijicrm?',
			answer:
				'Dijicrm uses Firebase Authentication with role-based access control, encrypted data storage, and secure API endpoints. All data is protected with industry-standard security measures.'
		},
		{
			question: 'Can I integrate Dijicrm with other tools?',
			answer:
				'Yes! Dijicrm supports integrations with popular accounting software, CRM systems, and payment processors. We also provide APIs for custom integrations.'
		},
		{
			question: 'What kind of support do you provide?',
			answer:
				'We offer comprehensive support including documentation, video tutorials, email support, and a community forum. Enterprise plans include dedicated account managers and priority support.'
		},
		{
			question: 'How do I migrate from my current invoicing system?',
			answer:
				'We provide migration tools and support to help you import clients, invoices, and historical data. Our team assists with data mapping and ensures a smooth transition to Dijicrm.'
		}
	] } = $props();
</script>

<section class="py-24">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mb-16">
			<h2 class="font-manrope text-center text-4xl font-bold leading-[3.25rem]">
				{title}
			</h2>
		</div>

		<div class="columns-1 gap-8 max-lg:mx-auto max-lg:max-w-2xl lg:columns-2">
			{#each faqs as faq}
				<div class="mb-8 break-inside-avoid">
					<Collapsible.Root class="group rounded-xl border p-4 transition-all duration-500">
						<Collapsible.Trigger
							class="flex w-full items-center justify-between text-left text-lg leading-8"
						>
							<span>{faq.question}</span>
							<Icon
								icon="lucide:chevron-right"
								class="h-5 w-5 transition-transform group-data-[state=open]:rotate-90"
							/>
						</Collapsible.Trigger>
						<Collapsible.Content class="pt-4">
							<p class="leading-6">
								{faq.answer}
							</p>
						</Collapsible.Content>
					</Collapsible.Root>
				</div>
			{/each}
		</div>
	</div>
</section>
