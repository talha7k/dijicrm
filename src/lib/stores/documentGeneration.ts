import { writable } from "svelte/store";
import { authenticatedFetch } from "$lib/utils/authUtils";
import { toast } from "svelte-sonner";

interface DocumentGenerationState {
  loading: boolean;
  error: string | null;
  result: {
    format: "html" | "pdf";
    content: string;
    templateId: string;
    generatedAt: string;
    fileName?: string;
  } | null;
}

function createDocumentGenerationStore() {
  const { subscribe, set, update } = writable<DocumentGenerationState>({
    loading: false,
    error: null,
    result: null,
  });

  return {
    subscribe,
    set,
    update,

    async generateDocument(
      templateId: string,
      data: Record<string, any>,
      format: "html" | "pdf" = "pdf",
      companyId?: string,
    ) {
      update((state) => ({ ...state, loading: true, error: null }));

      // Show loading toast
      const loadingToast = toast.loading(
        format === "pdf"
          ? "Generating PDF document..."
          : "Generating document preview...",
        {
          description: "This may take a few moments",
        },
      );

      try {
        const response = await authenticatedFetch("/api/documents/generate", {
          method: "POST",
          body: JSON.stringify({
            templateId,
            data,
            format,
            companyId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to generate document");
        }

        const result = await response.json();

        update((state) => ({
          ...state,
          loading: false,
          result: result,
        }));

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success(
          format === "pdf"
            ? "Document generated successfully!"
            : "Preview generated successfully!",
        );

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));

        // Dismiss loading toast and show error
        toast.dismiss(loadingToast);
        toast.error("Failed to generate document", {
          description: errorMessage,
        });

        throw error;
      }
    },

    async previewDocument(
      templateId: string,
      data: Record<string, any>,
      companyId?: string,
    ) {
      return this.generateDocument(templateId, data, "html", companyId);
    },

    clearResult() {
      update((state) => ({ ...state, result: null, error: null }));
    },
  };
}

export const documentGenerationStore = createDocumentGenerationStore();
