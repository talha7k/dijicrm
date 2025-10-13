import { writable } from "svelte/store";
import { Timestamp } from "firebase/firestore";
import type { Payment } from "$lib/types/document";

function createPaymentsStore() {
  const { subscribe, set, update } = writable<{
    data: Payment[] | null;
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
    loadPayments: async (companyId: string) => {
      update((store) => ({ ...store, loading: true, error: null }));

      try {
        // Mock data
        const mockPayments: Payment[] = [
          {
            id: "payment-1",
            invoiceId: "case-1",
            companyId,
            clientId: "client-1",
            amount: 1250.0,
            paymentDate: Timestamp.fromDate(new Date("2024-01-15")),
            paymentMethod: "bank_transfer",
            reference: "BT-2024-001",
            notes: "Full payment for consulting services",
            recordedBy: "user-1",
            createdAt: Timestamp.fromDate(new Date("2024-01-15")),
            updatedAt: Timestamp.fromDate(new Date("2024-01-15")),
          },
          {
            id: "payment-2",
            invoiceId: "case-2",
            companyId,
            clientId: "client-2",
            amount: 500.0,
            paymentDate: Timestamp.fromDate(new Date("2024-01-20")),
            paymentMethod: "credit_card",
            reference: "CC-2024-002",
            notes: "Partial payment for web development",
            recordedBy: "user-1",
            createdAt: Timestamp.fromDate(new Date("2024-01-20")),
            updatedAt: Timestamp.fromDate(new Date("2024-01-20")),
          },
        ];

        set({ data: mockPayments, loading: false, error: null });
      } catch (error) {
        set({
          data: null,
          loading: false,
          error: "Failed to load payments",
        });
      }
    },

    loadPaymentsForInvoice: async (invoiceId: string) => {
      update((store) => ({ ...store, loading: true, error: null }));

      try {
        // Mock filtering by invoice
        const mockPayments: Payment[] = [
          {
            id: "payment-1",
            invoiceId,
            companyId: "company-1",
            clientId: "client-1",
            amount: 1250.0,
            paymentDate: Timestamp.fromDate(new Date("2024-01-15")),
            paymentMethod: "bank_transfer",
            reference: "BT-2024-001",
            notes: "Full payment for consulting services",
            recordedBy: "user-1",
            createdAt: Timestamp.fromDate(new Date("2024-01-15")),
            updatedAt: Timestamp.fromDate(new Date("2024-01-15")),
          },
        ];

        set({
          data: mockPayments.filter((p) => p.invoiceId === invoiceId),
          loading: false,
          error: null,
        });
      } catch (error) {
        set({
          data: null,
          loading: false,
          error: "Failed to load payments for invoice",
        });
      }
    },

    recordPayment: async (
      payment: Omit<Payment, "id" | "createdAt" | "updatedAt">,
    ) => {
      update((store) => ({ ...store, loading: true }));

      try {
        const newPayment: Payment = {
          ...payment,
          id: `payment-${Date.now()}`,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        update((store) => ({
          ...store,
          data: store.data ? [...store.data, newPayment] : [newPayment],
          loading: false,
        }));

        return newPayment;
      } catch (error) {
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to record payment",
        }));
        throw error;
      }
    },

    updatePayment: async (id: string, updates: Partial<Payment>) => {
      update((store) => ({ ...store, loading: true }));

      try {
        update((store) => ({
          ...store,
          data:
            store.data?.map((payment) =>
              payment.id === id
                ? { ...payment, ...updates, updatedAt: Timestamp.now() }
                : payment,
            ) || null,
          loading: false,
        }));
      } catch (error) {
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to update payment",
        }));
        throw error;
      }
    },

    deletePayment: async (id: string) => {
      update((store) => ({ ...store, loading: true }));

      try {
        update((store) => ({
          ...store,
          data: store.data?.filter((payment) => payment.id !== id) || null,
          loading: false,
        }));
      } catch (error) {
        update((store) => ({
          ...store,
          loading: false,
          error: "Failed to delete payment",
        }));
        throw error;
      }
    },
  };
}

export function usePayments() {
  return createPaymentsStore();
}
