import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CompanyBranding } from "$lib/types/branding";

// Mock Firebase
vi.mock("$lib/firebase", () => ({
  db: {},
}));

// Mock Firebase Storage
vi.mock("$lib/services/firebaseStorage", () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
}));

// Get mock functions from the mocked module
const { doc, getDoc, setDoc, updateDoc, Timestamp } = await import(
  "firebase/firestore"
);

// Import after mocks
import { brandingService } from "./brandingService";

describe("BrandingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
  });

  const mockBranding: CompanyBranding = {
    logoUrl: "https://example.com/logo.png",
    stampImageUrl: "https://example.com/stamp.png",
    stampPosition: "bottom-right",
    primaryColor: "#007bff",
    secondaryColor: "#6c757d",
  };

  describe("saveBranding", () => {
    it("should save branding configuration successfully", async () => {
      mockSetDoc.mockResolvedValue(undefined);

      const result = await brandingService.saveBranding(
        "company-1",
        mockBranding,
      );

      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        "mock-doc-ref",
        expect.objectContaining({
          companyId: "company-1",
          logoUrl: "https://example.com/logo.png",
          stampImageUrl: "https://example.com/stamp.png",
          stampPosition: "bottom-right",
          stampFontSize: 12,
          stampColor: "#000000",
          primaryColor: "#007bff",
          secondaryColor: "#6c757d",
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
        }),
      );
    });

    it("should handle save errors", async () => {
      const error = new Error("Firestore error");
      mockSetDoc.mockRejectedValue(error);

      const result = await brandingService.saveBranding(
        "company-1",
        mockBranding,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Firestore error");
    });
  });

  describe("loadBranding", () => {
    it("should load branding configuration successfully", async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          companyId: "company-1",
          logoUrl: "https://example.com/logo.png",
          stampImageUrl: "https://example.com/stamp.png",
          stampPosition: "bottom-right",
          stampFontSize: 12,
          stampColor: "#000000",
          primaryColor: "#007bff",
          secondaryColor: "#6c757d",
          createdAt: { seconds: 1234567890, nanoseconds: 0 },
          updatedAt: { seconds: 1234567890, nanoseconds: 0 },
        }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await brandingService.loadBranding("company-1");

      expect(result.success).toBe(true);
      expect(result.branding).toEqual(mockBranding);
    });

    it("should return null when no branding exists", async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await brandingService.loadBranding("company-1");

      expect(result.success).toBe(true);
      expect(result.branding).toBeNull();
    });

    it("should handle load errors", async () => {
      const error = new Error("Firestore error");
      mockGetDoc.mockRejectedValue(error);

      const result = await brandingService.loadBranding("company-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Firestore error");
    });
  });

  describe("updateBranding", () => {
    it("should update branding configuration successfully", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const updates = { stampImageUrl: "https://example.com/new-stamp.png" };
      const result = await brandingService.updateBranding("company-1", updates);

      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        "mock-doc-ref",
        expect.objectContaining({
          stampImageUrl: "https://example.com/new-stamp.png",
          updatedAt: expect.any(Object),
        }),
      );
    });

    it("should handle update errors", async () => {
      const error = new Error("Update failed");
      mockUpdateDoc.mockRejectedValue(error);

      const result = await brandingService.updateBranding("company-1", {
        stampImageUrl: "https://example.com/new-stamp.png",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });

  describe("uploadLogo", () => {
    it("should upload logo successfully", async () => {
      const mockFile = new File(["logo content"], "logo.png", {
        type: "image/png",
      });
      const mockUploadResult = {
        success: true,
        url: "https://storage.googleapis.com/logos/logo.png",
        path: "logos/company-1/logo.png",
      };

      const { uploadFile } = await import("$lib/services/firebaseStorage");
      (uploadFile as any).mockResolvedValue(mockUploadResult);

      const result = await brandingService.uploadLogo("company-1", mockFile);

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://storage.googleapis.com/logos/logo.png");
      expect(result.path).toBe("logos/company-1/logo.png");
    });

    it("should validate file size", async () => {
      const largeFile = new File(["x".repeat(3 * 1024 * 1024)], "large.png", {
        type: "image/png",
      });

      const result = await brandingService.uploadLogo("company-1", largeFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain("File size exceeds maximum allowed size");
    });

    it("should validate file type", async () => {
      const invalidFile = new File(["content"], "document.txt", {
        type: "text/plain",
      });

      const result = await brandingService.uploadLogo("company-1", invalidFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain("not allowed");
    });
  });

  describe("updateLogo", () => {
    it("should update logo URL and clean up old logo", async () => {
      // Mock existing branding with old logo
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          companyId: "company-1",
          logoUrl: "https://storage.googleapis.com/logos/old-logo.png",
          createdAt: { seconds: 1234567890, nanoseconds: 0 },
          updatedAt: { seconds: 1234567890, nanoseconds: 0 },
        }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnap);
      mockUpdateDoc.mockResolvedValue(undefined);

      const { deleteFile } = await import("$lib/services/firebaseStorage");
      (deleteFile as any).mockResolvedValue(true);

      const result = await brandingService.updateLogo(
        "company-1",
        "https://storage.googleapis.com/logos/new-logo.png",
      );

      expect(result.success).toBe(true);
      expect(deleteFile).toHaveBeenCalled(); // Should attempt to delete old logo
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        "mock-doc-ref",
        expect.objectContaining({
          logoUrl: "https://storage.googleapis.com/logos/new-logo.png",
        }),
      );
    });
  });
});
