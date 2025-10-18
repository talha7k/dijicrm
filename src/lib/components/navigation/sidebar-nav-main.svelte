<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Icon from '@iconify/svelte';
	import { clientNavItems, companyNavItems } from '../../../config';
	import { isSidebarOpen } from '$lib/stores/sidebar';
	import { userProfile } from '$lib/services/authService';
	import { page } from '$app/stores';

	let navItems = $derived($userProfile?.role === 'client' ? clientNavItems : companyNavItems);

	// Function to check if a URL is active
	function isActive(url: string): boolean {
		if (!url) return false;
		const currentPath = $page.url.pathname;
		
		// Exact match
		if (currentPath === url) return true;
		
		// Check if current path starts with the URL (for nested routes)
		if (url !== '/' && currentPath.startsWith(url)) {
			// Make sure we're not matching partial segments
			const nextChar = currentPath.charAt(url.length);
			return nextChar === '' || nextChar === '/';
		}
		
		return false;
	}
</script>

{#each navItems as mainItem (mainItem.title)}
	<Sidebar.Group>
		<Sidebar.GroupLabel>{mainItem.title}</Sidebar.GroupLabel>
		<Sidebar.GroupContent>
			{#each mainItem.items as item (item.title)}
			{#if item.items && item.items.length > 0}
				<Sidebar.Menu>
					<Collapsible.Root class="group/collapsible">
						{#snippet child({ props })}
							<Sidebar.MenuItem {...props}>
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuButton {...props} isActive={isActive(item.url || '')}>
											{#snippet tooltipContent()}
												{item.title}
											{/snippet}
											{#if item.icon}
												<Icon icon={item.icon} />
											{/if}
											<span>{item.title}</span>
											<Icon
												icon="lucide:chevron-right"
												class="ml-auto chevron-icon transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
											/>
										</Sidebar.MenuButton>
									{/snippet}
								</Collapsible.Trigger>
								<Collapsible.Content>
									{#if item.items}
										<Sidebar.MenuSub>
											{#each item.items as subItem (subItem.title)}
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton isActive={isActive(subItem.url || '')}>
														{#snippet child({ props })}
															<a href={subItem.url} {...props} onclick={() => isSidebarOpen.set(false)}>
																<span>{subItem.title}</span>
															</a>
														{/snippet}
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
											{/each}
										</Sidebar.MenuSub>
									{/if}
								</Collapsible.Content>
							</Sidebar.MenuItem>
						{/snippet}
					</Collapsible.Root>
				</Sidebar.Menu>
			{:else}
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={isActive(item.url || '')}>
							{#snippet child({ props })}
								<a href={item.url} {...props} onclick={() => isSidebarOpen.set(false)}>
									{#if item.icon}
										<Icon icon={item.icon} />
									{/if}
									<span>{item.title}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			{/if}
		{/each}
		</Sidebar.GroupContent>
	</Sidebar.Group>
{/each}

<style>
	/* Prevent layout-shifting transitions in navigation */
	:global([data-sidebar="menu-button"]) {
		transition: background-color 150ms ease-in-out, color 150ms ease-in-out !important;
	}
	
	/* Override base active styles with more specific selectors */
	:global([data-sidebar="menu-button"][data-active="true"]) {
		background-color: hsl(142.1 70.6% 45.3%) !important;
		color: white !important;
		font-weight: 600 !important;
		box-shadow: inset 0 0 0 2px hsl(142.1 70.6% 35%), 0 0 8px hsl(142.1 70.6% 30%);
		position: relative;
	}

	/* Add ripple effect on click */
	:global([data-sidebar="menu-button"]:active),
	:global([data-sidebar="menu-sub-button"]:active) {
		transform: scale(0.98);
		transition: transform 100ms ease-out !important;
	}
	
	/* Ensure stable positioning for active indicators */
	:global([data-sidebar="menu-item"]) {
		position: relative;
	}

	/* Add subtle pulse animation for active items */
	@keyframes sidebar-pulse {
		0%, 100% {
			box-shadow: inset 0 0 0 2px hsl(var(--sidebar-primary) / 0.3);
		}
		50% {
			box-shadow: inset 0 0 0 2px hsl(var(--sidebar-primary) / 0.5), 0 0 4px hsl(var(--sidebar-primary) / 0.2);
		}
	}

	:global([data-sidebar="menu-button"][data-active="true"]) {
		animation: sidebar-pulse 2s ease-in-out infinite;
	}
	
	/* Prevent any width/height/padding transitions that cause layout shifts */
	:global([data-sidebar="menu-button"] *) {
		transition: none !important;
	}
	
	/* Enhanced hover states with glow effect */
	:global([data-sidebar="menu-button"]:hover) {
		background-color: hsl(var(--sidebar-accent)) !important;
		color: hsl(var(--sidebar-accent-foreground)) !important;
		box-shadow: inset 0 0 0 1px hsl(var(--sidebar-border) / 0.2), 0 2px 8px hsl(var(--sidebar-accent) / 0.3);
		transform: translateY(-1px);
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
	}
	
	/* Active state with enhanced hover */
	:global([data-sidebar="menu-button"][data-active="true"]) {
		background-color: hsl(142.1 70.6% 45.3%) !important;
		color: white !important;
		font-weight: 600 !important;
		box-shadow: inset 0 0 0 2px hsl(142.1 70.6% 35%), 0 0 8px hsl(142.1 70.6% 30%);
		position: relative;
		border-left: 4px solid #10b981 !important;
		padding-left: calc(0.5rem - 4px) !important;
	}
	
	:global([data-sidebar="menu-button"][data-active="true"]:hover) {
		background-color: hsl(142.1 75% 40%) !important;
		color: white !important;
		box-shadow: inset 0 0 0 2px #10b981, 0 0 12px hsl(142.1 70.6% 30%), 0 4px 16px hsl(142.1 70.6% 25%);
		transform: translateY(-2px);
	}
	
	/* Sub-menu hover effects */
	:global([data-sidebar="menu-sub-button"]:hover) {
		background-color: hsl(var(--sidebar-accent)) !important;
		color: hsl(var(--sidebar-accent-foreground)) !important;
		box-shadow: inset 0 0 0 1px hsl(var(--sidebar-border) / 0.2), 0 1px 4px hsl(var(--sidebar-accent) / 0.2);
		transform: translateX(2px);
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
	}
	
	:global([data-sidebar="menu-sub-button"][data-active="true"]) {
		background-color: hsl(142.1 70.6% 45.3%) !important;
		color: white !important;
		font-weight: 600 !important;
		box-shadow: inset 0 0 0 1px hsl(142.1 70.6% 35%), 0 0 6px hsl(142.1 70.6% 30%);
		position: relative;
	}
	
	:global([data-sidebar="menu-sub-button"][data-active="true"]:hover) {
		background-color: hsl(142.1 75% 40%) !important;
		color: white !important;
		box-shadow: inset 0 0 0 1px #10b981, 0 0 8px hsl(142.1 70.6% 30%), 0 2px 8px hsl(142.1 70.6% 25%);
		transform: translateX(4px);
	}
	
	/* Group label no hover effect - keep default cursor and no effects */
	:global([data-sidebar="group-label"]) {
		cursor: default !important;
		pointer-events: none !important;
		/* Remove any interactive styling */
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
	}
	
	:global([data-sidebar="group-label"]:hover) {
		cursor: default !important;
		pointer-events: none !important;
		/* Remove any hover effects - keep as default */
		background-color: initial !important;
		transform: none !important;
		box-shadow: none !important;
		color: initial !important;
	}
	
	/* Smooth icon transitions on hover */
	:global([data-sidebar="menu-button"]:hover svg),
	:global([data-sidebar="menu-sub-button"]:hover svg) {
		filter: brightness(1.3) drop-shadow(0 0 3px hsl(var(--sidebar-accent-foreground) / 0.4));
		transform: scale(1.1);
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
	}
	
	/* Chevron rotation animation */
	:global([data-sidebar="menu-button"] .chevron-icon) {
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
	}
	
	:global([data-sidebar="menu-button"]:hover .chevron-icon) {
		filter: brightness(1.4) drop-shadow(0 0 4px hsl(var(--sidebar-accent-foreground) / 0.5));
		transform: scale(1.15) rotate(5deg);
	}
	

	
	/* Collapsed state active indicators */
	:global([data-sidebar="menu-button"][data-active="true"]) {
		background-color: hsl(142.1 70.6% 45.3%) !important;
		color: white !important;
	}
	
	/* Ensure collapsed state centers icons properly */
	:global([data-collapsible="icon"] [data-sidebar="menu-button"]) {
		justify-content: center !important;
		padding-left: 0.5rem !important;
		padding-right: 0.5rem !important;
	}
	
	:global([data-collapsible="icon"] [data-sidebar="menu-button"] > span) {
		display: none !important;
	}
</style>
