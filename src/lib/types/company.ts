import type { Timestamp } from "@firebase/firestore";

export interface Company {
  name: string;
  code: string; // Unique company code for joining
  description?: string;
  ownerId: string; // UID of the company owner
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Company settings
  settings: {
    timezone: string;
    currency: string;
    language: string;
    emailNotifications: boolean;
  };

  // Metadata
  isActive: boolean;
  memberCount: number;
}
