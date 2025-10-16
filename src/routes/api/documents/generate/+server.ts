import { json, error, type RequestEvent } from "@sveltejs/kit";
import {
  renderTemplate,
  validateTemplateData,
  injectBrandingIntoHtml,
} from "$lib/utils/template-rendering";
import type { DocumentTemplate } from "$lib/types/document";
import { brandingService } from "$lib/services/brandingService";
import type { CompanyBranding } from "$lib/types/branding";
import { getDb } from "$lib/firebase-admin";
import { requireCompanyAccess } from "$lib/utils/server-company-validation";

// Mock function - replace with actual PDF generation
async function generatePdfFromHtml(
  html: string,
  branding?: CompanyBranding,
): Promise<Uint8Array> {
  // In a real implementation, this would use Puppeteer or similar
  // For now, return a mock PDF buffer with branding info
  let brandingInfo = "";
  if (branding) {
    brandingInfo = ` | Logo: ${branding.logoUrl ? "Yes" : "No"} | Stamp: ${branding.stampImageUrl ? "Yes" : "None"}`;
  }

  const mockPdf = new TextEncoder().encode(
    `Mock PDF generated from HTML: ${html.substring(0, 100)}...${brandingInfo}`,
  );
  return mockPdf;
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
    const { templateId, data, format = "pdf", companyId } = body;

    console.log("Request body:", { templateId, format, companyId });

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

    // Validate template data
    const validation = validateTemplateData(template, data);
    if (!validation.isValid) {
      console.error("Template validation failed:", {
        templateId,
        missingFields: validation.missingFields,
        providedData: Object.keys(data),
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
    let renderedHtml = renderTemplate(template, data);

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
