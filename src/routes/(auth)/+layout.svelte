<script>
  import { isAuthenticated, isLoading } from "$lib/services/authService";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let { children } = $props();

  // Initialize auth service and redirect if already authenticated
  onMount(async () => {
    const { initializeAuth } = await import("$lib/services/authService");
    await initializeAuth();
    
    // If user is already authenticated, redirect to dashboard
    if ($isAuthenticated) {
      goto("/dashboard");
    }
  });

  // Watch for auth state changes
  $effect(() => {
    if ($isAuthenticated && !$isLoading) {
      goto("/dashboard");
    }
  });
</script>

<main class="flex h-[100dvh] flex-col items-center justify-center">
	{@render children()}
</main>