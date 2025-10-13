import type { Timestamp } from "firebase/firestore";

// SMTP Configuration types
export interface SMTPConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
}

// Stored SMTP Configuration (with Firebase metadata)
export interface StoredSMTPConfig extends Omit<SMTPConfig, "auth"> {
  companyId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Password is encrypted before storage
  encryptedPassword: string;
  auth: {
    user: string;
    // pass is removed and stored as encryptedPassword
  };
}

// SMTP Service response types
export interface SMTPServiceResult {
  success: boolean;
  error?: string;
  config?: SMTPConfig | null;
}
