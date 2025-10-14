import { writable } from "svelte/store";
import { userProfile } from "$lib/stores/user";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "$lib/firebase";
import type { Order } from "$lib/types/document";

export interface ClientInvoice {
  id: string;
  number: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "partially_paid";
  dueDate: Date;
  createdAt: Date;
  description: string;
}

interface ClientInvoicesState {
  data: ClientInvoice[];
  loading: boolean;
  error: string | null;
}

// Convert Order to ClientInvoice
function orderToClientInvoice(order: Order): ClientInvoice {
  return {
    id: order.id,
    number: `INV-${order.id.slice(-6).toUpperCase()}`, // Generate invoice number from order ID
    amount: order.totalAmount,
    status:
      order.status === "paid"
        ? "paid"
        : order.status === "partially_paid"
          ? "partially_paid"
          : order.outstandingAmount > 0 && new Date() > new Date("2024-01-01")
            ? "overdue"
            : "pending", // Simplified overdue logic
    dueDate: new Date("2024-01-15"), // This should come from order data
    createdAt: order.createdAt.toDate(),
    description: order.title || order.description || "Service order",
  };
}

function createClientInvoicesStore() {
  const store = writable<ClientInvoicesState>({
    data: [],
    loading: false,
    error: null,
  });

  let unsubscribe: (() => void) | null = null;

  // Subscribe to user profile changes
  const unsubscribeUser = userProfile.subscribe(($userProfile) => {
    if ($userProfile.data) {
      loadInvoices($userProfile.data.uid);
    } else {
      store.set({ data: [], loading: false, error: null });
    }
  });

  function loadInvoices(clientId: string) {
    store.update((state) => ({ ...state, loading: true, error: null }));

    try {
      // Clean up previous listener
      if (unsubscribe) {
        unsubscribe();
      }

      // Query orders for this client
      const ordersQuery = query(
        collection(db, "orders"),
        where("clientId", "==", clientId),
      );

      // Set up real-time listener
      unsubscribe = onSnapshot(
        ordersQuery,
        (querySnapshot) => {
          const invoices: ClientInvoice[] = [];

          querySnapshot.forEach((doc) => {
            const order = { id: doc.id, ...doc.data() } as Order;
            invoices.push(orderToClientInvoice(order));
          });

          store.update((state) => ({
            ...state,
            data: invoices,
            loading: false,
            error: null,
          }));
        },
        (error) => {
          console.error("Error loading client invoices:", error);
          store.update((state) => ({
            ...state,
            error: error.message,
            loading: false,
          }));
        },
      );
    } catch (error) {
      console.error("Error setting up invoice listener:", error);
      store.update((state) => ({
        ...state,
        error:
          error instanceof Error ? error.message : "Failed to load invoices",
        loading: false,
      }));
    }
  }

  return {
    subscribe: store.subscribe,
  };
}

export const clientInvoicesStore = createClientInvoicesStore();
