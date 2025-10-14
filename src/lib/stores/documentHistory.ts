import { writable } from "svelte/store";
import { Timestamp } from "firebase/firestore";
import type { GeneratedDocument } from "$lib/types/document";

interface DocumentHistoryState {
  documents: GeneratedDocument[];
  loading: boolean;
  error: string | null;
}

function createDocumentHistoryStore() {
  const { subscribe, set, update } = writable<DocumentHistoryState>({
    documents: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,
    set,
    update,

    // Load document history for an order
    async loadDocumentHistory(orderId: string) {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Mock data - replace with Firebase query
        const mockDocuments: GeneratedDocument[] = [
          {
            id: "doc-1",
            orderId,
            clientId: "client-1",
            templateId: "template-1",
            templateVersion: 1,
            htmlContent: "<div>Generated document content</div>",
            pdfUrl: "https://example.com/doc-1.pdf",
            status: "completed",
            data: { clientName: "John Doe", amount: 1000 },
            generatedAt: Timestamp.fromDate(new Date("2024-01-15")),
            sentAt: Timestamp.fromDate(new Date("2024-01-15")),
            viewedAt: Timestamp.fromDate(new Date("2024-01-16")),
            completedAt: Timestamp.fromDate(new Date("2024-01-20")),
            submittedFiles: [],
            metadata: {
              fileSize: 245760,
              pageCount: 2,
              checksum: "abc123",
            },
            version: 1,
          },
          {
            id: "doc-2",
            orderId,
            clientId: "client-1",
            templateId: "template-1",
            templateVersion: 2,
            htmlContent: "<div>Updated document content</div>",
            pdfUrl: "https://example.com/doc-2.pdf",
            status: "sent",
            data: { clientName: "John Doe", amount: 1200 },
            generatedAt: Timestamp.fromDate(new Date("2024-01-25")),
            sentAt: Timestamp.fromDate(new Date("2024-01-25")),
            submittedFiles: [],
            metadata: {
              fileSize: 267890,
              pageCount: 2,
              checksum: "def456",
            },
            version: 2,
            previousVersionId: "doc-1",
            changes: [
              "Updated amount from $1000 to $1200",
              "Added payment terms",
            ],
          },
        ];

        set({
          documents: mockDocuments,
          loading: false,
          error: null,
        });
      } catch (error) {
        set({
          documents: [],
          loading: false,
          error: "Failed to load document history",
        });
      }
    },

    // Create a new version of a document
    async createDocumentVersion(
      previousDocument: GeneratedDocument,
      updates: Partial<GeneratedDocument>,
    ): Promise<GeneratedDocument> {
      const newVersion: GeneratedDocument = {
        ...previousDocument,
        ...updates,
        id: `doc-${Date.now()}`,
        version: previousDocument.version + 1,
        previousVersionId: previousDocument.id,
        generatedAt: Timestamp.now(),
        changes: updates.changes || [],
      };

      update((state) => ({
        ...state,
        documents: [...state.documents, newVersion],
      }));

      return newVersion;
    },

    // Get document versions for comparison
    getDocumentVersions(documentId: string): GeneratedDocument[] {
      // In a real implementation, this would traverse the version chain
      return []; // Mock implementation
    },

    // Compare two document versions
    compareVersions(version1: GeneratedDocument, version2: GeneratedDocument) {
      const changes: Array<{
        field: string;
        oldValue: any;
        newValue: any;
      }> = [];

      // Compare data fields
      const allKeys = new Set([
        ...Object.keys(version1.data),
        ...Object.keys(version2.data),
      ]);

      for (const key of allKeys) {
        const oldValue = version1.data[key];
        const newValue = version2.data[key];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            field: key,
            oldValue,
            newValue,
          });
        }
      }

      return changes;
    },

    // Update document status
    async updateDocumentStatus(
      documentId: string,
      status: GeneratedDocument["status"],
    ) {
      update((state) => ({
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                status,
                ...(status === "sent" &&
                  !doc.sentAt && { sentAt: Timestamp.now() }),
                ...(status === "viewed" &&
                  !doc.viewedAt && { viewedAt: Timestamp.now() }),
                ...(status === "completed" &&
                  !doc.completedAt && { completedAt: Timestamp.now() }),
              }
            : doc,
        ),
      }));
    },
  };
}

export const documentHistoryStore = createDocumentHistoryStore();
