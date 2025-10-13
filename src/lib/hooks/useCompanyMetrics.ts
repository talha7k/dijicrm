import { derived } from "svelte/store";
import { userProfile } from "$lib/stores/user";

export interface CompanyMetrics {
  totalInvoices: number;
  outstandingAmount: number;
  totalClients: number;
  overdueInvoices: number;
  recentActivity: {
    id: string;
    type: "invoice_created" | "payment_received" | "client_added";
    description: string;
    timestamp: Date;
    amount: number | null;
  }[];
}

// Mock data for company metrics - replace with actual Firebase queries
const mockCompanyMetrics: CompanyMetrics = {
  totalInvoices: 45,
  outstandingAmount: 12500.5,
  totalClients: 12,
  overdueInvoices: 3,
  recentActivity: [
    {
      id: "act-001",
      type: "invoice_created",
      description: "Invoice INV-2024-045 created for Acme Corp",
      timestamp: new Date("2024-01-20T10:30:00"),
      amount: 2500.0,
    },
    {
      id: "act-002",
      type: "payment_received",
      description: "Payment received from TechStart Inc",
      timestamp: new Date("2024-01-19T14:15:00"),
      amount: 1800.0,
    },
    {
      id: "act-003",
      type: "client_added",
      description: "New client Global Solutions added",
      timestamp: new Date("2024-01-18T09:00:00"),
      amount: null,
    },
  ],
};

export function useCompanyMetrics() {
  // In a real app, this would query Firebase for company-specific metrics
  // For now, return mock data
  return derived(userProfile, ($userProfile) => {
    if (!$userProfile.data) return { data: null, loading: true, error: null };

    // Simulate loading
    return {
      data: mockCompanyMetrics,
      loading: false,
      error: null,
    };
  });
}
