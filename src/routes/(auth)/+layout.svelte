<script>
	import { app } from "$lib/stores/app";

	let { children } = $props();
</script>

<main class="flex h-[100dvh] flex-col items-center justify-center">
	{@render children()}
</main>
