import { writable, get } from "svelte/store";
import {
  Timestamp,
  collection,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "$lib/firebase";
import { userProfile } from "$lib/stores/user";
import type {
  GeneratedDocument,
  DocumentDelivery,
  ClientDocument,
} from "$lib/types/document";

interface ClientDocumentsState {
  documents: GeneratedDocument[];
  clientUploadedDocuments: ClientDocument[];
  deliveries: DocumentDelivery[];
  loading: boolean;
  error: string | null;
}

function createClientDocumentsStore() {
  const store = writable<ClientDocumentsState>({
    documents: [],
    clientUploadedDocuments: [],
    deliveries: [],
    loading: false,
    error: null,
  });

  let unsubscribeDocuments: (() => void) | null = null;
  let unsubscribeClientUploaded: (() => void) | null = null;
  let unsubscribeDeliveries: (() => void) | null = null;

  // Subscribe to user profile changes
  const unsubscribeUser = userProfile.subscribe(($userProfile) => {
    if ($userProfile.data && $userProfile.data.role === "client") {
      loadClientDocuments($userProfile.data.uid);
    } else {
      // Clean up listeners and clear data
      if (unsubscribeDocuments) {
        unsubscribeDocuments();
        unsubscribeDocuments = null;
      }
      if (unsubscribeClientUploaded) {
        unsubscribeClientUploaded();
        unsubscribeClientUploaded = null;
      }
      if (unsubscribeDeliveries) {
        unsubscribeDeliveries();
        unsubscribeDeliveries = null;
      }
      store.set({
        documents: [],
        clientUploadedDocuments: [],
        deliveries: [],
        loading: false,
        error: null,
      });
    }
  });

  function loadClientDocuments(clientId: string) {
    store.update((state) => ({ ...state, loading: true, error: null }));

    try {
      // Clean up previous listeners
      if (unsubscribeDocuments) {
        unsubscribeDocuments();
      }
      if (unsubscribeClientUploaded) {
        unsubscribeClientUploaded();
      }
      if (unsubscribeDeliveries) {
        unsubscribeDeliveries();
      }

      // Set up real-time listener for documents
      const documentsQuery = query(
        collection(db, "generatedDocuments"),
        where("clientId", "==", clientId),
      );

      unsubscribeDocuments = onSnapshot(
        documentsQuery,
        (querySnapshot) => {
          const documents: GeneratedDocument[] = [];

          querySnapshot.forEach((doc) => {
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

          store.update((state) => ({
            ...state,
            documents,
            loading: false,
          }));
        },
        (error) => {
          console.error("Error loading client documents:", error);
          store.update((state) => ({
            ...state,
            error: error.message,
            loading: false,
          }));
        },
      );

      // Set up real-time listener for client uploaded documents
      const clientUploadedQuery = query(
        collection(db, "clientDocuments"),
        where("clientId", "==", clientId),
      );

      unsubscribeClientUploaded = onSnapshot(
        clientUploadedQuery,
        (querySnapshot) => {
          const clientUploadedDocuments: ClientDocument[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            clientUploadedDocuments.push({
              id: doc.id,
              ...data,
              uploadedAt: data.uploadedAt,
            } as ClientDocument);
          });

          store.update((state) => ({
            ...state,
            clientUploadedDocuments,
          }));
        },
        (error) => {
          console.error("Error loading client uploaded documents:", error);
        },
      );

      // Set up real-time listener for deliveries (if needed)
      // Note: This would need to be based on actual client email or other identifier
      const deliveriesQuery = query(
        collection(db, "documentDeliveries"),
        where("recipientId", "==", clientId), // Assuming recipientId field exists
      );

      unsubscribeDeliveries = onSnapshot(
        deliveriesQuery,
        (querySnapshot) => {
          const deliveries: DocumentDelivery[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            deliveries.push({
              id: doc.id,
              ...data,
              sentAt: data.sentAt,
              deliveredAt: data.deliveredAt,
              lastRetryAt: data.lastRetryAt,
            } as DocumentDelivery);
          });

          store.update((state) => ({
            ...state,
            deliveries,
          }));
        },
        (error) => {
          console.error("Error loading document deliveries:", error);
        },
      );
    } catch (error) {
      console.error("Error setting up document listeners:", error);
      store.update((state) => ({
        ...state,
        error:
          error instanceof Error ? error.message : "Failed to load documents",
        loading: false,
      }));
    }
  }

  // Mark document as viewed
  async function markAsViewed(documentId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "generatedDocuments", documentId), {
        status: "viewed",
        viewedAt: Timestamp.now(),
      });

      // Update local state
      store.update((state) => ({
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
  }

  // Get documents by status
  function getDocumentsByStatus(
    status: GeneratedDocument["status"],
  ): GeneratedDocument[] {
    const currentState = get(store);
    return currentState.documents.filter((doc) => doc.status === status);
  }

  // Get delivery status for a document
  function getDocumentDelivery(
    documentId: string,
  ): DocumentDelivery | undefined {
    const currentState = get(store);
    return currentState.deliveries.find(
      (delivery) => delivery.documentId === documentId,
    );
  }

  // Get all documents (both generated and uploaded)
  function getAllDocuments(): Array<GeneratedDocument | ClientDocument> {
    const currentState = get(store);
    return [
      ...currentState.documents,
      ...currentState.clientUploadedDocuments,
    ].sort((a, b) => {
      // Sort by date (newest first)
      const dateA = "uploadedAt" in a ? a.uploadedAt : a.generatedAt;
      const dateB = "uploadedAt" in b ? b.uploadedAt : b.generatedAt;
      return dateB.toMillis() - dateA.toMillis();
    });
  }

  return {
    subscribe: store.subscribe,
    loadClientDocuments,
    markAsViewed,
    getDocumentsByStatus,
    getDocumentDelivery,
    getAllDocuments,
  };
}

export const clientDocumentsStore = createClientDocumentsStore();
