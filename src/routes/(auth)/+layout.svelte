<script>
	import { app } from "$lib/stores/app";
	import { goto } from "$app/navigation";

	let { children } = $props();

	$effect(() => {
		if (!$app.initializing && $app.authenticated) {
			goto("/dashboard");
		}
	});
</script>

<main class="flex h-[100dvh] flex-col items-center justify-center">
	{@render children()}
</main>
