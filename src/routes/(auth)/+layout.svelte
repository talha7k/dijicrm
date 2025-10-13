<script>
	import { goto } from '$app/navigation';
	import { firekitUser } from 'svelte-firekit';
	let { children } = $props();
	$effect(() => {
		if (firekitUser.initialized && firekitUser.isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

{#if firekitUser.initialized && !firekitUser.isAuthenticated}
	<main class="flex h-[100dvh] flex-col items-center justify-center">
		{@render children()}
	</main>
{/if}
