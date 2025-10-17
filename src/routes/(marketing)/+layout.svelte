<script lang="ts">
	import MainFooter from '$lib/components/navigation/marketing-footer.svelte';
	import MainNav from '$lib/components/navigation/marketing-header-nav.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	
	let { children } = $props();
</script>

<div class="min-h-screen">
	<Toaster />
	<ModeWatcher />
	<MainNav />
	<main class="pt-16">
		{@render children()}
	</main>
	<MainFooter />
</div>
