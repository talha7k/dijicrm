<script lang="ts">
 	import { app } from "$lib/stores/app";
  import DarkModeToggle from "$lib/components/shared/dark-mode-toggle.svelte";
  import UserAvatarDropdown from "$lib/components/shared/user-avatar-dropdown.svelte";

 	let { children } = $props();
</script>

<div class="flex h-[100dvh] flex-col bg-background">
	<!-- Header -->
	<header class="flex items-center justify-between p-4 border-b">
		<div class="flex items-center gap-2">
			<!-- Logo or title could go here -->
			<h1 class="text-lg font-semibold">Setup Your Account</h1>
		</div>
		<div class="flex items-center gap-2">
			<DarkModeToggle />
			<UserAvatarDropdown />
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1 flex items-center justify-center py-8">
 		<div class="w-full max-w-2xl px-4">
			{@render children()}
		</div>
	</main>
</div>