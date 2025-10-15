<script lang="ts">
 import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import type { ComponentProps } from 'svelte';
	import { siteConfig } from '../../../../config';
	import NavMain from './nav-main.svelte';
	import NavUser from './nav-user.svelte';

	const sidebar = useSidebar();

	import { isSidebarOpen } from '$lib/stores/sidebar';
	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<div on:mouseenter={() => isSidebarOpen.set(true)} on:mouseleave={() => isSidebarOpen.set(false)}>
	<Sidebar.Root bind:ref {collapsible} {...restProps}>
		<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem class="flex items-center">
				<Sidebar.MenuButton
					size="lg"
					class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex-grow"
				>
					{#snippet child({ props })}
						<a href="/" class="cursor-pointer" {...props}>
							<img src={siteConfig.logo} alt={siteConfig.title} class="h-6 dark:hidden" />
							<img src={siteConfig.logoDark} alt={siteConfig.title} class="hidden h-6 dark:block" />
						</a>
					{/snippet}
				</Sidebar.MenuButton>

			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
	<Sidebar.Rail />
	</Sidebar.Root>
</div>
