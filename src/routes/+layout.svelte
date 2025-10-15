<script lang="ts">
	import '../app.css';
	import { initializeApp } from '$lib/services/initService';
	import { app } from '$lib/stores/app';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import Loading from '$lib/components/ui/loading/loading.svelte';

	let { children } = $props();

	initializeApp();
</script>

<div class="h-dvh">
	<Toaster />
	<ModeWatcher />

	{#if $app.initializing}
		<div class="flex h-full w-full items-center justify-center">
			<Loading message="Initializing app..." size="lg" />
		</div>
	{:else if $app.error}
		<div class="flex h-full w-full items-center justify-center">
			<div class="text-center">
				<p class="text-destructive mb-2">Error loading application</p>
				<p class="text-sm text-muted-foreground">{$app.error}</p>
			</div>
		</div>
	{:else}
		{@render children()}
	{/if}
</div>
