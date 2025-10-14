<script lang="ts">
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';

  interface Props {
    open: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }

  let { open = $bindable(false), title, message, type = 'info' }: Props = $props();

  function handleClose() {
    open = false;
  }

  function getIcon() {
    switch (type) {
      case 'success':
        return 'lucide:check-circle';
      case 'warning':
        return 'lucide:alert-triangle';
      case 'error':
        return 'lucide:x-circle';
      default:
        return 'lucide:info';
    }
  }

  function getIconColor() {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  }
</script>

<Dialog bind:open>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <div class="flex items-center gap-3">
        <Icon icon={getIcon()} class="h-6 w-6 {getIconColor()}" />
        <DialogTitle>{title}</DialogTitle>
      </div>
    </DialogHeader>
    <DialogDescription class="text-sm text-muted-foreground">
      {message}
    </DialogDescription>
    <DialogFooter>
      <Button onclick={handleClose}>
        OK
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>