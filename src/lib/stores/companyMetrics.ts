import { writable } from "svelte/store";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "$lib/firebase";

export interface CompanyMetrics {
  totalInvoices: number;
  outstandingAmount: number;
  totalClients: number;
  activeClients: number;
  invitedClients: number;
  overdueInvoices: number;
  recentActivity: {
    id: string;
    type:
      | "invoice_created"
      | "payment_received"
      | "client_added"
      | "client_invited"
      | "client_activated";
    description: string;
    timestamp: Date;
    amount: number | null;
  }[];
}

interface CompanyMetricsState {
  data: CompanyMetrics | null;
  loading: boolean;
  error: string | null;
}

function createCompanyMetricsStore() {
  const store = writable<CompanyMetricsState>({
    data: null,
    loading: false,
    error: null,
  });

  let clientsUnsubscribe: (() => void) | undefined;
  let ordersUnsubscribe: (() => void) | undefined;
  let paymentsUnsubscribe: (() => void) | undefined;

  return {
    subscribe: store.subscribe,

    loadMetrics: async (companyId: string) => {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Clean up previous listeners
        clientsUnsubscribe?.();
        ordersUnsubscribe?.();
        paymentsUnsubscribe?.();

        // Calculate metrics from Firebase data
        await calculateMetrics(companyId);

        // Set up listeners for real-time updates
        setupRealtimeListeners(companyId);
      } catch (error) {
        console.error("Error loading metrics:", error);
        store.update((state) => ({
          ...state,
          error:
            error instanceof Error ? error.message : "Failed to load metrics",
          loading: false,
        }));
      }
    },
  };

  async function calculateMetrics(companyId: string) {
    try {
      // Get clients
      const clientsQuery = query(
        collection(db, "users"),
        where("role", "==", "client"),
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const clients = clientsSnapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.companyAssociations?.some(
          (assoc: any) => assoc.companyId === companyId,
        );
      });

      const totalClients = clients.length;
      const activeClients = clients.filter((doc) => doc.data().isActive).length;
      const invitedClients = clients.filter(
        (doc) => !doc.data().isActive,
      ).length;

      // Get orders/invoices
      const ordersQuery = query(
        collection(db, "orders"),
        where("companyId", "==", companyId),
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as any,
      );

      const totalInvoices = orders.length;
      const outstandingAmount = orders.reduce(
        (sum, order) => sum + (order.outstandingAmount || 0),
        0,
      );
      const overdueInvoices = orders.filter((order) => {
        // Simplified overdue check - should be based on due date
        return order.outstandingAmount > 0;
      }).length;

      // Get recent activity (simplified - would need more complex aggregation)
      const recentActivity: CompanyMetrics["recentActivity"] = [
        // This would be populated from recent orders, payments, and client changes
        // For now, using placeholder data
      ];

      const metrics: CompanyMetrics = {
        totalInvoices,
        outstandingAmount,
        totalClients,
        activeClients,
        invitedClients,
        overdueInvoices,
        recentActivity,
      };

      store.update((state) => ({
        ...state,
        data: metrics,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Error calculating metrics:", error);
      throw error;
    }
  }

  function setupRealtimeListeners(companyId: string) {
    // Set up listeners for real-time updates
    // This would listen to changes in orders, payments, and users collections
    // and recalculate metrics when data changes

    // For now, simplified implementation
    const ordersQuery = query(
      collection(db, "orders"),
      where("companyId", "==", companyId),
    );

    ordersUnsubscribe = onSnapshot(
      ordersQuery,
      () => {
        calculateMetrics(companyId);
      },
      (error) => {
        console.error("Error listening to orders:", error);
      },
    );
  }
}

export const companyMetricsStore = createCompanyMetricsStore();
