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
    stampPosition: "bottom-right",
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
          stampPosition: "bottom-right",
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
});
