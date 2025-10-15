 <script lang="ts">
   import { goto } from "$app/navigation";
   import { firekitAuth } from "svelte-firekit";
   import { userProfile } from "$lib/stores/user";
   import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
   import * as Avatar from "$lib/components/ui/avatar";
   import { Button } from "$lib/components/ui/button";

   let open = $state(false);

   function handleAccount() {
     goto("/account");
   }

   async function handleLogout() {
     await firekitAuth.signOut();
     goto("/sign-in");
   }
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
           <Avatar.Image
             src={$userProfile.data?.photoURL || undefined}
             alt={$userProfile.data?.displayName || "User"}
           />
           <Avatar.Fallback>
             {$userProfile.data?.displayName?.charAt(0)?.toUpperCase() || "U"}
           </Avatar.Fallback>
         </Avatar.Root>
       </Button>
     {/snippet}
   </DropdownMenu.Trigger>
   <DropdownMenu.Content class="w-56" align="end">
    <DropdownMenu.Label class="font-normal">
      <div class="flex flex-col space-y-1">
        <p class="text-sm font-medium leading-none">
          {$userProfile.data?.displayName || "User"}
        </p>
        <p class="text-xs leading-none text-muted-foreground">
          {$userProfile.data?.email}
        </p>
      </div>
    </DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onclick={handleAccount}>
      Account
    </DropdownMenu.Item>
    <DropdownMenu.Item onclick={handleLogout}>
      Log out
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>