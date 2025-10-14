import { writable } from "svelte/store";
import {
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "$lib/firebase";
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
        // Query Firebase for documents
        const documentsQuery = query(
          collection(db, "generatedDocuments"),
          where("clientId", "==", clientId),
        );

        const documentsSnapshot = await getDocs(documentsQuery);
        const documents: GeneratedDocument[] = [];

        documentsSnapshot.forEach((doc) => {
          const data = doc.data();
          documents.push({
            id: doc.id,
            ...data,
            generatedAt: data.generatedAt,
            sentAt: data.sentAt,
            viewedAt: data.viewedAt,
            completedAt: data.completedAt,
          } as GeneratedDocument);
        });

        // Query Firebase for deliveries
        const deliveriesQuery = query(
          collection(db, "documentDeliveries"),
          where("recipientEmail", "==", "placeholder"), // This would need to be based on client email
        );

        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        const deliveries: DocumentDelivery[] = [];

        deliveriesSnapshot.forEach((doc) => {
          const data = doc.data();
          deliveries.push({
            id: doc.id,
            ...data,
            sentAt: data.sentAt,
            deliveredAt: data.deliveredAt,
            lastRetryAt: data.lastRetryAt,
          } as DocumentDelivery);
        });

        update((state) => ({
          ...state,
          documents,
          deliveries,
          loading: false,
        }));
      } catch (error) {
        console.error("Error loading client documents:", error);
        update((state) => ({
          ...state,
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to load documents",
        }));
      }
    },

    // Mark document as viewed
    async markAsViewed(documentId: string): Promise<void> {
      try {
        await updateDoc(doc(db, "generatedDocuments", documentId), {
          status: "viewed",
          viewedAt: Timestamp.now(),
        });

        // Update local state
        update((state) => ({
          ...state,
          documents: state.documents.map((doc: GeneratedDocument) =>
            doc.id === documentId
              ? { ...doc, status: "viewed", viewedAt: Timestamp.now() }
              : doc,
          ),
        }));
      } catch (error) {
        console.error("Error marking document as viewed:", error);
      }
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
