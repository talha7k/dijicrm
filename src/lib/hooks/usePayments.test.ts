import { describe, it, expect } from "vitest";
import { paymentsStore } from "../stores/payments";
import type { Payment } from "$lib/types/document";
import { Timestamp } from "firebase/firestore";

describe("paymentsStore", () => {
  it("should initialize with empty state", () => {
    const store = paymentsStore;

    expect(store.subscribe).toBeDefined();
    expect(store.loadPayments).toBeDefined();
    expect(store.recordPayment).toBeDefined();
  });

  it("should validate payment data structure", () => {
    const payment: Omit<Payment, "id" | "createdAt" | "updatedAt"> = {
      invoiceId: "invoice-123",
      companyId: "company-1",
      clientId: "client-1",
      amount: 1000,
      paymentDate: Timestamp.now(),
      paymentMethod: "bank_transfer",
      reference: "REF-123",
      notes: "Test payment",
      recordedBy: "user-1",
    };

    // Validate required fields
    expect(payment.invoiceId).toBeDefined();
    expect(payment.companyId).toBeDefined();
    expect(payment.clientId).toBeDefined();
    expect(payment.amount).toBeGreaterThan(0);
    expect(payment.paymentDate).toBeInstanceOf(Timestamp);
    expect(payment.paymentMethod).toBeDefined();
    expect(payment.recordedBy).toBeDefined();
  });

  it("should handle payment with proof files", () => {
    const payment: Omit<Payment, "id" | "createdAt" | "updatedAt"> = {
      invoiceId: "invoice-123",
      companyId: "company-1",
      clientId: "client-1",
      amount: 1000,
      paymentDate: Timestamp.now(),
      paymentMethod: "bank_transfer",
      recordedBy: "user-1",
      proofFiles: [
        {
          id: "proof-1",
          companyId: "company-1",
          fileName: "receipt.pdf",
          fileUrl: "https://example.com/receipt.pdf",
          fileType: "application/pdf",
          fileSize: 102400,
          uploadedAt: Timestamp.now(),
          uploadedBy: "user-1",
        },
      ],
    };

    expect(payment.proofFiles).toBeDefined();
    expect(payment.proofFiles?.length).toBe(1);
    expect(payment.proofFiles?.[0].fileName).toBe("receipt.pdf");
  });
});
