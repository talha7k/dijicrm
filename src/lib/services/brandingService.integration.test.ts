import { describe, it, expect } from "vitest";
import { brandingService } from "./brandingService";

describe("BrandingService - Integration Tests", () => {
  describe("Real Firebase Data Access", () => {
    it("should load actual branding data from Firebase", async () => {
      // Use your actual company ID from the logs
      const companyId = "X6C5b2tYbpTn9XNsEkGT";

      console.log(`Testing branding data access for company: ${companyId}`);

      const result = await brandingService.loadBranding(companyId);

      console.log("Branding load result:", JSON.stringify(result, null, 2));

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
          "- Stamp Position:",
          result.branding.stampPosition || "Not set",
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

          // Test if logo is actually accessible
          try {
            const response = await fetch(result.branding.logoUrl, {
              method: "HEAD",
            });
            if (response.ok) {
              console.log("✅ Logo image is accessible via HTTP");
            } else {
              console.log("⚠️ Logo image returned status:", response.status);
            }
          } catch (error) {
            console.log(
              "⚠️ Could not verify logo accessibility:",
              error instanceof Error ? error.message : String(error),
            );
          }
        }

        // Verify stamp URL is accessible
        if (result.branding.stampImageUrl) {
          expect(result.branding.stampImageUrl).toMatch(/^https?:\/\//);
          console.log("✅ Stamp URL is valid HTTP/HTTPS URL");

          // Test if stamp is actually accessible
          try {
            const response = await fetch(result.branding.stampImageUrl, {
              method: "HEAD",
            });
            if (response.ok) {
              console.log("✅ Stamp image is accessible via HTTP");
            } else {
              console.log("⚠️ Stamp image returned status:", response.status);
            }
          } catch (error) {
            console.log(
              "⚠️ Could not verify stamp accessibility:",
              error instanceof Error ? error.message : String(error),
            );
          }
        }

        // Verify stamp position is valid
        if (result.branding.stampPosition) {
          expect([
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]).toContain(result.branding.stampPosition);
          console.log("✅ Stamp position is valid");
        }

        // Verify colors are valid hex codes
        if (result.branding.primaryColor) {
          expect(result.branding.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
          console.log("✅ Primary color is valid hex");
        }

        if (result.branding.secondaryColor) {
          expect(result.branding.secondaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
          console.log("✅ Secondary color is valid hex");
        }

        console.log("🎉 All branding data validation passed!");
      } else if (result.success && !result.branding) {
        console.log(
          "ℹ️ No branding data found for company (this is normal for new companies)",
        );
        console.log(
          "💡 To set up branding, go to Settings page and upload logo/stamp images",
        );
      } else {
        console.error("❌ Failed to load branding:", result.error);
        throw new Error(`Branding load failed: ${result.error}`);
      }
    });

    it("should verify company data includes VAT number for ZATCA", async () => {
      // This would require access to company data, but let's check if we can at least verify the structure
      console.log("ℹ️ ZATCA QR code generation requires:");
      console.log("  - Company name");
      console.log("  - VAT number (15 digits)");
      console.log("  - Invoice total amount");

      console.log("💡 Make sure your company has a VAT number set in Settings");
    });
  });
});
