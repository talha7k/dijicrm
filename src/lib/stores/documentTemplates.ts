import { writable, get } from "svelte/store";
import type { DocumentTemplate } from "$lib/types/document";
import {
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "$lib/firebase";
import { activeCompanyId } from "./companyContext";

interface DocumentTemplatesState {
  data: DocumentTemplate[];
  loading: boolean;
  error: string | null;
}

function createDocumentTemplatesStore() {
  const store = writable<DocumentTemplatesState>({
    data: [],
    loading: false,
    error: null,
  });

  let unsubscribe: (() => void) | null = null;

  return {
    subscribe: store.subscribe,

    loadTemplates: async () => {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          store.update((state) => ({
            ...state,
            error: "No active company",
            loading: false,
          }));
          return;
        }

        // Clean up previous listener
        if (unsubscribe) {
          unsubscribe();
        }

        // Query Firebase for templates
        const templatesQuery = query(
          collection(db, "documentTemplates"),
          where("companyId", "==", companyId),
          where("isActive", "==", true),
        );

        // Set up real-time listener
        unsubscribe = onSnapshot(
          templatesQuery,
          (querySnapshot) => {
            const templates: DocumentTemplate[] = [];

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              templates.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              } as DocumentTemplate);
            });

            store.update((state) => ({
              ...state,
              data: templates,
              loading: false,
              error: null,
            }));
          },
          (error) => {
            console.error("Error loading templates:", error);
            store.update((state) => ({
              ...state,
              error: error.message,
              loading: false,
            }));
          },
        );
      } catch (error) {
        console.error("Error setting up template listener:", error);
        store.update((state) => ({
          ...state,
          error:
            error instanceof Error ? error.message : "Failed to load templates",
          loading: false,
        }));
      }
    },

    createTemplate: async (
      template: Omit<
        DocumentTemplate,
        "id" | "createdAt" | "updatedAt" | "companyId"
      >,
    ) => {
      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          throw new Error("No active company");
        }

        const newTemplateData = {
          ...template,
          companyId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(
          collection(db, "documentTemplates"),
          newTemplateData,
        );
        return docRef.id;
      } catch (error) {
        console.error("Error creating template:", error);
        throw error;
      }
    },

    updateTemplate: async (id: string, updates: Partial<DocumentTemplate>) => {
      try {
        const updateData = {
          ...updates,
          updatedAt: Timestamp.now(),
        };
        await updateDoc(doc(db, "documentTemplates", id), updateData);
      } catch (error) {
        console.error("Error updating template:", error);
        throw error;
      }
    },

    deleteTemplate: async (id: string) => {
      try {
        await updateDoc(doc(db, "documentTemplates", id), {
          isActive: false,
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error("Error deleting template:", error);
        throw error;
      }
    },
  };
}

export const documentTemplatesStore = createDocumentTemplatesStore();

export async function getDocumentTemplate(templateId: string) {
  try {
    // This would need to be implemented with Firebase query
    // For now, return a placeholder
    return {
      data: null,
      loading: false,
      error: "Not implemented yet",
    };
  } catch (error) {
    return {
      data: null,
      loading: false,
      error: "Failed to load template",
    };
  }
}
