import { derived } from "svelte/store";
import { userProfile } from "$lib/stores/user";

// Mock data for client invoices - replace with actual Firebase queries
const mockClientInvoices: ClientInvoice[] = [
  {
    id: "inv-001",
    number: "INV-2024-001",
    amount: 1250.0,
    status: "paid",
    dueDate: new Date("2024-01-15"),
    createdAt: new Date("2024-01-01"),
    description: "Consulting services for Q1",
  },
  {
    id: "inv-002",
    number: "INV-2024-002",
    amount: 890.5,
    status: "pending",
    dueDate: new Date("2024-02-01"),
    createdAt: new Date("2024-01-15"),
    description: "Software development",
  },
  {
    id: "inv-003",
    number: "INV-2024-003",
    amount: 2100.0,
    status: "overdue",
    dueDate: new Date("2024-01-20"),
    createdAt: new Date("2024-01-10"),
    description: "Project management services",
  },
];

export interface ClientInvoice {
  id: string;
  number: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "partially_paid";
  dueDate: Date;
  createdAt: Date;
  description: string;
}

export const clientInvoicesStore = derived(userProfile, ($userProfile) => {
  if (!$userProfile.data) return { data: [], loading: true, error: null };

  // Simulate loading
  return {
    data: mockClientInvoices,
    loading: false,
    error: null,
  };
});
