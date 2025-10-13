<script lang="ts">
	import { getContext } from "svelte";
	import { cn, type WithoutChildren } from "$lib/utils";

	let {
		ref = $bindable(null),
		class: className,
		placeholder,
		children,
		...restProps
	}: WithoutChildren<any> = $props();

	// Get the selected value from context
	const selectedValue = getContext("selectedValue") as string | undefined;
</script>

<span
	bind:this={ref}
	data-slot="select-value"
	class={cn("", className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		{selectedValue || placeholder || ""}
	{/if}
</span>