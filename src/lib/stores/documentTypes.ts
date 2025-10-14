import { writable } from "svelte/store";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "$lib/firebase";

export interface DocumentType {
  id: string;
  companyId: string;
  name: string; // e.g., "Invoice", "Contract", "Proposal"
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function createDocumentTypesStore() {
  const { subscribe, set, update } = writable<{
    data: DocumentType[] | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  return {
    subscribe,
    set,
    update,

    loadDocumentTypes: async (companyId: string) => {
      update((store) => ({ ...store, loading: true, error: null }));

      try {
        // Query Firebase for document types
        const typesQuery = query(
          collection(db, "documentTypes"),
          where("companyId", "==", companyId),
        );

        const querySnapshot = await getDocs(typesQuery);
        const types: DocumentType[] = [];

        querySnapshot.forEach((doc) => {
          types.push({ id: doc.id, ...doc.data() } as DocumentType);
        });

        set({ data: types, loading: false, error: null });
      } catch (error) {
        console.error("Error loading document types:", error);
        set({
          data: null,
          loading: false,
          error: "Failed to load document types",
        });
      }
    },

    createDocumentType: async (
      type: Omit<DocumentType, "id" | "createdAt" | "updatedAt">,
    ) => {
      update((store) => ({ ...store, loading: true }));

      try {
        const newType: DocumentType = {
          ...type,
          id: `type-${Date.now()}`,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await setDoc(doc(db, "documentTypes", newType.id), newType);

        update((store) => ({
          ...store,
          data: store.data ? [...store.data, newType] : [newType],
          loading: false,
        }));

        return newType;
      } catch (error) {
        console.error("Error creating document type:", error);
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to create document type",
        }));
        throw error;
      }
    },

    updateDocumentType: async (id: string, updates: Partial<DocumentType>) => {
      update((store) => ({ ...store, loading: true }));

      try {
        const typeRef = doc(db, "documentTypes", id);
        await updateDoc(typeRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        });

        update((store) => ({
          ...store,
          data:
            store.data?.map((type) =>
              type.id === id ? { ...type, ...updates } : type,
            ) || null,
          loading: false,
        }));
      } catch (error) {
        console.error("Error updating document type:", error);
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to update document type",
        }));
        throw error;
      }
    },

    deleteDocumentType: async (id: string) => {
      update((store) => ({ ...store, loading: true }));

      try {
        await deleteDoc(doc(db, "documentTypes", id));

        update((store) => ({
          ...store,
          data: store.data?.filter((type) => type.id !== id) || null,
          loading: false,
        }));
      } catch (error) {
        console.error("Error deleting document type:", error);
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to delete document type",
        }));
        throw error;
      }
    },
  };
}

export const documentTypesStore = createDocumentTypesStore();
