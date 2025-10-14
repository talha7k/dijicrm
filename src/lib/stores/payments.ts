import { writable } from "svelte/store";
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

    loadPayments: async (companyId: string) => {
      update((store) => ({ ...store, loading: true, error: null }));

      try {
        // Query Firebase for payments
        const paymentsQuery = query(
          collection(db, "payments"),
          where("companyId", "==", companyId),
        );

        const querySnapshot = await getDocs(paymentsQuery);
        const payments: Payment[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          payments.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            paymentDate: data.paymentDate,
          } as Payment);
        });

        set({ data: payments, loading: false, error: null });
      } catch (error) {
        console.error("Error loading payments:", error);
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
        // Query Firebase for payments by invoice
        const paymentsQuery = query(
          collection(db, "payments"),
          where("invoiceId", "==", invoiceId),
        );

        const querySnapshot = await getDocs(paymentsQuery);
        const payments: Payment[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          payments.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            paymentDate: data.paymentDate,
          } as Payment);
        });

        set({
          data: payments,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error loading payments for invoice:", error);
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
        const newPaymentData = {
          ...payment,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // Save to Firebase
        const docRef = await addDoc(collection(db, "payments"), newPaymentData);
        const savedPayment: Payment = {
          ...newPaymentData,
          id: docRef.id,
        };

        // Update local state
        update((store) => ({
          ...store,
          data: store.data ? [...store.data, savedPayment] : [savedPayment],
          loading: false,
        }));

        return savedPayment;
      } catch (error) {
        console.error("Error recording payment:", error);
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
        // Update in Firebase
        const updateData = {
          ...updates,
          updatedAt: Timestamp.now(),
        };
        await updateDoc(doc(db, "payments", id), updateData);

        // Update local state
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
        console.error("Error updating payment:", error);
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
        // Delete from Firebase
        await deleteDoc(doc(db, "payments", id));

        // Update local state
        update((store) => ({
          ...store,
          data: store.data?.filter((payment) => payment.id !== id) || null,
          loading: false,
        }));
      } catch (error) {
        console.error("Error deleting payment:", error);
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

export const paymentsStore = createPaymentsStore();
