import { db } from "$lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { uploadFile, deleteFile } from "$lib/services/firebaseStorage";
import type {
  CompanyBranding,
  StoredCompanyBranding,
  BrandingServiceResult,
  LogoUploadResult,
  LogoUploadOptions,
} from "$lib/types/branding";
import { Timestamp } from "firebase/firestore";

// Collection name for company branding
const BRANDING_COLLECTION = "companyBranding";

/**
 * Service for managing company branding configuration and assets.
 *
 * This service handles company logo uploads to Firebase Storage and stores
 * branding configuration in Firestore. Logos are stored in the 'logos/{companyId}/'
 * path in Firebase Storage.
 *
 * Firebase Collections:
 * - companyBranding: Stores branding configuration
 * - Firebase Storage: Stores logo files
 *
 * Document Structure (companyBranding):
 * - companyId: string (document ID)
 * - logoUrl?: string (Firebase Storage download URL)
 * - stampText?: string
 * - stampPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
 * - stampFontSize?: number
 * - stampColor?: string
 * - primaryColor?: string
 * - secondaryColor?: string
 * - createdAt: Timestamp
 * - updatedAt: Timestamp
 */
export class BrandingService {
  /**
   * Save company branding configuration
   */
  async saveBranding(
    companyId: string,
    branding: CompanyBranding,
  ): Promise<BrandingServiceResult> {
    try {
      const docRef = doc(db, BRANDING_COLLECTION, companyId);
      const now = Timestamp.now();

      const storedBranding: StoredCompanyBranding = {
        ...branding,
        companyId,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(docRef, storedBranding);

      return { success: true };
    } catch (error) {
      console.error("Error saving branding:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save branding configuration",
      };
    }
  }

  /**
   * Load company branding configuration
   */
  async loadBranding(companyId: string): Promise<BrandingServiceResult> {
    try {
      const docRef = doc(db, BRANDING_COLLECTION, companyId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: true, branding: null };
      }

      const data = docSnap.data() as StoredCompanyBranding;

      // Remove Firebase metadata from response
      const { companyId: _, createdAt, updatedAt, ...branding } = data;

      return { success: true, branding };
    } catch (error) {
      console.error("Error loading branding:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load branding configuration",
      };
    }
  }

  /**
   * Update existing branding configuration (creates if doesn't exist)
   */
  async updateBranding(
    companyId: string,
    updates: Partial<CompanyBranding>,
  ): Promise<BrandingServiceResult> {
    try {
      const docRef = doc(db, BRANDING_COLLECTION, companyId);
      const now = Timestamp.now();

      const updateData: Partial<StoredCompanyBranding> = {
        ...updates,
        updatedAt: now,
      };

      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(docRef, updateData);
      } else {
        // Create new document with defaults
        const storedBranding: StoredCompanyBranding = {
          companyId,
          createdAt: now,
          updatedAt: now,
          ...updates,
        };
        await setDoc(docRef, storedBranding);
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating branding:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update branding configuration",
      };
    }
  }

  /**
   * Upload company logo to Firebase Storage
   */
  async uploadLogo(
    companyId: string,
    file: File,
    options: LogoUploadOptions = {},
  ): Promise<LogoUploadResult> {
    try {
      // Set default options for logos
      const uploadOptions = {
        maxSize: 2 * 1024 * 1024, // 2MB default
        allowedTypes: [
          "image/jpeg",
          "image/png",
          "image/svg+xml",
          "image/webp",
        ],
        maxWidth: 2000,
        maxHeight: 2000,
        path: `logos/${companyId}`,
        ...options,
      };

      // Validate file type
      if (!uploadOptions.allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: `File type ${file.type} is not allowed. Allowed types: ${uploadOptions.allowedTypes.join(", ")}`,
        };
      }

      // Validate file size
      if (file.size > uploadOptions.maxSize) {
        return {
          success: false,
          error: `File size exceeds maximum allowed size of ${uploadOptions.maxSize / (1024 * 1024)}MB`,
        };
      }

      // Validate dimensions for non-SVG files
      if (
        file.type !== "image/svg+xml" &&
        uploadOptions.maxWidth &&
        uploadOptions.maxHeight
      ) {
        try {
          const dimensions = await this.getImageDimensions(file);
          if (
            dimensions.width > uploadOptions.maxWidth ||
            dimensions.height > uploadOptions.maxHeight
          ) {
            return {
              success: false,
              error: `Image dimensions must be ${uploadOptions.maxWidth}x${uploadOptions.maxHeight} pixels or smaller. Selected image is ${dimensions.width}x${dimensions.height} pixels.`,
            };
          }
        } catch (error) {
          console.warn("Could not validate image dimensions:", error);
          // Continue with upload - let Firebase handle it
        }
      }

      // Validate file size
      if (file.size > uploadOptions.maxSize) {
        return {
          success: false,
          error: `File size exceeds maximum allowed size of ${uploadOptions.maxSize / (1024 * 1024)}MB`,
        };
      }

      // Upload file
      const result = await uploadFile(
        file,
        `logo-${Date.now()}`,
        uploadOptions,
      );

      if (!result.success) {
        return result;
      }

      // Get image dimensions if it's an image (not SVG)
      let dimensions: { width?: number; height?: number } = {};
      if (file.type !== "image/svg+xml") {
        try {
          dimensions = await this.getImageDimensions(file);
        } catch (error) {
          console.warn("Could not get image dimensions:", error);
        }
      }

      return {
        success: true,
        url: result.url,
        path: result.path,
        ...dimensions,
      };
    } catch (error) {
      console.error("Error uploading logo:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload logo",
      };
    }
  }

  /**
   * Delete company logo from Firebase Storage
   */
  async deleteLogo(logoPath: string): Promise<boolean> {
    try {
      return await deleteFile(logoPath);
    } catch (error) {
      console.error("Error deleting logo:", error);
      return false;
    }
  }

  /**
   * Update branding with new logo URL (handles old logo cleanup)
   */
  async updateLogo(
    companyId: string,
    newLogoUrl: string,
  ): Promise<BrandingServiceResult> {
    try {
      // Load current branding to get old logo
      const currentResult = await this.loadBranding(companyId);
      if (!currentResult.success) {
        return currentResult;
      }

      const currentBranding = currentResult.branding;

      // Delete old logo if it exists
      if (currentBranding?.logoUrl && currentBranding.logoUrl !== newLogoUrl) {
        // Extract path from URL or try to find it
        // Note: This is a simplified approach - in production you might store the path separately
        try {
          // If the old logo is in Firebase Storage, try to delete it
          // This assumes the path can be derived from the URL
          const oldPath = this.extractPathFromUrl(currentBranding.logoUrl);
          if (oldPath) {
            await this.deleteLogo(oldPath);
          }
        } catch (error) {
          console.warn("Could not delete old logo:", error);
        }
      }

      // Update branding with new logo
      return await this.updateBranding(companyId, {
        logoUrl: newLogoUrl,
        // Store the path for future deletion (you might want to add this to the schema)
      });
    } catch (error) {
      console.error("Error updating logo:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update logo",
      };
    }
  }

  /**
   * Upload company stamp image to Firebase Storage
   */
  async uploadStampImage(
    companyId: string,
    file: File,
    options: LogoUploadOptions = {},
  ): Promise<LogoUploadResult> {
    try {
      // Set default options for stamp images (smaller than logos)
      const uploadOptions = {
        maxSize: 1 * 1024 * 1024, // 1MB default for stamps
        allowedTypes: [
          "image/jpeg",
          "image/png",
          "image/svg+xml",
          "image/webp",
        ],
        maxWidth: 500,
        maxHeight: 500,
        path: `stamps/${companyId}`,
        ...options,
      };

      // Validate file type
      if (!uploadOptions.allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: `File type ${file.type} is not allowed. Allowed types: ${uploadOptions.allowedTypes.join(", ")}`,
        };
      }

      // Validate file size
      if (file.size > uploadOptions.maxSize) {
        return {
          success: false,
          error: `File size exceeds maximum allowed size of ${uploadOptions.maxSize / (1024 * 1024)}MB`,
        };
      }

      // Validate dimensions for non-SVG files
      if (
        file.type !== "image/svg+xml" &&
        uploadOptions.maxWidth &&
        uploadOptions.maxHeight
      ) {
        try {
          const dimensions = await this.getImageDimensions(file);
          if (
            dimensions.width > uploadOptions.maxWidth ||
            dimensions.height > uploadOptions.maxHeight
          ) {
            return {
              success: false,
              error: `Image dimensions must be ${uploadOptions.maxWidth}x${uploadOptions.maxHeight} pixels or smaller. Selected image is ${dimensions.width}x${dimensions.height} pixels.`,
            };
          }
        } catch (error) {
          console.warn("Could not validate image dimensions:", error);
          // Continue with upload - let Firebase handle it
        }
      }

      // Upload file
      const result = await uploadFile(
        file,
        `stamp-${Date.now()}`,
        uploadOptions,
      );

      if (!result.success) {
        return result;
      }

      // Get image dimensions if it's an image (not SVG)
      let dimensions: { width?: number; height?: number } = {};
      if (file.type !== "image/svg+xml") {
        try {
          dimensions = await this.getImageDimensions(file);
        } catch (error) {
          console.warn("Could not get image dimensions:", error);
        }
      }

      return {
        success: true,
        url: result.url,
        path: result.path,
        ...dimensions,
      };
    } catch (error) {
      console.error("Error uploading stamp image:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload stamp image",
      };
    }
  }

  /**
   * Update branding with new stamp image URL (handles old stamp cleanup)
   */
  async updateStampImage(
    companyId: string,
    newStampImageUrl: string,
  ): Promise<BrandingServiceResult> {
    try {
      // Load current branding to get old stamp image
      const currentResult = await this.loadBranding(companyId);
      if (!currentResult.success) {
        return currentResult;
      }

      const currentBranding = currentResult.branding;

      // Delete old stamp image if it exists
      if (
        currentBranding?.stampImageUrl &&
        currentBranding.stampImageUrl !== newStampImageUrl
      ) {
        try {
          const oldPath = this.extractPathFromUrl(
            currentBranding.stampImageUrl,
          );
          if (oldPath) {
            await this.deleteLogo(oldPath); // Reuse delete method
          }
        } catch (error) {
          console.warn("Could not delete old stamp image:", error);
        }
      }

      // Update branding with new stamp image
      return await this.updateBranding(companyId, {
        stampImageUrl: newStampImageUrl,
      });
    } catch (error) {
      console.error("Error updating stamp image:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update stamp image",
      };
    }
  }

  /**
   * Get image dimensions from file
   */
  private async getImageDimensions(
    file: File,
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not load image"));
      };

      img.src = url;
    });
  }

  /**
   * Extract Firebase Storage path from download URL
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?...
      const urlObj = new URL(url);
      if (urlObj.hostname === "firebasestorage.googleapis.com") {
        const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
        if (pathMatch) {
          return decodeURIComponent(pathMatch[1]);
        }
      }
      return null;
    } catch (error) {
      console.warn("Could not extract path from URL:", error);
      return null;
    }
  }
}

// Export singleton instance
export const brandingService = new BrandingService();
