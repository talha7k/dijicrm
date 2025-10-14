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
import type { DocumentRequirement } from "$lib/types/document";

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
  documentRequirements?: DocumentRequirement[]; // Related document requirements
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

    loadProducts: async (companyId: string) => {
      update((store) => ({ ...store, loading: true, error: null }));

      try {
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

        // If no products in Firebase, use mock data as fallback
        if (products.length === 0) {
          // Mock document requirements data
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
              documentRequirements: mockRequirements.filter(
                (req) => req.productId === "prod-1",
              ),
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
              documentRequirements: mockRequirements.filter(
                (req) => req.productId === "prod-2",
              ),
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
              documentRequirements: [],
            },
          ];

          // Save mock data to Firebase for future use
          for (const product of mockProducts) {
            await setDoc(doc(db, "products", product.id), product);
          }

          set({ data: mockProducts, loading: false, error: null });
        } else {
          set({ data: products, loading: false, error: null });
        }
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
      product: Omit<Product, "id" | "createdAt" | "updatedAt">,
    ) => {
      update((store) => ({ ...store, loading: true }));

      try {
        const newProduct: Product = {
          ...product,
          id: `prod-${Date.now()}`,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          documentRequirements: product.documentRequirements || [],
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
