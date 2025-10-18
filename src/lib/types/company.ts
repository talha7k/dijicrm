import type { Timestamp } from "@firebase/firestore";

export interface Company {
  name: string;
  code: string; // Unique company code for joining
  description?: string;
  vatNumber?: string; // 15-digit Saudi VAT number
  ownerId: string; // UID of the company owner
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Company settings
  settings: {
    timezone: string;
    currency: string;
    language: string;
    emailNotifications: boolean;
    vatAmount: number;
  };

  // Company configurations (stored in main document)
  smtpConfig?: {
    enabled: boolean;
    host: string;
    port: string;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    fromEmail: string;
    fromName: string;
  };

  brandingConfig?: {
    logoUrl?: string;
    stampUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    companyName?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };

  vatConfig?: {
    enabled: boolean;
    rate: number;
    registrationNumber?: string;
  };

  // Metadata
  isActive: boolean;
  memberCount: number;
}

// Company context for managing active company state
export interface CompanyContext {
  companyId: string;
  company: Company;
  role: "member" | "admin" | "owner";
  permissions: string[];
  smtpConfig?: any;
  brandingConfig?: any;
  vatConfig?: any;
}
