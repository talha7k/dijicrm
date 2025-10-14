<script lang="ts">
  import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';

  interface Props {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'warning' | 'danger';
    onconfirm?: () => void;
    oncancel?: () => void;
  }

  let { open = $bindable(false), title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning', onconfirm, oncancel }: Props = $props();

  function handleConfirm() {
    open = false;
    onconfirm?.();
  }

  function handleCancel() {
    open = false;
    oncancel?.();
  }

  function getIcon() {
    switch (type) {
      case 'warning':
        return 'lucide:alert-triangle';
      case 'danger':
        return 'lucide:alert-circle';
      default:
        return 'lucide:help-circle';
    }
  }

  function getIconColor() {
    switch (type) {
      case 'warning':
        return 'text-yellow-500';
      case 'danger':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  }

  function getConfirmButtonVariant() {
    switch (type) {
      case 'danger':
        return 'destructive';
      default:
        return 'default';
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
      <Button variant="outline" onclick={handleCancel}>
        {cancelText}
      </Button>
      <Button variant={getConfirmButtonVariant()} onclick={handleConfirm}>
        {confirmText}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>