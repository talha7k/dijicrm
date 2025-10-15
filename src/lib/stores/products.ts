import { writable, get } from "svelte/store";
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
import { activeCompanyId } from "./companyContext";

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

    loadProducts: async () => {
      update((store) => ({ ...store, loading: true, error: null }));

      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          set({
            data: null,
            loading: false,
            error: "No active company",
          });
          return;
        }

        // Query Firebase for products
        const productsQuery = query(
          collection(db, "products"),
          where("companyId", "==", companyId),
        );

        const querySnapshot = await getDocs(productsQuery);
        const products: Product[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          products.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Product);
        });

        // Return the actual products from Firebase (empty array if none exist)
        set({ data: products, loading: false, error: null });
      } catch (error) {
        console.error("Error loading products:", error);
        set({
          data: null,
          loading: false,
          error: "Failed to load products",
        });
      }
    },

    createProduct: async (
      product: Omit<Product, "id" | "createdAt" | "updatedAt" | "companyId">,
    ) => {
      update((store) => ({ ...store, loading: true }));

      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          throw new Error("No active company");
        }

        const newProduct: Product = {
          ...product,
          companyId,
          id: `prod-${Date.now()}`,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // Save to Firebase
        await setDoc(doc(db, "products", newProduct.id), newProduct);

        // Update local store
        update((store) => ({
          ...store,
          data: store.data ? [...store.data, newProduct] : [newProduct],
          loading: false,
        }));

        return newProduct;
      } catch (error) {
        console.error("Error creating product:", error);
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
        const updatedData = { ...updates, updatedAt: Timestamp.now() };

        // Update in Firebase
        await updateDoc(doc(db, "products", id), updatedData);

        // Update local store
        update((store) => ({
          ...store,
          data:
            store.data?.map((prod) =>
              prod.id === id ? { ...prod, ...updatedData } : prod,
            ) || null,
          loading: false,
        }));
      } catch (error) {
        console.error("Error updating product:", error);
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
        // Delete from Firebase
        await deleteDoc(doc(db, "products", id));

        // Update local store
        update((store) => ({
          ...store,
          data: store.data?.filter((prod) => prod.id !== id) || null,
          loading: false,
        }));
      } catch (error) {
        console.error("Error deleting product:", error);
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

export const productsStore = createProductsStore();
