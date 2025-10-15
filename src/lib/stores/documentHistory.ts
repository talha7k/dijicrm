import { writable } from "svelte/store";
import {
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "$lib/firebase";
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
        // Query Firebase for documents related to this order
        const documentsQuery = query(
          collection(db, "documents"),
          where("orderId", "==", orderId),
          orderBy("generatedAt", "desc"),
        );

        const querySnapshot = await getDocs(documentsQuery);
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

        set({
          documents,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error loading document history:", error);
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
