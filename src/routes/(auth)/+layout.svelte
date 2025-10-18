<script>
  import { isAuthenticated, isLoading, requiresOnboarding } from "$lib/services/authService";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let { children } = $props();

  // Initialize auth service and redirect if already authenticated
  onMount(async () => {
    const { initializeAuth } = await import("$lib/services/authService");
    await initializeAuth();
  });

  // Watch for auth state changes and redirect authenticated users
  $effect(() => {
    if ($isAuthenticated && !$isLoading) {
      if ($requiresOnboarding) {
        goto("/onboarding");
      } else {
        goto("/dashboard");
      }
    }
  });
</script>

<main class="flex h-[100dvh] flex-col items-center justify-center">
	{@render children()}
</main>