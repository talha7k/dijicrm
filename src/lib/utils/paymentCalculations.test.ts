import { describe, it, expect } from "vitest";
import {
  updateInvoiceAfterPayment,
  getMaxPaymentAmount,
  validatePaymentAmount,
  type InvoiceData,
} from "./paymentCalculations";

describe("Payment Calculations", () => {
  describe("updateInvoiceAfterPayment", () => {
    it("should update amounts and status to paid when fully paid", () => {
      const invoice: InvoiceData = {
        paidAmount: 500,
        outstandingAmount: 500,
        status: "partially_paid",
      };

      const result = updateInvoiceAfterPayment(invoice, 500);

      expect(result.paidAmount).toBe(1000);
      expect(result.outstandingAmount).toBe(0);
      expect(result.status).toBe("paid");
    });

    it("should update amounts and status to partially_paid when partially paid", () => {
      const invoice: InvoiceData = {
        paidAmount: 0,
        outstandingAmount: 1000,
        status: "sent",
      };

      const result = updateInvoiceAfterPayment(invoice, 300);

      expect(result.paidAmount).toBe(300);
      expect(result.outstandingAmount).toBe(700);
      expect(result.status).toBe("partially_paid");
    });

    it("should keep status as partially_paid when still partially paid", () => {
      const invoice: InvoiceData = {
        paidAmount: 200,
        outstandingAmount: 800,
        status: "partially_paid",
      };

      const result = updateInvoiceAfterPayment(invoice, 300);

      expect(result.paidAmount).toBe(500);
      expect(result.outstandingAmount).toBe(500);
      expect(result.status).toBe("partially_paid");
    });
  });

  describe("getMaxPaymentAmount", () => {
    it("should return the outstanding amount", () => {
      const invoice: InvoiceData = {
        paidAmount: 200,
        outstandingAmount: 800,
        status: "partially_paid",
      };

      expect(getMaxPaymentAmount(invoice)).toBe(800);
    });
  });

  describe("validatePaymentAmount", () => {
    const invoice: InvoiceData = {
      paidAmount: 200,
      outstandingAmount: 800,
      status: "partially_paid",
    };

    it("should return invalid for negative amount", () => {
      const result = validatePaymentAmount(-100, invoice);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("greater than 0");
    });

    it("should return invalid for zero amount", () => {
      const result = validatePaymentAmount(0, invoice);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("greater than 0");
    });

    it("should return invalid for amount exceeding outstanding balance", () => {
      const result = validatePaymentAmount(900, invoice);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("cannot exceed outstanding balance");
    });

    it("should return valid for amount within outstanding balance", () => {
      const result = validatePaymentAmount(500, invoice);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return valid for amount equal to outstanding balance", () => {
      const result = validatePaymentAmount(800, invoice);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
