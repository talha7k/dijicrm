import { writable } from "svelte/store";
import { Timestamp } from "firebase/firestore";
import type { GeneratedDocument, DocumentDelivery } from "$lib/types/document";

interface ClientDocumentsState {
  documents: GeneratedDocument[];
  deliveries: DocumentDelivery[];
  loading: boolean;
  error: string | null;
}

function createClientDocumentsStore() {
  const { subscribe, set, update } = writable<ClientDocumentsState>({
    documents: [],
    deliveries: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,
    set,
    update,

    // Load documents for the current client
    async loadClientDocuments(clientId: string): Promise<void> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Mock data - in real implementation, fetch from database
        const mockDocuments: GeneratedDocument[] = [
          {
            id: "doc-1",
            orderId: "order-1",
            clientId,
            templateId: "template-1",
            templateVersion: 1,
            htmlContent: "<div>Service Agreement Document</div>",
            pdfUrl: "https://example.com/docs/doc-1.pdf",
            status: "sent",
            data: { clientName: "John Doe", companyName: "ABC Corp" },
            generatedAt: Timestamp.now(),
            sentAt: Timestamp.now(),
            version: 1,
            metadata: {},
          },
          {
            id: "doc-2",
            orderId: "order-1",
            clientId,
            templateId: "template-2",
            templateVersion: 1,
            htmlContent: "<div>Invoice Document</div>",
            pdfUrl: "https://example.com/docs/doc-2.pdf",
            status: "viewed",
            data: { clientName: "John Doe", companyName: "ABC Corp" },
            generatedAt: Timestamp.now(),
            sentAt: Timestamp.now(),
            viewedAt: Timestamp.now(),
            version: 1,
            metadata: {},
          },
        ];

        const mockDeliveries: DocumentDelivery[] = [
          {
            id: "delivery-doc-1",
            documentId: "doc-1",
            recipientEmail: "john@example.com",
            status: "delivered",
            sentAt: Timestamp.now(),
            deliveredAt: Timestamp.now(),
            retryCount: 0,
            maxRetries: 3,
          },
          {
            id: "delivery-doc-2",
            documentId: "doc-2",
            recipientEmail: "john@example.com",
            status: "delivered",
            sentAt: Timestamp.now(),
            deliveredAt: Timestamp.now(),
            retryCount: 0,
            maxRetries: 3,
          },
        ];

        update((state) => ({
          ...state,
          documents: mockDocuments,
          deliveries: mockDeliveries,
          loading: false,
        }));
      } catch (error) {
        update((state) => ({
          ...state,
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to load documents",
        }));
      }
    },

    // Mark document as viewed
    markAsViewed(documentId: string): void {
      update((state) => ({
        ...state,
        documents: state.documents.map((doc: GeneratedDocument) =>
          doc.id === documentId
            ? { ...doc, status: "viewed", viewedAt: Timestamp.now() }
            : doc,
        ),
      }));
    },

    // Get documents by status
    getDocumentsByStatus(
      status: GeneratedDocument["status"],
    ): GeneratedDocument[] {
      // This would need to be implemented with proper state access
      return [];
    },

    // Get delivery status for a document
    getDocumentDelivery(documentId: string): DocumentDelivery | undefined {
      // This would need to be implemented with proper state access
      return undefined;
    },
  };
}

export const clientDocumentsStore = createClientDocumentsStore();
