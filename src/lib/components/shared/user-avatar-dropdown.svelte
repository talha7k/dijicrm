  <script lang="ts">
    import { goto } from "$app/navigation";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as Avatar from "$lib/components/ui/avatar";
    import { Button } from "$lib/components/ui/button";
    import { handleLogout } from "$lib/services/authService";
    import { userProfile } from "$lib/stores/user";
    import { get } from "svelte/store";

    let open = $state(false);
    let imageError = $state(false);
    let imageLoaded = $state(false);

    function handleAccount() {
      goto("/account");
    }

    async function logout() {
      await handleLogout();
      goto("/sign-in");
    }

    function handleImageError() {
      imageError = true;
    }

    function handleImageLoad() {
      imageLoaded = true;
      imageError = false;
    }

    $effect(() => {
      // Reset image state when photoURL changes
      imageError = false;
      imageLoaded = false;
    });
  </script>

 <DropdownMenu.Root bind:open>
   <DropdownMenu.Trigger>
     {#snippet child({ props })}
        <Button
          variant="ghost"
          class="relative h-8 w-8 rounded-full"
          {...props}
        >
          <Avatar.Root class="h-8 w-8">
            {#if get(userProfile)?.data?.photoURL && !imageError}
              <Avatar.Image
                src={get(userProfile)?.data?.photoURL}
                alt={get(userProfile)?.data?.displayName || "User"}
                onerror={handleImageError}
                onload={handleImageLoad}
                style={imageLoaded ? 'opacity: 1' : 'opacity: 0'}
              />
            {/if}
            <Avatar.Fallback style={imageLoaded && !imageError ? 'opacity: 0' : 'opacity: 100'}>
              {get(userProfile)?.data?.displayName?.charAt(0)?.toUpperCase() || "U"}
            </Avatar.Fallback>
          </Avatar.Root>
        </Button>
     {/snippet}
   </DropdownMenu.Trigger>
   <DropdownMenu.Content class="w-56" align="end">
    <DropdownMenu.Label class="font-normal">
      <div class="flex flex-col space-y-1">
        <p class="text-sm font-medium leading-none">
          {get(userProfile)?.data?.displayName || "User"}
        </p>
        <p class="text-xs leading-none text-muted-foreground">
          {get(userProfile)?.data?.email}
        </p>
      </div>
    </DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onclick={handleAccount}>
      Account
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={logout}>
      Log out
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>