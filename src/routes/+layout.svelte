<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
	
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
</script>

<div class="h-dvh">
 	<Toaster />
 	<ModeWatcher />
 	{@render children()}
</div>
