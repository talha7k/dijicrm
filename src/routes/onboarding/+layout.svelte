<script lang="ts">
 	import { app } from "$lib/stores/app";
 	import { goto } from "$app/navigation";

 	let { children } = $props();

	$effect(() => {
   		if (!$app.initializing) {
   			if (!$app.authenticated) {
   				goto("/sign-in");
   			} else if ($app.profileReady && $app.companyReady) {
   				// User has completed onboarding and has company access
   				goto("/dashboard");
   			}
   			// If profile is ready but company is not, stay on onboarding
   		}
   	});
</script>

<main class="flex h-[100dvh] flex-col items-center justify-center bg-background">
	<div class="w-full max-w-md">
		{@render children()}
	</div>
</main>