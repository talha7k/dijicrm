import { writable } from "svelte/store";
import { Timestamp } from "firebase/firestore";
import type { DocumentRequirement } from "$lib/types/document";

function createDocumentRequirementsStore() {
  const { subscribe, set, update } = writable<{
    data: DocumentRequirement[] | null;
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

    // Mock data for now - will be replaced with Firebase integration
    loadRequirements: async (companyId: string) => {
      update((store) => ({ ...store, loading: true, error: null }));

      try {
        // Mock data
        const mockRequirements: DocumentRequirement[] = [
          {
            id: "req-1",
            companyId,
            productId: "prod-1",
            templateId: "template-1",
            isMandatory: true,
            conditions: [],
            createdAt: Timestamp.fromDate(new Date("2024-01-01")),
            updatedAt: Timestamp.fromDate(new Date("2024-01-01")),
          },
          {
            id: "req-2",
            companyId,
            productId: "prod-2",
            templateId: "template-2",
            isMandatory: false,
            conditions: [
              {
                field: "amount",
                operator: "greater_than",
                value: 1000,
              },
            ],
            createdAt: Timestamp.fromDate(new Date("2024-01-02")),
            updatedAt: Timestamp.fromDate(new Date("2024-01-02")),
          },
        ];

        set({ data: mockRequirements, loading: false, error: null });
      } catch (error) {
        set({
          data: null,
          loading: false,
          error: "Failed to load document requirements",
        });
      }
    },

    createRequirement: async (
      requirement: Omit<DocumentRequirement, "id" | "createdAt" | "updatedAt">,
    ) => {
      update((store) => ({ ...store, loading: true }));

      try {
        const newRequirement: DocumentRequirement = {
          ...requirement,
          id: `req-${Date.now()}`,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        update((store) => ({
          ...store,
          data: store.data ? [...store.data, newRequirement] : [newRequirement],
          loading: false,
        }));

        return newRequirement;
      } catch (error) {
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to create requirement",
        }));
        throw error;
      }
    },

    updateRequirement: async (
      id: string,
      updates: Partial<DocumentRequirement>,
    ) => {
      update((store) => ({ ...store, loading: true }));

      try {
        update((store) => ({
          ...store,
          data:
            store.data?.map((req) =>
              req.id === id
                ? { ...req, ...updates, updatedAt: Timestamp.now() }
                : req,
            ) || null,
          loading: false,
        }));
      } catch (error) {
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to update requirement",
        }));
        throw error;
      }
    },

    deleteRequirement: async (id: string) => {
      update((store) => ({ ...store, loading: true }));

      try {
        update((store) => ({
          ...store,
          data: store.data?.filter((req) => req.id !== id) || null,
          loading: false,
        }));
      } catch (error) {
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to delete requirement",
        }));
        throw error;
      }
    },
  };
}

export function useDocumentRequirements() {
  return createDocumentRequirementsStore();
}
