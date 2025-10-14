<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import DashboardLayout from '$lib/components/shared/dashboard-layout.svelte';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { requireClient } from '$lib/utils/auth';
  import { formatDateShort } from '$lib/utils';
  import { clientDocumentsStore } from '$lib/stores/clientDocuments';
  import type { GeneratedDocument } from '$lib/types/document';

  let mounted = $state(false);
  let documents = clientDocumentsStore;

  onMount(() => {
    mounted = true;
    // Check if user has client role
    if (!requireClient()) {
      return; // Will redirect
    }

    // Load client documents
    documents.loadClientDocuments("client-1"); // TODO: Get from auth context
  });

  function getDocumentStatusColor(status: GeneratedDocument['status']) {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  function viewDocument(document: GeneratedDocument) {
    documents.markAsViewed(document.id);
    // TODO: Open document viewer modal or navigate to document detail page
    console.log("Viewing document:", document.id);
  }
</script>

{#if mounted}
  <DashboardLayout title="My Documents" description="View and manage documents sent to you">
    <div class="space-y-6">
      <!-- Documents List -->
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>Documents that have been sent to you for review and completion</CardDescription>
        </CardHeader>
        <CardContent>
          {#if $documents.loading}
            <div class="text-center py-8">Loading documents...</div>
          {:else if $documents.documents && $documents.documents.length > 0}
            <div class="space-y-4">
              {#each $documents.documents as document}
                <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div class="space-y-1 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-medium">Document {document.id}</p>
                      <Badge class={getDocumentStatusColor(document.status)}>
                        {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                      </Badge>
                    </div>
                    <p class="text-sm text-muted-foreground">
                      {document.data.clientName} - {document.data.companyName}
                    </p>
                    <div class="flex gap-4 text-xs text-muted-foreground">
                      <span>Sent: {formatDateShort(document.sentAt)}</span>
                      {#if document.viewedAt}
                        <span>Viewed: {formatDateShort(document.viewedAt)}</span>
                      {/if}
                      {#if document.completedAt}
                        <span>Completed: {formatDateShort(document.completedAt)}</span>
                      {/if}
                    </div>
                  </div>
                  <div class="flex gap-2">
                    {#if document.pdfUrl}
                      <a href={document.pdfUrl} target="_blank" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                        Download PDF
                      </a>
                    {/if}
                    <Button
                      variant="default"
                      size="sm"
                      onclick={() => viewDocument(document)}
                    >
                      {document.status === 'sent' ? 'View Document' : 'Review Document'}
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-8 text-muted-foreground">
              <p class="text-lg mb-2">No documents found</p>
              <p>You haven't received any documents yet.</p>
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Document Statistics -->
      {#if $documents.documents && $documents.documents.length > 0}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent class="pt-6">
              <div class="text-2xl font-bold">{$documents.documents.length}</div>
              <p class="text-xs text-muted-foreground">Total Documents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="pt-6">
              <div class="text-2xl font-bold">
                {$documents.documents.filter((d: GeneratedDocument) => d.status === 'sent').length}
              </div>
              <p class="text-xs text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="pt-6">
              <div class="text-2xl font-bold">
                {$documents.documents.filter((d: GeneratedDocument) => d.status === 'viewed').length}
              </div>
              <p class="text-xs text-muted-foreground">Viewed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="pt-6">
              <div class="text-2xl font-bold">
                {$documents.documents.filter((d: GeneratedDocument) => d.status === 'completed').length}
              </div>
              <p class="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>
      {/if}
    </div>
  </DashboardLayout>
{/if}