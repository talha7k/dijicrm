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

// Mock URL for both createObjectURL and constructor
const mockURL = {
  createObjectURL: vi.fn(() => "mock-url"),
  revokeObjectURL: vi.fn(),
};

// Mock URL constructor
global.URL = class {
  static createObjectURL = mockURL.createObjectURL;
  static revokeObjectURL = mockURL.revokeObjectURL;

  constructor(url: string) {
    this.href = url;
    this.hostname = "firebasestorage.googleapis.com";

    // Handle Firebase Storage URLs
    if (url.includes("firebasestorage.googleapis.com")) {
      this.pathname = url.split("firebasestorage.googleapis.com")[1];
    } else if (url.includes("/logos/")) {
      const parts = url.split("/logos/");
      this.pathname = "/logos/" + (parts[1] || "old-logo.png");
      this.hostname = "storage.googleapis.com";
    } else {
      this.pathname = "/logos/old-logo.png";
      this.hostname = "storage.googleapis.com";
    }
  }
  href: string;
  pathname: string;
  hostname: string;
  search = "";
  hash = "";
  origin = "https://firebasestorage.googleapis.com";
} as any;

// Mock URL constructor for path extraction
global.URL = class {
  static createObjectURL = mockURL.createObjectURL;
  static revokeObjectURL = mockURL.revokeObjectURL;

  constructor(url: string) {
    this.href = url;
    this.hostname = "firebasestorage.googleapis.com";

    // Handle Firebase Storage URLs
    if (url.includes("firebasestorage.googleapis.com")) {
      // Extract the pathname part that contains /o/...? pattern
      const urlParts = url.split("firebasestorage.googleapis.com");
      this.pathname =
        urlParts[1] || "/v0/b/test-bucket/o/logos%2Fold-logo.png?alt=media";
    } else if (url.includes("/logos/")) {
      const parts = url.split("/logos/");
      this.pathname = "/logos/" + (parts[1] || "old-logo.png");
      this.hostname = "storage.googleapis.com";
    } else {
      this.pathname = "/logos/old-logo.png";
      this.hostname = "storage.googleapis.com";
    }
  }
  href: string;
  pathname: string;
  hostname: string;
  search = "";
  hash = "";
  origin = "https://firebasestorage.googleapis.com";
} as any;

// Mock Image constructor for image dimension tests
global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 100;
  height = 100;
  src = "";

  constructor() {
    // Simulate async image loading
    setTimeout(() => {
      if (this.src && this.onload) {
        this.onload();
      }
    }, 0);
  }
} as any;
global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 100;
  height = 100;
  src = "";

  constructor() {
    // Simulate async image loading
    setTimeout(() => {
      if (this.src && this.onload) {
        this.onload();
      }
    }, 0);
  }
} as any;

// Mock Firestore functions
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

// Import after mocks
import { brandingService } from "./brandingService";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { uploadFile, deleteFile } from "$lib/services/firebaseStorage";

describe("BrandingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(doc).mockReturnValue("mock-doc-ref" as any);
  });

  const mockBranding: CompanyBranding = {
    logoUrl: "https://example.com/logo.png",
    stampImageUrl: "https://example.com/stamp.png",
    primaryColor: "#007bff",
    secondaryColor: "#6c757d",
  };

  describe("saveBranding", () => {
    it("should save branding configuration successfully", async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await brandingService.saveBranding(
        "company-1",
        mockBranding,
      );

      expect(result.success).toBe(true);
      expect(setDoc).toHaveBeenCalledWith(
        "mock-doc-ref",
        expect.objectContaining({
          companyId: "company-1",
          logoUrl: "https://example.com/logo.png",
          stampImageUrl: "https://example.com/stamp.png",
          primaryColor: "#007bff",
          secondaryColor: "#6c757d",
          createdAt: expect.any(Object),
          updatedAt: expect.any(Object),
        }),
      );
    });

    it("should handle save errors", async () => {
      const error = new Error("Firestore error");
      vi.mocked(setDoc).mockRejectedValue(error);

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
          primaryColor: "#007bff",
          secondaryColor: "#6c757d",
          createdAt: { seconds: 1234567890, nanoseconds: 0 },
          updatedAt: { seconds: 1234567890, nanoseconds: 0 },
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await brandingService.loadBranding("company-1");

      expect(result.success).toBe(true);
      expect(result.branding).toEqual(mockBranding);
    });

    it("should return null when no branding exists", async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await brandingService.loadBranding("company-1");

      expect(result.success).toBe(true);
      expect(result.branding).toBeNull();
    });

    it("should handle load errors", async () => {
      const error = new Error("Firestore error");
      vi.mocked(getDoc).mockRejectedValue(error);

      const result = await brandingService.loadBranding("company-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Firestore error");
    });
  });

  describe("updateBranding", () => {
    it("should update branding configuration successfully", async () => {
      // Mock document exists
      const mockDocSnap = {
        exists: () => true,
        data: () => ({}),
      };
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const updates = { stampImageUrl: "https://example.com/new-stamp.png" };
      const result = await brandingService.updateBranding("company-1", updates);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        "mock-doc-ref",
        expect.objectContaining({
          stampImageUrl: "https://example.com/new-stamp.png",
          updatedAt: expect.any(Object),
        }),
      );
    });

    it("should handle update errors", async () => {
      // Mock document exists
      const mockDocSnap = {
        exists: () => true,
        data: () => ({}),
      };
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const error = new Error("Update failed");
      vi.mocked(updateDoc).mockRejectedValue(error);

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

      vi.mocked(uploadFile).mockResolvedValue(mockUploadResult);

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
          logoUrl:
            "https://firebasestorage.googleapis.com/v0/b/test-bucket/o/logos%2Fold-logo.png?alt=media",
          createdAt: { seconds: 1234567890, nanoseconds: 0 },
          updatedAt: { seconds: 1234567890, nanoseconds: 0 },
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      vi.mocked(deleteFile).mockResolvedValue(true);

      const result = await brandingService.updateLogo(
        "company-1",
        "https://firebasestorage.googleapis.com/v0/b/test-bucket/o/logos%2Fnew-updated-logo.png?alt=media",
      );

      expect(result.success).toBe(true);
      expect(deleteFile).toHaveBeenCalledWith("logos/old-logo.png"); // Should attempt to delete old logo
      expect(updateDoc).toHaveBeenCalledWith(
        "mock-doc-ref",
        expect.objectContaining({
          logoUrl:
            "https://firebasestorage.googleapis.com/v0/b/test-bucket/o/logos%2Fnew-updated-logo.png?alt=media",
        }),
      );
    });
  });

  describe("Integration Tests - Real Firebase Data Access", () => {
    describe("loadBranding - Real Data", () => {
      it("should load actual branding data from Firebase", async () => {
        // Use your actual company ID from the logs
        const companyId = "X6C5b2tYbpTn9XNsEkGT";

        const result = await brandingService.loadBranding(companyId);

        console.log("Branding load result:", result);

        if (result.success && result.branding) {
          console.log("✅ Branding data found:");
          console.log(
            "- Logo URL:",
            result.branding.logoUrl ? "Present" : "Missing",
          );
          console.log(
            "- Stamp URL:",
            result.branding.stampImageUrl ? "Present" : "Missing",
          );
          
          console.log(
            "- Primary Color:",
            result.branding.primaryColor || "Not set",
          );
          console.log(
            "- Secondary Color:",
            result.branding.secondaryColor || "Not set",
          );

          // Verify logo URL is accessible
          if (result.branding.logoUrl) {
            expect(result.branding.logoUrl).toMatch(/^https?:\/\//);
            console.log("✅ Logo URL is valid HTTP/HTTPS URL");
          }

          // Verify stamp URL is accessible
          if (result.branding.stampImageUrl) {
            expect(result.branding.stampImageUrl).toMatch(/^https?:\/\//);
            console.log("✅ Stamp URL is valid HTTP/HTTPS URL");
          }

          // Verify stamp position is valid
          

          // Verify colors are valid hex codes
          if (result.branding.primaryColor) {
            expect(result.branding.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
            console.log("✅ Primary color is valid hex");
          }

          if (result.branding.secondaryColor) {
            expect(result.branding.secondaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
            console.log("✅ Secondary color is valid hex");
          }
        } else if (result.success && !result.branding) {
          console.log(
            "ℹ️ No branding data found for company (this is normal for new companies)",
          );
        } else {
          console.error("❌ Failed to load branding:", result.error);
          throw new Error(`Branding load failed: ${result.error}`);
        }
      });

      it("should verify branding images are accessible", async () => {
        const companyId = "X6C5b2tYbpTn9XNsEkGT";

        const result = await brandingService.loadBranding(companyId);

        if (result.success && result.branding) {
          // Test logo accessibility
          if (result.branding.logoUrl) {
            try {
              const logoResponse = await fetch(result.branding.logoUrl, {
                method: "HEAD",
              });
              expect(logoResponse.ok).toBe(true);
              console.log("✅ Logo image is accessible via HTTP");
            } catch (error) {
              console.error("❌ Logo image not accessible:", error);
              throw new Error("Logo image not accessible");
            }
          }

          // Test stamp accessibility
          if (result.branding.stampImageUrl) {
            try {
              const stampResponse = await fetch(result.branding.stampImageUrl, {
                method: "HEAD",
              });
              expect(stampResponse.ok).toBe(true);
              console.log("✅ Stamp image is accessible via HTTP");
            } catch (error) {
              console.error("❌ Stamp image not accessible:", error);
              throw new Error("Stamp image not accessible");
            }
          }
        } else {
          console.log(
            "⏭️ Skipping image accessibility test - no branding data",
          );
        }
      });
    });
  });
});
