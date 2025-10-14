import type { Timestamp } from "@firebase/firestore";

export interface Invitation {
  code: string; // Unique invitation code
  companyId: string;
  createdBy: string; // UID of company user who created the invitation
  createdAt: Timestamp;
  expiresAt: Timestamp;
  usedBy?: string; // UID of user who used the invitation
  usedAt?: Timestamp;
  status: "active" | "used" | "expired";
  email?: string; // Email address of the invited user
  role: "client"; // For now, invitations are for clients
}
