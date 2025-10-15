<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { toast } from 'svelte-sonner';
  import { uploadFile } from '$lib/services/firebaseStorage';
  import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import { companyContext } from '$lib/stores/companyContext';
  import { auth } from '$lib/firebase';
  import { get } from 'svelte/store';

  interface Props {
    clientId: string;
    open: boolean;
    onUploadComplete?: (document: any) => void;
  }

  let { clientId, open = $bindable(false), onUploadComplete }: Props = $props();

  let fileInput = $state<HTMLInputElement>();
  let selectedFile = $state<File | null>(null);
  let documentName = $state('');
  let documentCategory = $state('');
  let description = $state('');
  let loading = $state(false);

  const categories = [
    'Contract',
    'Agreement',
    'Invoice',
    'Proposal',
    'Report',
    'Other',
  ];

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      selectedFile = file;
      documentName = documentName || file.name.replace('.pdf', '');
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }

    if (!documentName.trim()) {
      toast.error('Please enter a document name');
      return;
    }

    loading = true;

    try {
      // Get current company context
      const companyContextValue = get(companyContext);
      if (!companyContextValue.data) {
        toast.error('Company context not available');
        return;
      }

      const companyId = companyContextValue.data.companyId;
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast.error('User not authenticated');
        return;
      }

      // Upload file to Firebase Storage
      const uploadResult = await uploadFile(
        selectedFile,
        documentName,
        {
          maxSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: ['application/pdf'],
          path: `companies/${companyId}/clients/${clientId}/documents`
        }
      );

      if (!uploadResult.success) {
        toast.error(uploadResult.error || 'Failed to upload file');
        return;
      }

      // Save document metadata to Firestore
      const documentData = {
        companyId,
        clientId,
        name: documentName.trim(),
        originalFileName: selectedFile.name,
        category: documentCategory || null,
        description: description.trim() || null,
        fileSize: selectedFile.size,
        fileUrl: uploadResult.url,
        filePath: uploadResult.path,
        fileType: selectedFile.type,
        uploadedAt: serverTimestamp(),
        uploadedBy: userId,
        type: 'custom',
        status: 'uploaded',
      };

      const docRef = await addDoc(collection(db, 'clientDocuments'), documentData);

      const uploadedDocument = {
        id: docRef.id,
        ...documentData,
        uploadedAt: new Date(), // For local state
      };

      toast.success('PDF uploaded successfully');

      // Reset form
      selectedFile = null;
      documentName = '';
      documentCategory = '';
      description = '';
      if (fileInput) fileInput.value = '';

      open = false;

      onUploadComplete?.(uploadedDocument);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Failed to upload PDF');
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    selectedFile = null;
    documentName = '';
    documentCategory = '';
    description = '';
    if (fileInput) fileInput.value = '';
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Upload PDF Document</Dialog.Title>
      <Dialog.Description>
        Upload a PDF document for this client. Maximum file size: 10MB.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <!-- File Upload -->
      <div class="space-y-2">
        <Label for="pdf-file">PDF File *</Label>
        <div class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          {#if selectedFile}
            <div class="space-y-2">
              <svg class="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-sm font-medium">{selectedFile.name}</p>
              <p class="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                variant="outline"
                size="sm"
                onclick={() => fileInput?.click()}
              >
                Choose Different File
              </Button>
            </div>
          {:else}
            <div class="space-y-2">
              <svg class="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              <p class="text-sm font-medium">Drop PDF here or click to browse</p>
              <p class="text-xs text-muted-foreground">PDF files only, up to 10MB</p>
              <Button
                variant="outline"
                onclick={() => fileInput?.click()}
              >
                Choose File
              </Button>
            </div>
          {/if}
        </div>
        <input
          bind:this={fileInput}
          type="file"
          id="pdf-file"
          accept=".pdf"
          class="hidden"
          onchange={handleFileSelect}
        />
      </div>

      <!-- Document Details -->
      <div class="space-y-2">
        <Label for="doc-name">Document Name *</Label>
        <Input
          id="doc-name"
          bind:value={documentName}
          placeholder="Enter document name"
        />
      </div>

      <div class="space-y-2">
        <Label for="category">Category (Optional)</Label>
        <Select.Root type="single" bind:value={documentCategory}>
          <Select.Trigger>
            {categories.find(cat => cat === documentCategory) || "Select category"}
          </Select.Trigger>
          <Select.Content>
            {#each categories as category}
              <Select.Item value={category}>
                {category}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div class="space-y-2">
        <Label for="description">Description (Optional)</Label>
        <Textarea
          id="description"
          bind:value={description}
          placeholder="Brief description of the document..."
          rows={3}
        />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={handleCancel} disabled={loading}>
        Cancel
      </Button>
      <Button onclick={handleUpload} disabled={loading || !selectedFile || !documentName.trim()}>
        {loading ? 'Uploading...' : 'Upload PDF'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>