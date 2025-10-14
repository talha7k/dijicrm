<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import Button from '$lib/components/ui/button/button.svelte';

  interface EmailRecord {
    id: string;
    subject: string;
    sentDate: Date;
    status: 'sent' | 'delivered' | 'opened' | 'bounced';
    recipient: string;
    opened?: boolean;
    preview?: string;
  }

  interface Props {
    emails: EmailRecord[];
    loading?: boolean;
    onResend?: (emailId: string) => void;
    onViewDetails?: (email: EmailRecord) => void;
  }

  let { emails, loading = false, onResend, onViewDetails }: Props = $props();

  function getStatusBadge(status: string) {
    const variants = {
      sent: 'secondary',
      delivered: 'default',
      opened: 'default',
      bounced: 'destructive',
    } as const;

    return variants[status as keyof typeof variants] || 'outline';
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'sent':
        return 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8';
      case 'delivered':
        return 'M5 13l4 4L19 7';
      case 'opened':
        return 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z';
      case 'bounced':
        return 'M6 18L18 6M6 6l12 12';
      default:
        return 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8';
    }
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Email History</Card.Title>
    <Card.Description>
      All emails sent to this client
    </Card.Description>
  </Card.Header>
  <Card.Content>
    {#if loading}
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span class="ml-2 text-sm">Loading emails...</span>
      </div>
    {:else if emails.length === 0}
      <div class="text-center py-8 text-muted-foreground">
        <svg class="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        <p>No emails found for this client.</p>
        <p class="text-sm">Emails sent to this client will appear here.</p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each emails as email}
          <div class="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div class="flex items-start space-x-3 flex-1 min-w-0">
              <div class="flex-shrink-0 mt-1">
                <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getStatusIcon(email.status)}/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-sm truncate">{email.subject}</h4>
                <p class="text-xs text-muted-foreground">
                  To: {email.recipient} • {formatDate(email.sentDate)}
                  {#if email.opened}
                    <span class="ml-2 text-green-600">• Opened</span>
                  {/if}
                </p>
                {#if email.preview}
                  <p class="text-sm text-muted-foreground mt-1 overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                    {email.preview}
                  </p>
                {/if}
              </div>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0">
              <Badge variant={getStatusBadge(email.status)} class="text-xs">
                {email.status}
              </Badge>
              <div class="flex space-x-1">
                {#if onViewDetails}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => onViewDetails(email)}
                    class="h-8 w-8 p-0"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </Button>
                {/if}
                {#if onResend && email.status === 'bounced'}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => onResend(email.id)}
                    class="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  </Button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>

