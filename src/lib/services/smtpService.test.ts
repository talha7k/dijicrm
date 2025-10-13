import { describe, it, expect, vi, beforeEach } from "vitest";
import { smtpService } from "./smtpService";
import type { SMTPConfig } from "$lib/types/smtp";

// Mock Firebase
vi.mock("$lib/firebase", () => ({
  db: {},
}));

// Mock Firestore functions
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockTimestampNow = vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 }));

vi.mock("firebase/firestore", () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  Timestamp: {
    now: mockTimestampNow,
  },
}));

describe("SMTPService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue("mock-doc-ref");
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
      mockSetDoc.mockResolvedValue(undefined);

      const result = await smtpService.saveSMTPConfig(
        "company-1",
        mockSMTPConfig,
      );

      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
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
      mockSetDoc.mockRejectedValue(error);

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

      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await smtpService.loadSMTPConfig("company-1");

      expect(result.success).toBe(true);
      expect(result.config).toEqual(mockSMTPConfig);
    });

    it("should return null when no configuration exists", async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await smtpService.loadSMTPConfig("company-1");

      expect(result.success).toBe(true);
      expect(result.config).toBeNull();
    });

    it("should handle load errors", async () => {
      const error = new Error("Firestore error");
      mockGetDoc.mockRejectedValue(error);

      const result = await smtpService.loadSMTPConfig("company-1");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Firestore error");
    });
  });

  describe("updateSMTPConfig", () => {
    it("should update SMTP configuration successfully", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const updates = { enabled: false };
      const result = await smtpService.updateSMTPConfig("company-1", updates);

      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          enabled: false,
          updatedAt: expect.any(Object),
        }),
      );
    });

    it("should handle update errors", async () => {
      const error = new Error("Update failed");
      mockUpdateDoc.mockRejectedValue(error);

      const result = await smtpService.updateSMTPConfig("company-1", {
        enabled: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });

  describe("deleteSMTPConfig", () => {
    it("should delete SMTP configuration successfully", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const result = await smtpService.deleteSMTPConfig("company-1");

      expect(result.success).toBe(true);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
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

      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await smtpService.hasSMTPConfig("company-1");

      expect(result).toBe(true);
    });

    it("should return false when configuration does not exist", async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      mockGetDoc.mockResolvedValue(mockDocSnap);

      const result = await smtpService.hasSMTPConfig("company-1");

      expect(result).toBe(false);
    });
  });

  describe("password handling", () => {
    it("should not store plain passwords in Firestore", async () => {
      mockSetDoc.mockResolvedValue(undefined);

      await smtpService.saveSMTPConfig("company-1", mockSMTPConfig);

      const savedData = mockSetDoc.mock.calls[0][1];
      expect(savedData.auth.pass).toBeUndefined();
      expect(savedData.encryptedPassword).toBeDefined();
      expect(savedData.encryptedPassword).not.toBe(mockSMTPConfig.auth.pass);
    });
  });
});
