<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import Button from '$lib/components/ui/button/button.svelte';

  interface EmailRecord {
    id: string;
    subject: string;
    sentDate: Date;
    status: 'sent' | 'delivered' | 'opened' | 'bounced';
    recipient: string;
    opened?: boolean;
    preview?: string;
    attachments?: Array<{
      filename: string;
      size: number;
      type: string;
      documentType?: string;
    }>;
  }

  interface Props {
    email: EmailRecord;
    isExpanded: boolean;
    onToggle: () => void;
    onResend?: (emailId: string) => void;
    onViewDetails?: (email: EmailRecord) => void;
  }

  let { email, isExpanded, onToggle, onResend, onViewDetails }: Props = $props();

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

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<div class="border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md bg-card">
  <!-- Summary Card (Always Visible) -->
  <div
    class="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
    role="button"
    tabindex="0"
    onclick={onToggle}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onToggle();
        e.preventDefault();
      }
    }}
  >
    <div class="flex items-start justify-between">
      <div class="flex items-start space-x-3 flex-1 min-w-0">
        <div class="flex-shrink-0 mt-1">
          <div class="relative">
            <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getStatusIcon(email.status)}/>
            </svg>
            {#if email.opened}
              <div class="absolute -bottom-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
            {/if}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2">
            <h4 class="font-medium text-sm truncate text-foreground">{email.subject}</h4>
            {#if email.attachments && email.attachments.length > 0}
              <Badge variant="secondary" class="text-xs">
                {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
              </Badge>
            {/if}
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            To: {email.recipient} • {formatDate(email.sentDate)}
            {#if email.opened}
              <span class="ml-2 text-green-600 font-medium">• Opened</span>
            {/if}
          </p>
          {#if email.preview && !isExpanded}
            <p class="text-sm text-muted-foreground mt-2">
              {email.preview.slice(0, 150)}{email.preview.length > 150 ? '...' : ''}
            </p>
          {/if}
        </div>
      </div>
      <div class="flex items-center space-x-2 flex-shrink-0">
        <Badge variant={getStatusBadge(email.status)} class="text-xs">
          {email.status}
        </Badge>
        <div class="flex items-center space-x-1">
          <svg
            class="h-4 w-4 text-muted-foreground transition-transform duration-200"
            class:rotate-180={isExpanded}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
          {#if onResend && email.status === 'bounced'}
            <Button
              variant="ghost"
              size="sm"
              onclick={(e) => {
                e.stopPropagation();
                onResend(email.id);
              }}
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
  </div>

  <!-- Expanded Details (Visible when expanded) -->
  {#if isExpanded}
    <div class="border-t bg-muted/20 p-4 space-y-4">
      <!-- Email Content Preview -->
      {#if email.preview}
        <div>
          <h5 class="text-sm font-medium mb-2 text-foreground">Message Preview</h5>
          <div class="text-sm text-muted-foreground bg-background p-3 rounded border max-h-32 overflow-y-auto">
            <pre class="whitespace-pre-wrap font-sans">{email.preview}</pre>
          </div>
        </div>
      {/if}

      <!-- Attachments Details -->
      {#if email.attachments && email.attachments.length > 0}
        <div>
          <h5 class="text-sm font-medium mb-2 text-foreground">Attachments</h5>
          <div class="space-y-2">
            {#each email.attachments as attachment}
              <div class="flex items-center justify-between p-2 bg-background rounded border">
                <div class="flex items-center space-x-2">
                  <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <div>
                    <p class="text-sm font-medium text-foreground">{attachment.filename}</p>
                    <p class="text-xs text-muted-foreground">
                      {attachment.documentType || 'Document'} • {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" class="text-xs">
                  {attachment.type || 'application/pdf'}
                </Badge>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Email Metadata -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="font-medium text-foreground">Status:</span>
          <div class="flex items-center space-x-2 mt-1">
            <Badge variant={getStatusBadge(email.status)} class="text-xs">
              {email.status}
            </Badge>
            {#if email.opened}
              <span class="text-xs text-green-600">✓ Opened by recipient</span>
            {/if}
          </div>
        </div>
        <div>
          <span class="font-medium text-foreground">Sent:</span>
          <p class="text-muted-foreground">{formatDate(email.sentDate)}</p>
        </div>
        <div>
          <span class="font-medium text-foreground">Recipient:</span>
          <p class="text-muted-foreground">{email.recipient}</p>
        </div>
        <div>
          <span class="font-medium text-foreground">Email ID:</span>
          <p class="text-muted-foreground font-mono text-xs">{email.id.slice(-8)}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-2 pt-2 border-t">
        {#if onViewDetails}
          <Button
            variant="outline"
            size="sm"
            onclick={() => onViewDetails(email)}
          >
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            View Full Details
          </Button>
        {/if}
        {#if onResend && email.status === 'bounced'}
          <Button
            variant="outline"
            size="sm"
            onclick={() => onResend(email.id)}
            class="text-orange-600 border-orange-600 hover:bg-orange-50"
          >
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Resend Email
          </Button>
        {/if}
      </div>
    </div>
  {/if}
</div>