import { json, error, type RequestEvent } from "@sveltejs/kit";
import {
  renderTemplate,
  validateTemplateData,
  injectBrandingIntoHtml,
} from "$lib/utils/template-rendering";
import type { DocumentTemplate } from "$lib/types/document";
import { brandingService } from "$lib/services/brandingService";
import type { CompanyBranding } from "$lib/types/branding";
import { Timestamp } from "firebase/firestore";

// Mock function - replace with actual PDF generation
async function generatePdfFromHtml(
  html: string,
  branding?: CompanyBranding,
): Promise<Uint8Array> {
  // In a real implementation, this would use Puppeteer or similar
  // For now, return a mock PDF buffer with branding info
  let brandingInfo = "";
  if (branding) {
    brandingInfo = ` | Logo: ${branding.logoUrl ? "Yes" : "No"} | Stamp: ${branding.stampText || "None"}`;
  }

  const mockPdf = new TextEncoder().encode(
    `Mock PDF generated from HTML: ${html.substring(0, 100)}...${brandingInfo}`,
  );
  return mockPdf;
}

export const POST = async ({ request }: RequestEvent) => {
  try {
    const body = await request.json();
    const { templateId, data, format = "pdf", companyId } = body;

    if (!templateId || !data) {
      throw error(400, "Missing required fields: templateId and data");
    }

    // Load company branding if companyId is provided
    let branding: CompanyBranding | undefined;
    if (companyId) {
      try {
        const brandingResult = await brandingService.loadBranding(companyId);
        if (brandingResult.success && brandingResult.branding) {
          branding = brandingResult.branding;
        }
      } catch (brandingError) {
        console.warn(
          "Failed to load branding for PDF generation:",
          brandingError,
        );
        // Continue without branding
      }
    }

    // In a real implementation, fetch template from database
    // For now, use mock template
    const mockTemplate: DocumentTemplate = {
      id: templateId,
      companyId: "company-1",
      name: "Mock Template",
      description: "Mock template for testing",
      type: "invoice",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>{{title}}</h1>
          <p>Generated on: {{date}}</p>
          <p>Client: {{clientName}}</p>
          <p>Amount: {{amount}}</p>
        </div>
      `,
      placeholders: [
        { key: "title", label: "Title", type: "text", required: true },
        { key: "date", label: "Date", type: "date", required: true },
        {
          key: "clientName",
          label: "Client Name",
          type: "text",
          required: true,
        },
        { key: "amount", label: "Amount", type: "currency", required: false },
      ],
      isActive: true,
      version: 1,
      createdBy: "user-1",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Validate template data
    const validation = validateTemplateData(mockTemplate, data);
    if (!validation.isValid) {
      throw error(
        400,
        `Missing required fields: ${validation.missingFields.join(", ")}`,
      );
    }

    // Render template
    let renderedHtml = renderTemplate(mockTemplate, data);

    // Inject branding if available
    if (branding) {
      renderedHtml = injectBrandingIntoHtml(renderedHtml, branding);
    }

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

    if (err instanceof Error && "status" in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, "Failed to generate document");
  }
};
