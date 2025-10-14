<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import { uploadFile, uploadMultipleFiles, type UploadResult } from '$lib/services/firebaseStorage';

  interface Props {
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    disabled?: boolean;
    buttonText?: string;
    dragText?: string;
    onUpload?: (results: UploadResult[]) => void;
    fileName?: string; // base name for uploaded files
  }

  let {
    accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    multiple = false,
    maxSize = 10, // 10MB
    disabled = false,
    buttonText = "Choose Files",
    dragText = "Drag and drop files here, or click to browse",
    onUpload,
    fileName = "uploaded-file"
  }: Props = $props();

  const dispatch = createEventDispatcher();

  let isDragging = $state(false);
  let isUploading = $state(false);
  let uploadProgress = $state(0);
  let files = $state<File[]>([]);
  let fileInput: HTMLInputElement;

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (!disabled) {
      isDragging = true;
    }
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    if (disabled) return;

    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    handleFiles(droppedFiles);
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const selectedFiles = Array.from(target.files || []);
    handleFiles(selectedFiles);
  }

  function handleFiles(newFiles: File[]) {
    if (multiple) {
      files = [...files, ...newFiles];
    } else {
      files = [newFiles[0]];
    }
  }

  async function uploadFiles() {
    if (files.length === 0 || isUploading) return;

    isUploading = true;
    uploadProgress = 0;

    try {
      const results = await uploadMultipleFiles(files, fileName, {
        maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
        allowedTypes: accept.split(',').map(type => type.trim()),
      });

      uploadProgress = 100;

      onUpload?.(results);
      dispatch('upload', { results, files });

      // Clear files after successful upload
      files = [];
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      dispatch('error', { error: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      isUploading = false;
    }
  }

  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
</script>

<div class="w-full">
  <!-- File Input (hidden) -->
  <input
    bind:this={fileInput}
    type="file"
    {accept}
    {multiple}
    class="hidden"
    onchange={handleFileSelect}
    disabled={disabled || isUploading}
  />

  <!-- Drop Zone -->
  <div
    class="border-2 border-dashed rounded-lg p-6 text-center transition-colors
           {isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
           {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={() => !disabled && !isUploading && fileInput?.click()}
    onkeydown={(e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
        e.preventDefault();
        fileInput?.click();
      }
    }}
    role="button"
    tabindex={disabled || isUploading ? -1 : 0}
    aria-label="File upload area. {dragText}"
  >
    <Icon
      icon={isUploading ? "lucide:loader-2" : "lucide:upload"}
      class="h-8 w-8 mx-auto mb-2 text-muted-foreground
             {isUploading ? 'animate-spin' : ''}"
    />
    <p class="text-sm text-muted-foreground mb-2">
      {isUploading ? `Uploading... ${uploadProgress}%` : dragText}
    </p>
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || isUploading}
      onclick={(e) => {
        e.stopPropagation();
        fileInput?.click();
      }}
    >
      {buttonText}
    </Button>
  </div>

  <!-- Selected Files -->
  {#if files.length > 0}
    <div class="mt-4 space-y-2">
      <h4 class="text-sm font-medium">Selected Files:</h4>
      {#each files as file, index}
        <div class="flex items-center justify-between p-2 border rounded-lg">
          <div class="flex items-center gap-2">
            <Icon icon="lucide:file" class="h-4 w-4 text-muted-foreground" />
            <div>
              <p class="text-sm font-medium">{file.name}</p>
              <p class="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onclick={() => removeFile(index)}
            disabled={isUploading}
          >
            <Icon icon="lucide:x" class="h-4 w-4" />
          </Button>
        </div>
      {/each}

      <!-- Upload Button -->
      <div class="flex gap-2 pt-2">
        <Button
          onclick={uploadFiles}
          disabled={isUploading || files.length === 0}
          class="flex-1"
        >
          {#if isUploading}
            <Icon icon="lucide:loader-2" class="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          {:else}
            <Icon icon="lucide:upload" class="h-4 w-4 mr-2" />
            Upload {files.length} file{files.length > 1 ? 's' : ''}
          {/if}
        </Button>
      </div>
    </div>
  {/if}
</div>