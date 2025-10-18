import { writable, get, derived } from "svelte/store";
import type {
  TemplateVariable,
  VariableTemplate,
  CreateVariableTemplateInput,
  UpdateVariableTemplateInput,
} from "$lib/types/templateVariable";
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
  orderBy,
} from "firebase/firestore";
import { db } from "$lib/firebase";
import { toast } from "svelte-sonner";
import { activeCompanyId } from "./companyContext";

interface CustomTemplateVariablesState {
  customVariables: TemplateVariable[];
  variableTemplates: VariableTemplate[];
  loading: boolean;
  error: string | null;
  lastUpdated: Timestamp | null;
}

function createCustomTemplateVariablesStore() {
  const store = writable<CustomTemplateVariablesState>({
    customVariables: [],
    variableTemplates: [],
    loading: false,
    error: null,
    lastUpdated: null,
  });

  let unsubscribeCustomVars: (() => void) | null = null;
  let unsubscribeTemplates: (() => void) | null = null;

  return {
    subscribe: store.subscribe,

    unsubscribe: () => {
      // Clean up all listeners
      if (unsubscribeCustomVars) {
        unsubscribeCustomVars();
        unsubscribeCustomVars = null;
      }
      if (unsubscribeTemplates) {
        unsubscribeTemplates();
        unsubscribeTemplates = null;
      }

      // Clear store data
      store.set({
        customVariables: [],
        variableTemplates: [],
        loading: false,
        error: null,
        lastUpdated: null,
      });
    },

    // Load custom variables for the current company
    async loadCustomVariables() {
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
        if (unsubscribeCustomVars) {
          unsubscribeCustomVars();
        }

        // Query for custom variables
        const customVarsQuery = query(
          collection(db, "customTemplateVariables"),
          where("companyId", "==", companyId),
          where("category", "==", "custom"),
          orderBy("usageCount", "desc"),
        );

        // Set up real-time listener
        unsubscribeCustomVars = onSnapshot(
          customVarsQuery,
          (querySnapshot) => {
            const customVariables: TemplateVariable[] = [];

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              customVariables.push({
                ...data,
              } as TemplateVariable);
            });

            store.update((state) => ({
              ...state,
              customVariables,
              loading: false,
              error: null,
              lastUpdated: Timestamp.now(),
            }));
          },
          (error) => {
            console.error("Error listening to custom variables:", error);
            store.update((state) => ({
              ...state,
              error: error.message,
              loading: false,
            }));
          },
        );
      } catch (error) {
        console.error("Error setting up custom variables listener:", error);
        store.update((state) => ({
          ...state,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load custom variables",
          loading: false,
        }));
      }
    },

    // Load variable templates for the current company
    async loadVariableTemplates() {
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
        if (unsubscribeTemplates) {
          unsubscribeTemplates();
        }

        // Query for variable templates
        const templatesQuery = query(
          collection(db, "variableTemplates"),
          where("companyId", "==", companyId),
          orderBy("updatedAt", "desc"),
        );

        // Set up real-time listener
        unsubscribeTemplates = onSnapshot(
          templatesQuery,
          (querySnapshot) => {
            const variableTemplates: VariableTemplate[] = [];

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              variableTemplates.push({
                ...data,
                id: doc.id,
              } as VariableTemplate);
            });

            store.update((state) => ({
              ...state,
              variableTemplates,
              loading: false,
              error: null,
            }));
          },
          (error) => {
            console.error("Error listening to variable templates:", error);
            store.update((state) => ({
              ...state,
              error: error.message,
              loading: false,
            }));
          },
        );
      } catch (error) {
        console.error("Error setting up variable templates listener:", error);
        store.update((state) => ({
          ...state,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load variable templates",
          loading: false,
        }));
      }
    },

    // Create a new custom variable
    async createCustomVariable(
      variableData: Omit<TemplateVariable, "usageCount" | "lastUsedAt">,
    ) {
      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          throw new Error("No active company");
        }

        const newVariableData = {
          ...variableData,
          companyId,
          usageCount: 0,
          lastUsedAt: Timestamp.now(),
        };

        // Save to Firebase
        const docRef = await addDoc(
          collection(db, "customTemplateVariables"),
          newVariableData,
        );

        toast.success("Custom variable created successfully");
        return { ...newVariableData, id: docRef.id };
      } catch (error) {
        console.error("Error creating custom variable:", error);
        toast.error("Failed to create custom variable");
        throw error;
      }
    },

    // Update an existing custom variable
    async updateCustomVariable(
      variableKey: string,
      updates: Partial<TemplateVariable>,
    ) {
      try {
        await updateDoc(doc(db, "customTemplateVariables", variableKey), {
          ...updates,
          lastModifiedAt: Timestamp.now(),
        });

        toast.success("Custom variable updated successfully");
      } catch (error) {
        console.error("Error updating custom variable:", error);
        toast.error("Failed to update custom variable");
        throw error;
      }
    },

    // Delete a custom variable
    async deleteCustomVariable(variableKey: string) {
      try {
        await deleteDoc(doc(db, "customTemplateVariables", variableKey));

        toast.success("Custom variable deleted successfully");
      } catch (error) {
        console.error("Error deleting custom variable:", error);
        toast.error("Failed to delete custom variable");
        throw error;
      }
    },

    // Create a new variable template
    async createVariableTemplate(
      templateData: CreateVariableTemplateInput,
    ): Promise<VariableTemplate> {
      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          throw new Error("No active company");
        }

        const newTemplateData = {
          ...templateData,
          companyId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // Save to Firebase
        const docRef = await addDoc(
          collection(db, "variableTemplates"),
          newTemplateData,
        );

        const savedTemplate: VariableTemplate = {
          id: docRef.id,
          name: newTemplateData.name,
          description: newTemplateData.description,
          category: newTemplateData.category,
          variables: newTemplateData.variables,
          isActive: newTemplateData.isActive ?? true,
          createdAt: newTemplateData.createdAt.toDate(),
          updatedAt: newTemplateData.updatedAt.toDate(),
          createdBy: newTemplateData.createdBy,
          documentTemplateIds: newTemplateData.documentTemplateIds || [],
        };

        toast.success("Variable template created successfully");
        return savedTemplate;
      } catch (error) {
        console.error("Error creating variable template:", error);
        toast.error("Failed to create variable template");
        throw error;
      }
    },

    // Update a variable template
    async updateVariableTemplate(
      templateId: string,
      updates: UpdateVariableTemplateInput,
    ): Promise<VariableTemplate | null> {
      try {
        const updateData = {
          ...updates,
          updatedAt: Timestamp.now(),
        };

        await updateDoc(doc(db, "variableTemplates", templateId), updateData);

        toast.success("Variable template updated successfully");

        // Return updated template by getting current state
        const currentState = get(store);
        return (
          currentState.variableTemplates.find((t) => t.id === templateId) ||
          null
        );
      } catch (error) {
        console.error("Error updating variable template:", error);
        toast.error("Failed to update variable template");
        throw error;
      }
    },

    // Delete a variable template
    async deleteVariableTemplate(templateId: string) {
      try {
        await deleteDoc(doc(db, "variableTemplates", templateId));

        toast.success("Variable template deleted successfully");
      } catch (error) {
        console.error("Error deleting variable template:", error);
        toast.error("Failed to delete variable template");
        throw error;
      }
    },

    // Get a variable template by ID
    getVariableTemplate(templateId: string): VariableTemplate | undefined {
      let template: VariableTemplate | undefined;
      store.subscribe((state) => {
        template = state.variableTemplates.find((t) => t.id === templateId);
      })();
      return template;
    },

    // Get a custom variable by key
    getCustomVariable(variableKey: string): TemplateVariable | undefined {
      let variable: TemplateVariable | undefined;
      store.subscribe((state) => {
        variable = state.customVariables.find((v) => v.key === variableKey);
      })();
      return variable;
    },

    // Detect variables from template content and create/update custom variables
    async detectVariablesFromTemplate(
      templateContent: string,
      templateId?: string,
    ): Promise<TemplateVariable[]> {
      try {
        // Extract placeholders from template content
        const placeholderRegex = /\{\{(\w+)\}\}/g;
        const placeholders: string[] = [];
        let match;

        while ((match = placeholderRegex.exec(templateContent)) !== null) {
          const placeholderKey = match[1];
          if (!placeholders.includes(placeholderKey)) {
            placeholders.push(placeholderKey);
          }
        }

        const detectedVariables: TemplateVariable[] = [];

        // Process each detected variable
        for (const key of placeholders) {
          const existingVar = this.getCustomVariable(key);

          if (existingVar) {
            // Update usage count
            await this.updateCustomVariable(key, {
              usageCount: existingVar.usageCount + 1,
              lastUsedAt: Timestamp.now(),
            });
            detectedVariables.push(existingVar);
          } else {
            // Create new custom variable
            const newVariable: Omit<
              TemplateVariable,
              "usageCount" | "lastUsedAt"
            > = {
              key,
              label:
                key.charAt(0).toUpperCase() +
                key.slice(1).replace(/([A-Z])/g, " $1"),
              type: "text", // Default type, can be updated later
              required: false,
              category: "custom",
              description: templateId
                ? `Variable detected from template ${templateId}`
                : `Custom variable: ${key}`,
            };

            const createdVar = await this.createCustomVariable(newVariable);
            detectedVariables.push(createdVar as TemplateVariable);
          }
        }

        toast.success(
          `Processed ${placeholders.length} variables from template`,
        );
        return detectedVariables;
      } catch (error) {
        console.error("Error detecting variables from template:", error);
        toast.error("Failed to detect variables from template");
        throw error;
      }
    },

    // Clear error
    clearError() {
      store.update((state) => ({ ...state, error: null }));
    },
  };
}

export const customTemplateVariablesStore =
  createCustomTemplateVariablesStore();

// Derived stores for common queries
export const customVariables = derived(
  customTemplateVariablesStore,
  ($store) => $store.customVariables,
);

export const variableTemplates = derived(
  customTemplateVariablesStore,
  ($store) => $store.variableTemplates,
);

export const activeVariableTemplates = derived(
  customTemplateVariablesStore,
  ($store) => $store.variableTemplates.filter((t) => t.isActive),
);
