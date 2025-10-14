import type { Timestamp } from "@firebase/firestore";

export interface CompanyMember {
  id?: string; // Composite key: `${userId}-${companyId}`, optional for creation
  userId: string;
  companyId: string;
  role: "member" | "admin" | "owner";
  joinedAt: Timestamp;
  invitedBy?: string; // UID of who invited them
  status: "active" | "inactive" | "pending";
  permissions: string[]; // Specific permissions for this company
}
