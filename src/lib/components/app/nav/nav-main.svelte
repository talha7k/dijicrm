<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Icon from '@iconify/svelte';
	import { clientNavItems, companyNavItems } from '../../../../config';
	import { isSidebarOpen } from '$lib/stores/sidebar';
	import { userProfile } from '$lib/stores/user';
	import { page } from '$app/stores';

	let navItems = $derived($userProfile.data?.role === 'client' ? clientNavItems : companyNavItems);

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
												class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
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
	
	/* Ensure stable positioning for active indicators */
	:global([data-sidebar="menu-item"]) {
		position: relative;
	}
	
	/* Prevent any width/height/padding transitions that cause layout shifts */
	:global([data-sidebar="menu-button"] *) {
		transition: none !important;
	}
	
	/* Only allow color transitions */
	:global([data-sidebar="menu-button"]:hover),
	:global([data-sidebar="menu-button"][data-active="true"]) {
		transition: background-color 150ms ease-in-out, color 150ms ease-in-out !important;
	}
</style>
