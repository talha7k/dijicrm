import { writable, get } from "svelte/store";
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
import { activeCompanyId } from "./companyContext";

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

    loadPaymentsForOrder: async (orderId: string) => {
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

        // Query Firebase for payments by order and company
        const paymentsQuery = query(
          collection(db, "payments"),
          where("orderId", "==", orderId),
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

        set({
          data: payments,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error loading payments for order:", error);
        set({
          data: null,
          loading: false,
          error: "Failed to load payments for order",
        });
      }
    },

    recordPayment: async (
      payment: Omit<Payment, "id" | "createdAt" | "updatedAt" | "companyId">,
    ) => {
      console.log("💳 PaymentsStore.recordPayment called with:", payment);
      update((store) => ({ ...store, loading: true }));

      try {
        const companyId = get(activeCompanyId);
        console.log("🏢 Company ID from store:", companyId);

        if (!companyId) {
          console.error("❌ No active company ID available");
          throw new Error("No active company");
        }

        const newPaymentData = {
          ...payment,
          companyId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        console.log("📦 Final payment data to save:", newPaymentData);
        console.log("🔥 Firebase DB instance:", !!db);

        // Save to Firebase
        console.log("💾 Attempting to save to Firebase...");
        const docRef = await addDoc(collection(db, "payments"), newPaymentData);
        console.log("✅ Firebase save successful, document ID:", docRef.id);

        const savedPayment: Payment = {
          ...newPaymentData,
          id: docRef.id,
        };

        console.log("📝 Saved payment object:", savedPayment);

        // Update local state
        update((store) => ({
          ...store,
          data: store.data ? [...store.data, savedPayment] : [savedPayment],
          loading: false,
        }));

        console.log("✅ Payment store updated locally");
        return savedPayment;
      } catch (error) {
        console.error("❌ Error recording payment:", error);
        console.error("❌ Error details:", {
          message:
            error && typeof error === "object" && "message" in error
              ? error.message
              : "No message",
          code:
            error && typeof error === "object" && "code" in error
              ? error.code
              : "No code",
          name:
            error && typeof error === "object" && "name" in error
              ? error.name
              : "No name",
          stack:
            error && typeof error === "object" && "stack" in error
              ? error.stack
              : "No stack",
        });

        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? error.message
            : "Unknown error";

        update((store) => ({
          ...store,
          loading: false,
          error: `Failed to record payment: ${errorMessage}`,
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
