import { json, error, type RequestEvent } from "@sveltejs/kit";
import {
  validateTemplateData,
  fetchImageAsDataUrl,
} from "$lib/utils/template-rendering";
import { renderTemplate } from "$lib/utils/template-validation";
import type { DocumentTemplate } from "$lib/types/document";
import type { CompanyBranding } from "$lib/types/branding";
import { getDb } from "$lib/firebase-admin";
import { requireCompanyAccess } from "$lib/utils/server-company-validation";
import puppeteer from "puppeteer";
import { generateZATCAQRCode } from "$lib/utils/zatca";
import QRCode from "qrcode";
import { populateSystemVariables } from "$lib/services/systemVariableService";

/**
 * Generate a QR code image from text data
 * Uses the qrcode library to generate a data URL
 */
async function generateQRCodeImage(data: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 100,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.warn("QR code generation failed:", error);
    // Fallback to a simple placeholder
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  }
}

async function generatePdfFromHtml(
  html: string,
  branding?: CompanyBranding,
): Promise<Uint8Array> {
  let browser;
  try {
    // Launch Puppeteer browser with args for better PDF generation
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--font-render-hinting=none",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    });

    const page = await browser.newPage();

    // Set viewport for better PDF rendering
    await page.setViewport({ width: 794, height: 1123 }); // A4 size

    // Add CSS for better table and image rendering
    const styles = `
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          margin-bottom: 30px;
        }
        .company-info {
          margin-bottom: 20px;
        }
        .billing-info {
          margin-bottom: 30px;
        }
        .order-table {
          margin: 20px 0;
        }
        .totals {
          text-align: right;
          margin-top: 20px;
        }
        .total-row {
          margin-bottom: 5px;
        }
        .total-row.total {
          font-weight: bold;
          font-size: 18px;
          border-top: 2px solid #333;
          padding-top: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .zatca-qr-code {
          position: absolute !important;
          top: 20px !important;
          right: 20px !important;
          width: 100px !important;
          height: 100px !important;
        }
        .company-logo {
          text-align: center;
          margin-bottom: 20px;
        }
        .company-logo img {
          max-width: 200px;
          max-height: 100px;
        }
      </style>
    `;

    // Wrap HTML in proper document structure with styles
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          ${styles}
        </head>
        <body>
          <div class="invoice-container">
            ${html}
          </div>
        </body>
      </html>
    `;

    // Load HTML content
    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for images to load and log any failed images
    try {
      const failedImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        const failed: string[] = [];

        return new Promise<string[]>((resolve) => {
          let loaded = 0;
          const total = images.length;

          if (total === 0) {
            resolve([]);
            return;
          }

          images.forEach((img, index) => {
            if (img.complete && img.naturalHeight > 0) {
              loaded++;
              if (loaded === total) resolve(failed);
            } else {
              img.addEventListener("load", () => {
                loaded++;
                if (loaded === total) resolve(failed);
              });
              img.addEventListener("error", () => {
                failed.push(img.src);
                loaded++;
                if (loaded === total) resolve(failed);
              });
            }
          });

          // Timeout after 10 seconds
          setTimeout(() => resolve(failed), 10000);
        });
      });

      console.log("Images loaded, failed images:", failedImages);
    } catch (error) {
      console.warn("Error checking image loading:", error);
    }

    // Additional wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Generate PDF with better settings
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false,
    });

    return new Uint8Array(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export const POST = async ({ request, locals }: RequestEvent) => {
  try {
    console.log("Document generation API called");

    // Get Firestore database instance
    const db = getDb();

    // Get user from locals (set by auth hooks)
    const user = locals.user;
    console.log("User from locals:", user?.uid || "undefined");

    if (!user || !user.uid) {
      throw error(401, "Unauthorized");
    }

    const body = await request.json();
    const {
      templateId,
      data,
      format = "pdf",
      companyId,
      clientId,
      orderId,
    } = body;

    console.log("Request body:", {
      templateId,
      format,
      companyId,
      clientId,
      orderId,
    });

    if (!templateId || !data || !companyId) {
      throw error(
        400,
        "Missing required fields: templateId, data, and companyId",
      );
    }

    // Validate user has access to the company
    console.log(
      "Checking company access for user:",
      user.uid,
      "to company:",
      companyId,
    );
    await requireCompanyAccess(user.uid, companyId, "generate documents");
    console.log("Company access validated");

    // Fetch company branding data using admin SDK
    let branding: CompanyBranding | undefined;
    try {
      if (db) {
        const brandingDoc = await db
          .collection("companyBranding")
          .doc(companyId)
          .get();
        if (brandingDoc.exists) {
          const brandingData = brandingDoc.data();
          branding = {
            logoUrl: brandingData?.logoUrl,
            stampImageUrl: brandingData?.stampImageUrl,
            stampPosition: brandingData?.stampPosition,
            primaryColor: brandingData?.primaryColor,
            secondaryColor: brandingData?.secondaryColor,
          };
          console.log("Branding loaded successfully via admin SDK");
        } else {
          console.log("No branding document found for company");
        }
      }
    } catch (brandingError) {
      console.warn(
        "Failed to load branding for document generation:",
        brandingError,
      );
    }

    // Fetch company data for ZATCA QR code generation
    let companyData: any = null;
    if (db) {
      try {
        const companyDoc = await db
          .collection("companies")
          .doc(companyId)
          .get();
        if (companyDoc.exists) {
          companyData = companyDoc.data();
          console.log("Company data loaded for ZATCA generation");
        }
      } catch (companyError) {
        console.warn("Failed to load company data:", companyError);
      }
    }

    // Generate ZATCA QR code if company has required data
    if (
      companyData?.name &&
      companyData?.vatRegistrationNumber &&
      (data.total || data.totalAmount)
    ) {
      try {
        const totalAmount = data.total || data.totalAmount || 0;
        const vatAmount =
          data.vatAmount ||
          data.taxAmount ||
          (totalAmount * (data.taxRate || 0.15)) / 100 ||
          0;

        const zatcaData = {
          sellerName: companyData.name,
          vatNumber: companyData.vatRegistrationNumber,
          timestamp: data.date || new Date().toISOString(),
          totalAmount: totalAmount,
          vatAmount: vatAmount,
        };
        console.log("Generating ZATCA QR with data:", zatcaData);
        const qrCodeDataUrl = await generateZATCAQRCode(zatcaData);
        console.log(
          "ZATCA QR code generated, data URL length:",
          qrCodeDataUrl.length,
        );
        data.zatcaQRCode = qrCodeDataUrl;
        console.log("ZATCA QR code added to template data");
      } catch (zatcaError) {
        console.warn("Failed to generate ZATCA QR code:", zatcaError);
      }
    } else {
      console.log("ZATCA QR conditions not met:", {
        hasCompanyName: !!companyData?.name,
        hasVatNumber: !!companyData?.vatRegistrationNumber,
        hasTotal: !!(data.total || data.totalAmount),
      });
    }

    // Populate system variables from database
    console.log("Populating system variables...");
    const systemVariables = await populateSystemVariables({
      companyId,
      clientId,
      orderId,
      additionalData: data, // Merge user-provided data
    });

    // Merge system variables with existing data
    const mergedData = { ...systemVariables, ...data };

    // Add branding data to template data
    if (branding) {
      // Fetch and convert logo to data URL if available
      if (branding.logoUrl) {
        if (branding.logoUrl.startsWith("data:")) {
          mergedData.companyLogo = branding.logoUrl;
          console.log("Using existing data URL for company logo");
        } else {
          console.log(
            "Fetching company logo from Firebase Storage:",
            branding.logoUrl.substring(0, 50) + "...",
          );
          const logoDataUrl = await fetchImageAsDataUrl(branding.logoUrl);
          if (logoDataUrl) {
            mergedData.companyLogo = logoDataUrl;
            console.log("Successfully converted logo to data URL");
          } else {
            console.log("Failed to fetch logo, using placeholder");
            mergedData.companyLogo =
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
          }
        }
      }

      // Fetch and convert stamp to data URL if available
      if (branding.stampImageUrl) {
        if (branding.stampImageUrl.startsWith("data:")) {
          mergedData.companyStamp = branding.stampImageUrl;
          console.log("Using existing data URL for company stamp");
        } else {
          console.log(
            "Fetching company stamp from Firebase Storage:",
            branding.stampImageUrl.substring(0, 50) + "...",
          );
          const stampDataUrl = await fetchImageAsDataUrl(
            branding.stampImageUrl,
          );
          if (stampDataUrl) {
            mergedData.companyStamp = stampDataUrl;
            console.log("Successfully converted stamp to data URL");
          } else {
            console.log("Failed to fetch stamp, using placeholder");
            mergedData.companyStamp =
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
          }
        }
      }

      console.log("Branding data added to template data");
    } else {
      // Provide fallback values when branding cannot be loaded
      mergedData.companyLogo =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      mergedData.companyStamp =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
      console.log("Using fallback branding data (transparent placeholders)");
    }

    console.log("Final template data keys:", Object.keys(mergedData));
    console.log("Items data:", mergedData.items);
    console.log("ZATCA QR code present:", !!mergedData.zatcaQRCode);
    console.log(
      "Company logo URL:",
      mergedData.companyLogo?.substring(0, 50) + "...",
    );
    console.log(
      "Company stamp URL:",
      mergedData.companyStamp?.substring(0, 50) + "...",
    );

    // Fetch template from Firestore - ensure it belongs to the company
    console.log("Fetching template:", templateId, "for company:", companyId);
    const templateDoc = await db!
      .collection("documentTemplates")
      .where("companyId", "==", companyId)
      .where("__name__", "==", templateId)
      .limit(1)
      .get();

    if (templateDoc.empty) {
      console.error("Template not found or access denied:", {
        templateId,
        companyId,
      });
      throw error(404, "Template not found or access denied");
    }

    const templateData = templateDoc.docs[0].data();

    if (
      !templateData.htmlContent ||
      typeof templateData.htmlContent !== "string" ||
      !Array.isArray(templateData.placeholders) ||
      !templateData.createdAt ||
      !templateData.updatedAt
    ) {
      throw error(
        500,
        `Template ${templateId} is malformed. It is missing or has invalid 'htmlContent', 'placeholders', 'createdAt', or 'updatedAt' fields.`,
      );
    }

    const template: DocumentTemplate = {
      id: templateDoc.docs[0].id,
      ...templateData,
      createdAt: templateData.createdAt,
      updatedAt: templateData.updatedAt,
    } as DocumentTemplate;

    console.log(
      "Template HTML content:",
      template.htmlContent.substring(0, 300) + "...",
    );

    // Validate template data
    const validation = validateTemplateData(template, mergedData);
    if (!validation.isValid) {
      console.error("Template validation failed:", {
        templateId,
        missingFields: validation.missingFields,
        providedData: Object.keys(mergedData),
        requiredPlaceholders: template.placeholders
          .filter((p) => p.required)
          .map((p) => p.key),
      });
      throw error(
        400,
        `Missing required fields: ${validation.missingFields.join(", ")}`,
      );
    }

    // Render template
    let renderedHtml = renderTemplate(template, mergedData);
    console.log("Rendered HTML length:", renderedHtml.length);
    console.log("Rendered HTML preview:", renderedHtml.substring(0, 500));

    // Check for images in rendered HTML
    const imageMatches = renderedHtml.match(/<img[^>]*src="([^"]*)"[^>]*>/g);
    if (imageMatches) {
      console.log(
        "Found images in HTML:",
        imageMatches.map((match) => {
          const srcMatch = match.match(/src="([^"]*)"/);
          return srcMatch ? srcMatch[1].substring(0, 50) + "..." : "no src";
        }),
      );
    } else {
      console.log("No images found in rendered HTML");
    }

    // Branding is handled by template placeholders - no forced injection

    if (format === "html") {
      // Return HTML for preview
      return json({
        success: true,
        format: "html",
        content: renderedHtml,
        templateId,
        generatedAt: new Date().toISOString(),
        brandingApplied: !!branding,
      });
    } else if (format === "pdf") {
      // Generate PDF with branding
      const pdfBuffer = await generatePdfFromHtml(renderedHtml, branding);

      // In a real implementation, upload to Firebase Storage and return URL
      // For now, return base64 encoded PDF
      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      return json({
        success: true,
        format: "pdf",
        content: pdfBase64,
        templateId,
        generatedAt: new Date().toISOString(),
        fileName: `document-${templateId}-${Date.now()}.pdf`,
        brandingApplied: !!branding,
      });
    } else {
      throw error(400, 'Unsupported format. Use "html" or "pdf"');
    }
  } catch (err) {
    console.error("Document generation error:", err);
    console.error("Error details:", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
    });

    if (err instanceof Error && "status" in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, "Failed to generate document");
  }
};
