<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { toast } from 'svelte-sonner';
  import { clientDocumentsStore } from '$lib/stores/clientDocuments';
  import { companyContext } from '$lib/stores/companyContext';
  import { auth } from '$lib/firebase';
  import { get } from 'svelte/store';
  import type { ClientDocument } from '$lib/types/document';
  import { deleteObject, getDownloadURL, ref, uploadBytes, getStorage } from 'firebase/storage';
  import { db } from '$lib/firebase';

  // Initialize Firebase Storage
  const storage = getStorage();
  import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';

  interface Props {
    clientId: string;
  }

  let { clientId }: Props = $props();

  let documents = $state<ClientDocument[]>([]);
  let loading = $state(false);
  let showUploadDialog = $state(false);
  let showDeleteDialog = $state(false);
  let documentToDelete = $state<ClientDocument | null>(null);

  // Upload form state
  let selectedFile = $state<File | null>(null);
  let documentName = $state('');
  let documentDescription = $state('');
  let uploading = $state(false);

  // Load client private documents on mount
  $effect(() => {
    clientDocumentsStore.loadClientPrivateDocuments(clientId);
  });

  // Subscribe to client documents store
  $effect(() => {
    const unsubscribe = clientDocumentsStore.subscribe((state) => {
      documents = state.clientUploadedDocuments.filter(doc => doc.clientId === clientId);
      loading = state.loading;
    });

    return unsubscribe;
  });

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(date: any): string {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  }

  function getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return 'lucide:file-text';
    if (fileType.includes('image')) return 'lucide:image';
    if (fileType.includes('word') || fileType.includes('document')) return 'lucide:file-text';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'lucide:file-spreadsheet';
    return 'lucide:file';
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      selectedFile = file;
      // Auto-fill name if empty
      if (!documentName.trim()) {
        documentName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      }
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!documentName.trim()) {
      toast.error('Please provide a document name');
      return;
    }

    const companyData = get(companyContext);
    const userId = auth.currentUser?.uid;

    if (!companyData?.data?.companyId || !userId) {
      toast.error('Authentication required');
      return;
    }

    uploading = true;

    try {
      // Upload file to Firebase Storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, `clients/${companyData.data.companyId}/${clientId}/private/${fileName}`);

      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Create document record in Firestore
      const documentData: any = {
        companyId: companyData.data.companyId,
        clientId,
        name: documentName.trim(),
        originalFileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileUrl: downloadURL,
        filePath: snapshot.ref.fullPath,
        fileType: selectedFile.type,
        uploadedAt: new Date(),
        uploadedBy: userId,
        type: 'custom' as const,
        status: 'uploaded' as const,
      };

      // Only include description if it has a value
      if (documentDescription.trim()) {
        documentData.description = documentDescription.trim();
      }

      await addDoc(collection(db, 'clientDocuments'), documentData);

      toast.success('Document uploaded successfully');

      // Reset form
      selectedFile = null;
      documentName = '';
      documentDescription = '';
      showUploadDialog = false;

    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      uploading = false;
    }
  }

  function handleDeleteClick(document: ClientDocument) {
    documentToDelete = document;
    showDeleteDialog = true;
  }

  async function handleDeleteConfirm() {
    if (!documentToDelete) return;

    try {
      // Delete from Firebase Storage
      const storageRef = ref(storage, documentToDelete.filePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'clientDocuments', documentToDelete.id));

      toast.success('Document deleted successfully');
      showDeleteDialog = false;
      documentToDelete = null;

    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  }

  async function handleDownload(doc: ClientDocument) {
    try {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.originalFileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  }

  function resetUploadForm() {
    selectedFile = null;
    documentName = '';
    documentDescription = '';
  }
</script>

<div class="space-y-6">
  <!-- Header with upload button -->
  <div class="flex justify-between items-center">
    <div>
      <h3 class="text-lg font-medium">Private Documents</h3>
      <p class="text-sm text-muted-foreground">
        Upload and manage private documents for this client
      </p>
    </div>
    <Button onclick={() => showUploadDialog = true}>
      <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
      </svg>
      Upload Document
    </Button>
  </div>

  <!-- Documents list -->
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span class="ml-2">Loading documents...</span>
    </div>
  {:else if documents.length === 0}
    <Card.Root>
      <Card.Content class="text-center py-12">
        <svg class="h-12 w-12 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
        <h3 class="text-lg font-medium mb-2">No private documents</h3>
        <p class="text-muted-foreground mb-4">
          Upload documents that are specific to this client for private storage and management.
        </p>
        <Button onclick={() => showUploadDialog = true} variant="outline">
          Upload First Document
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-4">
      {#each documents as document (document.id)}
        <Card.Root>
          <Card.Content class="p-4">
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-3">
                <div class="p-2 bg-muted rounded-lg">
                  <svg class="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h4 class="font-medium">{document.name}</h4>
                  <p class="text-sm text-muted-foreground">{document.originalFileName}</p>
                  {#if document.description}
                    <p class="text-sm text-muted-foreground mt-1">{document.description}</p>
                  {/if}
                  <div class="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span>Uploaded {formatDate(document.uploadedAt)}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => handleDownload(document)}
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => handleDeleteClick(document)}
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>

<!-- Upload Dialog -->
<Dialog.Root bind:open={showUploadDialog} onOpenChange={(open) => {
  if (!open) resetUploadForm();
}}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Upload Private Document</Dialog.Title>
      <Dialog.Description>
        Upload a document that will be stored privately for this client.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="file">Select File</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
          onchange={handleFileSelect}
          disabled={uploading}
        />
        {#if selectedFile}
          <p class="text-sm text-muted-foreground">
            Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        {/if}
      </div>

      <div class="space-y-2">
        <Label for="name">Document Name</Label>
        <Input
          id="name"
          bind:value={documentName}
          placeholder="Enter a name for this document"
          disabled={uploading}
        />
      </div>

      <div class="space-y-2">
        <Label for="description">Description (Optional)</Label>
        <Textarea
          id="description"
          bind:value={documentDescription}
          placeholder="Add a description for this document"
          rows={3}
          disabled={uploading}
        />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => showUploadDialog = false} disabled={uploading}>
        Cancel
      </Button>
      <Button onclick={handleUpload} disabled={uploading || !selectedFile || !documentName.trim()}>
        {#if uploading}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Uploading...
        {:else}
          Upload Document
        {/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={showDeleteDialog}>
  <Dialog.Content class="sm:max-w-[400px]">
    <Dialog.Header>
      <Dialog.Title>Delete Document</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete "{documentToDelete?.name}"? This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => showDeleteDialog = false}>
        Cancel
      </Button>
      <Button variant="destructive" onclick={handleDeleteConfirm}>
        Delete Document
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>