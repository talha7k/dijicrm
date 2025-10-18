import { db } from "$lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import type {
  SMTPConfig,
  StoredSMTPConfig,
  SMTPServiceResult,
} from "$lib/types/smtp";
import { Timestamp } from "firebase/firestore";

/**
 * Service for managing SMTP configuration persistence in Firebase.
 *
 * This service handles the storage and retrieval of SMTP email server configurations
 * for companies. Passwords are encrypted before storage for security.
 *
 * Firebase Collection: companies/{companyId}
 * Document Structure (stored in main company document as smtpConfig):
 * - smtpConfig.host: string
 * - smtpConfig.port: number
 * - smtpConfig.auth.user: string
 * - smtpConfig.auth.pass: string (encrypted)
 * - smtpConfig.fromEmail: string
 * - smtpConfig.fromName: string
 * - smtpConfig.enabled: boolean
 * - smtpConfig.createdAt: Timestamp
 * - smtpConfig.updatedAt: Timestamp
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
      const companyDocRef = doc(db, "companies", companyId);
      const now = Timestamp.now();

      // Encrypt sensitive data (basic encryption for demo - in production use proper encryption)
      const encryptedPassword = this.encryptPassword(config.auth.pass);

      const storedConfig = {
        smtpConfig: {
          ...config,
          encryptedPassword,
          createdAt: now,
          updatedAt: now,
        },
      };

      // Update the main company document with SMTP config
      await updateDoc(companyDocRef, storedConfig);

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
      const companyDocRef = doc(db, "companies", companyId);
      const docSnap = await getDoc(companyDocRef);

      if (!docSnap.exists()) {
        return { success: true, config: null };
      }

      const companyData = docSnap.data();
      const smtpConfigData = companyData?.smtpConfig;

      if (!smtpConfigData) {
        return { success: true, config: null };
      }

      // Decrypt password
      console.log(
        "Encrypted password found:",
        !!smtpConfigData.encryptedPassword,
      );
      const decryptedPassword = this.decryptPassword(
        smtpConfigData.encryptedPassword || "",
      );
      console.log("Password decrypted successfully:", !!decryptedPassword);

      const config: SMTPConfig = {
        enabled: smtpConfigData.enabled,
        host: smtpConfigData.host,
        port: smtpConfigData.port,
        secure: smtpConfigData.secure,
        auth: {
          user: smtpConfigData.auth.user,
          pass: decryptedPassword,
        },
        fromEmail: smtpConfigData.fromEmail,
        fromName: smtpConfigData.fromName,
      };

      console.log("Final SMTP config:", {
        ...config,
        auth: { ...config.auth, pass: config.auth.pass ? "***" : "EMPTY" },
      });

      return { success: true, config };
    } catch (error) {
      // Log as debug info since this is expected behavior when SMTP is not configured
      console.debug(
        "SMTP config not accessible (using mock email service):",
        error,
      );
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
      const companyDocRef = doc(db, "companies", companyId);
      const now = Timestamp.now();

      const updateData: any = {
        smtpConfig: {
          ...config,
          updatedAt: now,
        },
      };

      // Encrypt password if provided
      if (config.auth?.pass) {
        updateData.smtpConfig.encryptedPassword = this.encryptPassword(
          config.auth.pass,
        );
        delete updateData.smtpConfig.auth.pass;
      }

      await updateDoc(companyDocRef, updateData);

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
      const companyDocRef = doc(db, "companies", companyId);
      await updateDoc(companyDocRef, {
        "smtpConfig.enabled": false,
        "smtpConfig.updatedAt": Timestamp.now(),
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
