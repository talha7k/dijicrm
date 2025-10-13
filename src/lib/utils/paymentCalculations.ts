export interface InvoiceData {
  paidAmount: number;
  outstandingAmount: number;
  status:
    | "draft"
    | "generated"
    | "sent"
    | "partially_paid"
    | "paid"
    | "overdue";
  [key: string]: any; // Allow additional properties
}

/**
 * Updates invoice amounts and status after recording a payment
 */
export function updateInvoiceAfterPayment(
  invoice: InvoiceData,
  paymentAmount: number,
): InvoiceData {
  const updatedInvoice = { ...invoice };

  // Update amounts
  updatedInvoice.paidAmount += paymentAmount;
  updatedInvoice.outstandingAmount -= paymentAmount;

  // Update status
  if (updatedInvoice.outstandingAmount <= 0) {
    updatedInvoice.status = "paid";
  } else if (updatedInvoice.paidAmount > 0) {
    updatedInvoice.status = "partially_paid";
  }

  return updatedInvoice;
}

/**
 * Calculates the maximum payment amount allowed for an invoice
 */
export function getMaxPaymentAmount(invoice: InvoiceData): number {
  return invoice.outstandingAmount;
}

/**
 * Validates if a payment amount is valid for an invoice
 */
export function validatePaymentAmount(
  amount: number,
  invoice: InvoiceData,
): { isValid: boolean; error?: string } {
  if (amount <= 0) {
    return { isValid: false, error: "Payment amount must be greater than 0" };
  }

  if (amount > invoice.outstandingAmount) {
    return {
      isValid: false,
      error: `Payment amount cannot exceed outstanding balance of $${invoice.outstandingAmount.toFixed(2)}`,
    };
  }

  return { isValid: true };
}
