<script lang="ts">
	import '../app.css';
	import { initializeApp } from '$lib/services/initService';
	import { app } from '$lib/stores/app';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();

	initializeApp();
</script>

<div class="h-dvh">
	<Toaster />
	<ModeWatcher />

	{#if $app.initializing}
		<div class="flex h-full w-full items-center justify-center">
			<p>Loading...</p>
		</div>
	{:else if $app.error}
		<div class="flex h-full w-full items-center justify-center">
			<p>Error: {$app.error}</p>
		</div>
	{:else}
		{@render children()}
	{/if}
</div>
