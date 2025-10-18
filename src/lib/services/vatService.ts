import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "$lib/firebase";
import type { VatConfig } from "$lib/utils/vat";

/**
 * Service for managing VAT configuration persistence in Firebase.
 *
 * This service handles the storage and retrieval of VAT settings for companies.
 * VAT configuration is stored in the main company document for optimal performance.
 *
 * Firebase Collection: companies/{companyId}
 * Document Structure (stored in main company document as vatConfig):
 * - vatConfig.rate: number
 * - vatConfig.enabled: boolean
 * - vatConfig.updatedAt: Date
 */
export class VatService {
  /**
   * Save VAT configuration for a company
   */
  async saveVatConfig(
    companyId: string,
    config: VatConfig,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const companyDocRef = doc(db, "companies", companyId);

      const storedConfig = {
        vatConfig: {
          ...config,
          updatedAt: new Date(),
        },
      };

      await updateDoc(companyDocRef, storedConfig);

      return { success: true };
    } catch (error) {
      console.error("Error saving VAT config:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save VAT configuration",
      };
    }
  }

  /**
   * Load VAT configuration for a company
   */
  async loadVatConfig(
    companyId: string,
  ): Promise<{ success: boolean; config?: VatConfig; error?: string }> {
    try {
      const companyDocRef = doc(db, "companies", companyId);
      const docSnap = await getDoc(companyDocRef);

      if (!docSnap.exists()) {
        return { success: true, config: undefined };
      }

      const companyData = docSnap.data();
      const vatConfig = companyData?.vatConfig;

      if (!vatConfig) {
        return { success: true, config: undefined };
      }

      const config: VatConfig = {
        rate: vatConfig.rate || 0.15,
        enabled: vatConfig.enabled !== false, // Default to true if not specified
      };

      return { success: true, config };
    } catch (error) {
      console.error("Error loading VAT config:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load VAT configuration",
      };
    }
  }

  /**
   * Update existing VAT configuration
   */
  async updateVatConfig(
    companyId: string,
    updates: Partial<VatConfig>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const companyDocRef = doc(db, "companies", companyId);

      const updateData = {
        vatConfig: {
          ...updates,
          updatedAt: new Date(),
        },
      };

      await updateDoc(companyDocRef, updateData);

      return { success: true };
    } catch (error) {
      console.error("Error updating VAT config:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update VAT configuration",
      };
    }
  }
}

// Export singleton instance
export const vatService = new VatService();
