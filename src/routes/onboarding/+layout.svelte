<script lang="ts">
 	import { app } from "$lib/stores/app";

 	let { children } = $props();
</script>

<main class="flex h-[100dvh] flex-col items-center justify-center bg-background">
	<div class="w-full max-w-md">
		{@render children()}
	</div>
</main>