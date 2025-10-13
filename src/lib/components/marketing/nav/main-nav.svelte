<script lang="ts">
  import { Button, buttonVariants } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";
  import Icon from "@iconify/svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import DarkModeToggle from "$lib/components/shared/dark-mode-toggle.svelte";
  import { marketingNavItems, siteConfig } from "../../../../config";
  import { firekitUser } from "svelte-firekit";
  import { page } from "$app/state";
  let path = $derived(page.url.pathname);
  let previousPath = $state(page.url.pathname);

  let isNavOpen = $state(false);
  let buttonRefs = $state<any[]>(
    new Array(marketingNavItems.length).fill(null),
  );
  let activeIndex = $derived(
    marketingNavItems.findIndex((item) => !item.items && path === item.url),
  );
  let indicatorStyle = $state("");

  $effect(() => {
    if (previousPath !== path) {
      isNavOpen = false;
      previousPath = path;
    }
  });

  $effect(() => {
    if (activeIndex >= 0 && buttonRefs[activeIndex]) {
      const el = buttonRefs[activeIndex];
      indicatorStyle = `left: ${el.offsetLeft}px; width: ${el.offsetWidth}px;`;
    } else {
      indicatorStyle = "";
    }
  });
</script>

<div class="fixed inset-x-0 top-0 z-10 flex h-fit flex-col">
  <header
    class=" w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <nav
      class="relative mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 md:flex md:items-center md:justify-between md:gap-3 lg:px-8"
    >
      <!-- Logo w/ Collapse Button -->
      <div class="flex items-center justify-between">
        <a href="/" class="cursor-pointer">
          <img
            src={siteConfig.logo}
            alt={siteConfig.title}
            class="h-6 dark:hidden"
          />
          <img
            src={siteConfig.logoDark}
            alt={siteConfig.title}
            class="hidden h-6 dark:block"
          />
        </a>

        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            class="md:hidden"
            onclick={() => (isNavOpen = !isNavOpen)}
          >
            <Icon icon="lucide:menu" />
            <span class="sr-only">Toggle navigation</span>
          </Button>
          <!-- End Collapse Button -->
          <div class="md:hidden">
            <DarkModeToggle />
          </div>
        </div>
        <!-- Collapse Button -->
      </div>
      <!-- End Logo w/ Collapse Button -->

      <!-- Collapse -->
      <div
        class={`${
          isNavOpen ? "block" : "hidden"
        } grow basis-full overflow-hidden transition-all duration-300 md:block`}
        aria-labelledby="header-collapse"
      >
        <div
          class="max-h-[75vh] overflow-hidden overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar]:w-2"
        >
          <div
            class="relative flex flex-col items-center gap-0.5 py-2 md:flex-row md:justify-end md:gap-1 md:py-0"
          >
            {#each marketingNavItems as item, index}
              {#if item.items && item.items?.length > 0}
                <!-- Dropdown for items with sub-items -->
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger
                    class="{buttonVariants({ variant: 'ghost' })} "
                    >{item.title}
                    <Icon icon="lucide:chevron-down" /></DropdownMenu.Trigger
                  >
                  <DropdownMenu.Content>
                    <DropdownMenu.Group>
                      {#each item.items as subItem}
                        <DropdownMenu.Item>
                          <a href={subItem.url}>{subItem.title}</a>
                        </DropdownMenu.Item>
                      {/each}
                    </DropdownMenu.Group>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              {:else}
                <!-- Regular Button for single items -->
                <div bind:this={buttonRefs[index]} class="z-10">
                  <Button
                    variant="ghost"
                    href={item.url}
                    class={path === item.url ? "text-primary-foreground" : ""}
                  >
                    {#if item.icon}
                      <Icon icon={item.icon} />
                    {/if}
                    {item.title}
                  </Button>
                </div>
              {/if}
            {/each}
            {#if indicatorStyle}
              <div
                class="hidden md:block absolute top-0 bottom-0 bg-primary rounded-md transition-all duration-300 ease-in-out pointer-events-none"
                style={indicatorStyle}
              ></div>
            {/if}
            <div class="hidden md:block">
              <DarkModeToggle />
            </div>
            <Separator
              orientation="vertical"
              class="mr-2 hidden h-5 md:block"
            />
            {#if firekitUser.initialized && firekitUser.isAuthenticated}
              <Button href="/dashboard">Dashboard</Button>
            {:else}
              <Button href="/sign-in">Get Started</Button>
            {/if}
          </div>
        </div>
      </div>
      <!-- End Collapse -->
    </nav>
  </header>
</div>
