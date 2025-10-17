import { db } from "$lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import type {
  SMTPConfig,
  StoredSMTPConfig,
  SMTPServiceResult,
} from "$lib/types/smtp";
import { Timestamp } from "firebase/firestore";

// Collection name for SMTP configurations
const SMTP_COLLECTION = "smtpConfigurations";

/**
 * Service for managing SMTP configuration persistence in Firebase.
 *
 * This service handles the storage and retrieval of SMTP email server configurations
 * for companies. Passwords are encrypted before storage for security.
 *
 * Firebase Collection: smtpConfigurations
 * Document Structure:
 * - companyId: string (document ID)
 * - enabled: boolean
 * - host: string
 * - port: number
 * - secure: boolean
 * - auth: { user: string } (password stored separately as encryptedPassword)
 * - fromEmail: string
 * - fromName: string
 * - encryptedPassword: string (base64 encoded)
 * - createdAt: Timestamp
 * - updatedAt: Timestamp
 */
export class SMTPService {
  /**
   * Save SMTP configuration for a company
   */
  async saveSMTPConfig(
    companyId: string,
    config: SMTPConfig,
  ): Promise<SMTPServiceResult> {
    try {
      const docRef = doc(db, SMTP_COLLECTION, companyId);
      const now = Timestamp.now();

      // Encrypt sensitive data (basic encryption for demo - in production use proper encryption)
      const encryptedPassword = this.encryptPassword(config.auth.pass);

      const storedConfig: StoredSMTPConfig = {
        ...config,
        companyId,
        createdAt: now,
        updatedAt: now,
        encryptedPassword,
      };

      // Remove plain password from storage
      delete (storedConfig.auth as any).pass;

      await setDoc(docRef, storedConfig);

      return { success: true };
    } catch (error) {
      console.error("Error saving SMTP config:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save SMTP configuration",
      };
    }
  }

  /**
   * Load SMTP configuration for a company
   */
  async loadSMTPConfig(companyId: string): Promise<SMTPServiceResult> {
    try {
      const docRef = doc(db, SMTP_COLLECTION, companyId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: true, config: null };
      }

      const data = docSnap.data() as StoredSMTPConfig;

      // Decrypt password
      console.log("Encrypted password found:", !!data.encryptedPassword);
      const decryptedPassword = this.decryptPassword(
        data.encryptedPassword || "",
      );
      console.log("Password decrypted successfully:", !!decryptedPassword);

      const config: SMTPConfig = {
        enabled: data.enabled,
        host: data.host,
        port: data.port,
        secure: data.secure,
        auth: {
          user: data.auth.user,
          pass: decryptedPassword,
        },
        fromEmail: data.fromEmail,
        fromName: data.fromName,
      };

      console.log("Final SMTP config:", {
        ...config,
        auth: { ...config.auth, pass: config.auth.pass ? "***" : "EMPTY" },
      });

      return { success: true, config };
    } catch (error) {
      console.error("Error loading SMTP config:", error);
      // Return success with null config instead of throwing error
      // This allows graceful handling when permissions are denied or config doesn't exist
      return { success: true, config: null };
    }
  }

  /**
   * Update existing SMTP configuration
   */
  async updateSMTPConfig(
    companyId: string,
    config: Partial<SMTPConfig>,
  ): Promise<SMTPServiceResult> {
    try {
      const docRef = doc(db, SMTP_COLLECTION, companyId);
      const now = Timestamp.now();

      const updateData: Partial<StoredSMTPConfig> = {
        ...config,
        updatedAt: now,
      };

      // Encrypt password if provided
      if (config.auth?.pass) {
        updateData.encryptedPassword = this.encryptPassword(config.auth.pass);
        delete (updateData.auth as any).pass;
      }

      await updateDoc(docRef, updateData);

      return { success: true };
    } catch (error) {
      console.error("Error updating SMTP config:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update SMTP configuration",
      };
    }
  }

  /**
   * Delete SMTP configuration for a company
   */
  async deleteSMTPConfig(companyId: string): Promise<SMTPServiceResult> {
    try {
      const docRef = doc(db, SMTP_COLLECTION, companyId);
      await updateDoc(docRef, {
        enabled: false,
        updatedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting SMTP config:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete SMTP configuration",
      };
    }
  }

  /**
   * Check if SMTP configuration exists for a company
   */
  async hasSMTPConfig(companyId: string): Promise<boolean> {
    try {
      const result = await this.loadSMTPConfig(companyId);
      return result.success && result.config !== null;
    } catch (error) {
      console.error("Error checking SMTP config existence:", error);
      return false;
    }
  }

  /**
   * Basic password encryption (for demo purposes - use proper encryption in production)
   */
  private encryptPassword(password: string): string {
    // Simple base64 encoding for demo - replace with proper encryption
    return btoa(password);
  }

  /**
   * Basic password decryption
   */
  private decryptPassword(encryptedPassword: string): string {
    try {
      if (!encryptedPassword) {
        console.log("No encrypted password provided");
        return "";
      }
      console.log(
        "Attempting to decrypt password of length:",
        encryptedPassword.length,
      );
      const decrypted = atob(encryptedPassword);
      console.log("Password decrypted successfully");
      return decrypted;
    } catch (error) {
      console.error("Error decrypting password:", error);
      return "";
    }
  }
}

// Export singleton instance
export const smtpService = new SMTPService();
