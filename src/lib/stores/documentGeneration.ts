import { writable } from "svelte/store";

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

      try {
        const response = await fetch("/api/documents/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));

        throw error;
      }
    },

    async previewDocument(templateId: string, data: Record<string, any>) {
      return this.generateDocument(templateId, data, "html");
    },

    clearResult() {
      update((state) => ({ ...state, result: null, error: null }));
    },
  };
}

export const documentGenerationStore = createDocumentGenerationStore();
