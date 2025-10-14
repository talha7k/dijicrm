import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SMTPConfig } from "$lib/types/smtp";

// Mock Firebase
vi.mock("$lib/firebase", () => ({
  db: {},
}));

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
import { smtpService } from "./smtpService";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

describe("SMTPService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(doc).mockReturnValue("mock-doc-ref" as any);
  });

  const mockSMTPConfig: SMTPConfig = {
    enabled: true,
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "test@example.com",
      pass: "password123",
    },
    fromEmail: "noreply@example.com",
    fromName: "Test Company",
  };

  describe("saveSMTPConfig", () => {
    it("should save SMTP configuration successfully", async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await smtpService.saveSMTPConfig(
        "company-1",
        mockSMTPConfig,
      );

      expect(result.success).toBe(true);
      expect(setDoc).toHaveBeenCalledWith(
        "mock-doc-ref",
        expect.objectContaining({
          companyId: "company-1",
          enabled: true,
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: { user: "test@example.com" }, // password should be encrypted
          fromEmail: "noreply@example.com",
          fromName: "Test Company",
          encryptedPassword: expect.any(String), // password should be encrypted
        }),
      );
    });

    it("should handle save errors", async () => {
      const error = new Error("Firestore error");
      vi.mocked(setDoc).mockRejectedValue(error);

      const result = await smtpService.saveSMTPConfig(
        "company-1",
        mockSMTPConfig,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Firestore error");
    });
  });

  describe("loadSMTPConfig", () => {
    it("should load SMTP configuration successfully", async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          companyId: "company-1",
          enabled: true,
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: { user: "test@example.com" },
          fromEmail: "noreply@example.com",
          fromName: "Test Company",
          encryptedPassword: btoa("password123"), // base64 encoded
          createdAt: { seconds: 1234567890, nanoseconds: 0 },
          updatedAt: { seconds: 1234567890, nanoseconds: 0 },
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await smtpService.loadSMTPConfig("company-1");

      expect(result.success).toBe(true);
      expect(result.config).toEqual({
        ...mockSMTPConfig,
        auth: {
          ...mockSMTPConfig.auth,
          pass: "password123", // decrypted password
        },
      });
    });

    it("should return null when no SMTP config exists", async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await smtpService.loadSMTPConfig("company-1");

      expect(result.success).toBe(true);
      expect(result.config).toBeNull();
    });

    it("should handle load errors", async () => {
      const error = new Error("Firestore error");
      vi.mocked(getDoc).mockRejectedValue(error);

      await expect(smtpService.loadSMTPConfig("company-1")).rejects.toThrow(
        "Failed to load SMTP configuration",
      );
    });

    it("should return null when no configuration exists", async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await smtpService.loadSMTPConfig("company-1");

      expect(result.success).toBe(true);
      expect(result.config).toBeNull();
    });

    it("should handle load errors", async () => {
      const error = new Error("Firestore error");
      vi.mocked(getDoc).mockRejectedValue(error);

      await expect(smtpService.loadSMTPConfig("company-1")).rejects.toThrow(
        "Failed to load SMTP configuration",
      );
    });
  });

  describe("updateSMTPConfig", () => {
    it("should update SMTP configuration successfully", async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const updates = { enabled: false };
      const result = await smtpService.updateSMTPConfig("company-1", updates);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        "mock-doc-ref",
        expect.objectContaining({
          enabled: false,
          updatedAt: expect.any(Object),
        }),
      );
    });

    it("should handle update errors", async () => {
      const error = new Error("Update failed");
      vi.mocked(updateDoc).mockRejectedValue(error);

      const result = await smtpService.updateSMTPConfig("company-1", {
        enabled: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });

  describe("deleteSMTPConfig", () => {
    it("should delete SMTP configuration successfully", async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await smtpService.deleteSMTPConfig("company-1");

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        "mock-doc-ref",
        expect.objectContaining({
          enabled: false,
          updatedAt: expect.any(Object),
        }),
      );
    });
  });

  describe("hasSMTPConfig", () => {
    it("should return true when configuration exists", async () => {
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          enabled: true,
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: { user: "test@example.com" },
          fromEmail: "noreply@example.com",
          fromName: "Test Company",
          encryptedPassword: btoa("password123"),
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await smtpService.hasSMTPConfig("company-1");

      expect(result).toBe(true);
    });

    it("should return false when configuration does not exist", async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await smtpService.hasSMTPConfig("company-1");

      expect(result).toBe(false);
    });
  });

  describe("password handling", () => {
    it("should not store plain passwords in Firestore", async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await smtpService.saveSMTPConfig("company-1", mockSMTPConfig);

      const savedData = vi.mocked(setDoc).mock.calls[0][1] as any;
      expect(savedData.auth.pass).toBeUndefined();
      expect(savedData.encryptedPassword).toBeDefined();
      expect(savedData.encryptedPassword).not.toBe(mockSMTPConfig.auth.pass);
    });
  });
});
