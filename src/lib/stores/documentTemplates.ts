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

    unsubscribe: () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },

    loadTemplates: async (companyId?: string) => {
      console.log(
        "🔍 [TEMPLATES STORE] loadTemplates called with companyId:",
        companyId,
      );
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
        const activeCompanyIdValue = companyId || get(activeCompanyId);
        console.log(
          "🔍 [TEMPLATES STORE] activeCompanyIdValue:",
          activeCompanyIdValue,
        );
        if (!activeCompanyIdValue) {
          console.error("❌ [TEMPLATES STORE] No active company ID");
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
        console.log(
          "🔍 [TEMPLATES STORE] Querying templates for company:",
          activeCompanyIdValue,
        );
        const templatesQuery = query(
          collection(db, "documentTemplates"),
          where("companyId", "==", activeCompanyIdValue),
          where("isActive", "==", true),
        );

        // Set up real-time listener
        unsubscribe = onSnapshot(
          templatesQuery,
          (querySnapshot) => {
            console.log(
              "🔍 [TEMPLATES STORE] Query snapshot received:",
              querySnapshot.size,
              "documents",
            );
            const templates: DocumentTemplate[] = [];

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              console.log(
                "🔍 [TEMPLATES STORE] Template found:",
                doc.id,
                data.name,
                "isActive:",
                data.isActive,
              );
              templates.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              } as DocumentTemplate);
            });

            console.log(
              "🔍 [TEMPLATES STORE] Total templates loaded:",
              templates.length,
            );
            console.log(
              "🔍 [TEMPLATES STORE] Template objects:",
              templates.map((t) => ({
                id: t.id,
                name: t.name,
                isActive: t.isActive,
              })),
            );

            store.update((state) => {
              console.log(
                "🔍 [TEMPLATES STORE] Updating store with",
                templates.length,
                "templates",
              );
              return {
                ...state,
                data: templates,
                loading: false,
                error: null,
              };
            });
          },
          (error) => {
            console.error(
              "❌ [TEMPLATES STORE] Error loading templates:",
              error,
            );
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

export async function getDocumentTemplate(
  templateId: string,
  companyId?: string,
): Promise<DocumentTemplate | null> {
  try {
    const activeCompanyIdValue = companyId || get(activeCompanyId);
    if (!activeCompanyIdValue) {
      throw new Error("No active company");
    }

    const docSnap = await getDocs(
      query(
        collection(db, "documentTemplates"),
        where("__name__", "==", templateId),
      ),
    );

    if (docSnap.empty) {
      return null;
    }

    const data = docSnap.docs[0].data();
    return {
      id: docSnap.docs[0].id,
      ...data,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as DocumentTemplate;
  } catch (error) {
    console.error("Error loading template:", error);
    return null;
  }
}
