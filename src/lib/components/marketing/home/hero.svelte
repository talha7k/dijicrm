<script>
	import Button from '$lib/components/ui/button/button.svelte';
	import Icon from '@iconify/svelte';
	import { siteConfig } from '../../../../config';
</script>

<section class=" bg-center pt-28 lg:pt-32">
	<div class=" mx-auto flex max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8">

		<h1 class="mb-5 max-w-2xl text-center text-4xl font-bold md:text-5xl">
			{siteConfig.title}
		</h1>
		<p class="mb-9 max-w-sm text-center">
			{siteConfig.description}
		</p>
		<div class="mb-12 flex flex-col gap-2 md:flex-row">
			<Button size="lg" href="/sign-in">Get Started Now</Button>
		</div>

		<img
			src="/screenshot.png"
			alt="Dashboard screenshot"
			class="h-auto rounded-t-3xl border-4 object-cover"
		/>
	</div>
</section>
