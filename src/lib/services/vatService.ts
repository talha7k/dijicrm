import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "$lib/firebase";
import type { VatConfig } from "$lib/utils/vat";

/**
 * Service for managing VAT configuration persistence in Firebase.
 *
 * This service handles the storage and retrieval of VAT settings for companies.
 * VAT configuration is now stored in a subcollection for consistency with other
 * company configurations.
 *
 * Firebase Collection: companies/{companyId}/vat
 * Document ID: "config"
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
      const docRef = doc(db, `companies/${companyId}/vat`, "config");

      const storedConfig = {
        ...config,
        updatedAt: new Date(),
      };

      await setDoc(docRef, storedConfig);

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
      const docRef = doc(db, `companies/${companyId}/vat`, "config");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: true, config: undefined };
      }

      const data = docSnap.data();

      const config: VatConfig = {
        rate: data.rate || 0.15,
        enabled: data.enabled !== false, // Default to true if not specified
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
      const docRef = doc(db, `companies/${companyId}/vat`, "config");

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(docRef, updateData);
      } else {
        // Create new document
        const newConfig: VatConfig = {
          rate: updates.rate || 0.15,
          enabled: updates.enabled !== false,
        };
        await setDoc(docRef, { ...newConfig, ...updateData });
      }

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
