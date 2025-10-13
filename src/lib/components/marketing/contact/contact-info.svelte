<script lang="ts">
	import SocialMediaIcons from '$lib/components/shared/social-media-icons.svelte';
	import Icon from '@iconify/svelte';
	import { contactInfo } from '../../../../config';
</script>

<div class="pt-0 lg:pt-6">
	<h2 class="font-manrope mb-5 text-center text-4xl font-semibold lg:text-start">Get In Touch</h2>
	<p class="mb-10 max-w-lg text-center text-lg lg:text-start">
		Have questions about TK-Crm or need help with your CRM setup? Contact us and we'll get back to you as soon as possible.
	</p>

	<div class="space-y-6">
		<div class="flex items-center justify-center lg:justify-start">
			<Icon icon="lucide:phone" width={24} />
			<span class="ml-5">{contactInfo.phone} </span>
		</div>

		<div class="flex items-center justify-center lg:justify-start">
			<Icon icon="lucide:mail" width={24} />
			<span class="ml-5">{contactInfo.email} </span>
		</div>

		<div class="flex items-center justify-center border-b pb-6 lg:justify-start">
			<Icon icon="lucide:map-pin" width={24} />
			<span class="ml-5">{contactInfo.address} </span>
		</div>

		<div class="flex items-center justify-center gap-4 lg:justify-start">
			<SocialMediaIcons />
		</div>
	</div>
</div>
