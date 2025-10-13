import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSMTPConfig } from "./useSMTPConfig";

// Mock the SMTP service
vi.mock("$lib/services/smtpService", () => ({
  smtpService: {
    loadSMTPConfig: vi.fn(),
    saveSMTPConfig: vi.fn(),
  },
}));

// Mock the email service
vi.mock("$lib/services/emailService", () => ({
  emailService: {
    setSMTPConfig: vi.fn(),
  },
}));

describe("useSMTPConfig Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty state", () => {
    const smtpStore = useSMTPConfig();

    expect(smtpStore.subscribe).toBeDefined();
    expect(smtpStore.initialize).toBeDefined();
    expect(smtpStore.saveConfig).toBeDefined();
    expect(smtpStore.getCurrentConfig).toBeDefined();
  });

  it("should initialize and load SMTP config", async () => {
    const { smtpService } = await import("$lib/services/smtpService");
    const { emailService } = await import("$lib/services/emailService");

    const mockConfig = {
      enabled: true,
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: "test@example.com", pass: "password" },
      fromEmail: "noreply@example.com",
      fromName: "Test Company",
    };

    (smtpService.loadSMTPConfig as any).mockResolvedValue({
      success: true,
      config: mockConfig,
    });

    const smtpStore = useSMTPConfig();
    await smtpStore.initialize("company-1");

    expect(smtpService.loadSMTPConfig).toHaveBeenCalledWith("company-1");
    expect(emailService.setSMTPConfig).toHaveBeenCalledWith(mockConfig);
  });

  it("should save SMTP configuration", async () => {
    const { smtpService } = await import("$lib/services/smtpService");

    (smtpService.saveSMTPConfig as any).mockResolvedValue({
      success: true,
    });

    const smtpStore = useSMTPConfig();
    const mockConfig = {
      enabled: true,
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: "test@example.com", pass: "password" },
      fromEmail: "noreply@example.com",
      fromName: "Test Company",
    };

    const result = await smtpStore.saveConfig("company-1", mockConfig);

    expect(result.success).toBe(true);
    expect(smtpService.saveSMTPConfig).toHaveBeenCalledWith(
      "company-1",
      mockConfig,
    );
  });
});
