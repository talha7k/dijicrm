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
import type { Order } from "$lib/types/document";
import { activeCompanyId } from "./companyContext";

function createOrdersStore() {
  const { subscribe, set, update } = writable<{
    data: Order[] | null;
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

    loadOrders: async (companyId: string) => {
      update((store) => ({ ...store, loading: true, error: null }));

      try {
        // Query Firebase for orders
        const ordersQuery = query(
          collection(db, "orders"),
          where("companyId", "==", companyId),
        );

        const querySnapshot = await getDocs(ordersQuery);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() } as Order);
        });

        set({ data: orders, loading: false, error: null });
      } catch (error) {
        console.error("Error loading orders:", error);
        set({
          data: null,
          loading: false,
          error: "Failed to load orders",
        });
      }
    },

    loadClientOrders: async (clientId: string) => {
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

        // Query Firebase for orders by client and company
        const ordersQuery = query(
          collection(db, "orders"),
          where("clientId", "==", clientId),
          where("companyId", "==", companyId),
        );

        const querySnapshot = await getDocs(ordersQuery);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() } as Order);
        });

        set({ data: orders, loading: false, error: null });
      } catch (error) {
        console.error("Error loading client orders:", error);
        set({
          data: null,
          loading: false,
          error: "Failed to load client orders",
        });
      }
    },

    createOrder: async (
      order: Omit<Order, "id" | "createdAt" | "updatedAt" | "companyId">,
    ) => {
      update((store) => ({ ...store, loading: true }));

      try {
        const companyId = get(activeCompanyId);
        if (!companyId) {
          throw new Error("No active company");
        }

        const newOrder: Order = {
          ...order,
          companyId,
          id: `order-${Date.now()}`,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await setDoc(doc(db, "orders", newOrder.id), newOrder);

        update((store) => ({
          ...store,
          data: store.data ? [...store.data, newOrder] : [newOrder],
          loading: false,
        }));

        return newOrder;
      } catch (error) {
        console.error("Error creating order:", error);
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to create order",
        }));
        throw error;
      }
    },

    updateOrder: async (id: string, updates: Partial<Order>) => {
      update((store) => ({ ...store, loading: true }));

      try {
        const orderRef = doc(db, "orders", id);
        await updateDoc(orderRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        });

        update((store) => ({
          ...store,
          data:
            store.data?.map((order) =>
              order.id === id ? { ...order, ...updates } : order,
            ) || null,
          loading: false,
        }));
      } catch (error) {
        console.error("Error updating order:", error);
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to update order",
        }));
        throw error;
      }
    },

    deleteOrder: async (id: string) => {
      update((store) => ({ ...store, loading: true }));

      try {
        await deleteDoc(doc(db, "orders", id));

        update((store) => ({
          ...store,
          data: store.data?.filter((order) => order.id !== id) || null,
          loading: false,
        }));
      } catch (error) {
        console.error("Error deleting order:", error);
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to delete order",
        }));
        throw error;
      }
    },
  };
}

export const ordersStore = createOrdersStore();
