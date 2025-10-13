import { writable } from "svelte/store";
import { Timestamp } from "firebase/firestore";

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category: "service" | "product" | "subscription";
  price?: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function createProductsStore() {
  const { subscribe, set, update } = writable<{
    data: Product[] | null;
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
    loadProducts: async (companyId: string) => {
      update((store) => ({ ...store, loading: true, error: null }));

      try {
        // Mock data
        const mockProducts: Product[] = [
          {
            id: "prod-1",
            companyId,
            name: "Web Development Service",
            description: "Custom web application development",
            category: "service",
            price: 5000,
            isActive: true,
            createdAt: Timestamp.fromDate(new Date("2024-01-01")),
            updatedAt: Timestamp.fromDate(new Date("2024-01-01")),
          },
          {
            id: "prod-2",
            companyId,
            name: "SEO Package",
            description: "Search engine optimization services",
            category: "service",
            price: 1500,
            isActive: true,
            createdAt: Timestamp.fromDate(new Date("2024-01-02")),
            updatedAt: Timestamp.fromDate(new Date("2024-01-02")),
          },
          {
            id: "prod-3",
            companyId,
            name: "Consulting Subscription",
            description: "Monthly consulting services",
            category: "subscription",
            price: 2000,
            isActive: true,
            createdAt: Timestamp.fromDate(new Date("2024-01-03")),
            updatedAt: Timestamp.fromDate(new Date("2024-01-03")),
          },
        ];

        set({ data: mockProducts, loading: false, error: null });
      } catch (error) {
        set({
          data: null,
          loading: false,
          error: "Failed to load products",
        });
      }
    },

    createProduct: async (
      product: Omit<Product, "id" | "createdAt" | "updatedAt">,
    ) => {
      update((store) => ({ ...store, loading: true }));

      try {
        const newProduct: Product = {
          ...product,
          id: `prod-${Date.now()}`,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        update((store) => ({
          ...store,
          data: store.data ? [...store.data, newProduct] : [newProduct],
          loading: false,
        }));

        return newProduct;
      } catch (error) {
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to create product",
        }));
        throw error;
      }
    },

    updateProduct: async (id: string, updates: Partial<Product>) => {
      update((store) => ({ ...store, loading: true }));

      try {
        update((store) => ({
          ...store,
          data:
            store.data?.map((prod) =>
              prod.id === id
                ? { ...prod, ...updates, updatedAt: Timestamp.now() }
                : prod,
            ) || null,
          loading: false,
        }));
      } catch (error) {
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to update product",
        }));
        throw error;
      }
    },

    deleteProduct: async (id: string) => {
      update((store) => ({ ...store, loading: true }));

      try {
        update((store) => ({
          ...store,
          data: store.data?.filter((prod) => prod.id !== id) || null,
          loading: false,
        }));
      } catch (error) {
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to delete product",
        }));
        throw error;
      }
    },
  };
}

export function useProducts() {
  return createProductsStore();
}
