<!--
	Loading Component - Standardized loading indicator for the app

	Features:
		- Uses theme colors (primary + muted-foreground) for better contrast
		- Full circular border with animated top segment
		- Consistent sizing across the application

	Usage:
		<Loading /> - Default loading with spinner and "Loading..." text
		<Loading message="Loading clients..." /> - Custom message
		<Loading size="lg" /> - Large spinner
		<Loading size="sm" message="Saving..." /> - Small spinner with custom message
-->
<script lang="ts">
	import { cn } from "$lib/utils.js";

	interface Props {
		message?: string;
		size?: "sm" | "md" | "lg";
		class?: string;
	}

	let {
		message = "Loading...",
		size = "md",
		class: className
	}: Props = $props();

	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-8 w-8",
		lg: "h-12 w-12"
	};
</script>

<div class={cn("flex items-center justify-center gap-2", className)}>
	<div class={cn("animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary", sizeClasses[size])}></div>
	{#if message}
		<span class="text-sm text-muted-foreground">{message}</span>
	{/if}
</div>