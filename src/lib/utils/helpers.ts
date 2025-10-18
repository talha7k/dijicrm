/**
 * Utility helper functions for formatting and common operations
 */

export function getStatusBadge(status: string) {
  const variants = {
    completed: "default",
    in_progress: "secondary",
    pending: "outline",
    cancelled: "destructive",
    paid: "default",
    overdue: "destructive",
    sent: "secondary",
    delivered: "default",
  } as const;

  return variants[status as keyof typeof variants] || "outline";
}

export function formatCurrency(amount: number, currency: string = "SAR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
