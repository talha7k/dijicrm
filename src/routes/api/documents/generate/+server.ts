import { json, error, type RequestEvent } from "@sveltejs/kit";
import {
  renderTemplate,
  validateTemplateData,
  injectBrandingIntoHtml,
} from "$lib/utils/template-rendering";
import type { DocumentTemplate } from "$lib/types/document";
import { brandingService } from "$lib/services/brandingService";
import type { CompanyBranding } from "$lib/types/branding";
import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { PUBLIC_FIREBASE_PROJECT_ID } from "$env/static/public";

// Initialize Firebase Admin
let adminApp: any;
let db: any;

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const isProduction = process.env.NODE_ENV === "production";
    let credential;

    if (isProduction) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKey) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set",
        );
      }
      const serviceAccount = JSON.parse(serviceAccountKey);
      credential = cert({
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
        projectId: serviceAccount.project_id,
      });
    } else {
      credential = applicationDefault();
    }

    adminApp = initializeApp({
      credential,
      projectId: PUBLIC_FIREBASE_PROJECT_ID,
    });
    db = getFirestore(adminApp);
  } else {
    db = getFirestore();
  }
}

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

export const POST = async ({ request }: RequestEvent) => {
  try {
    // Initialize Firebase Admin
    initializeFirebaseAdmin();

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

    // Fetch template from Firestore
    const templateDoc = await db
      .collection("documentTemplates")
      .doc(templateId)
      .get();
    if (!templateDoc.exists) {
      console.error("Template not found:", { templateId });
      throw error(404, "Template not found");
    }
    const templateData = templateDoc.data();
    const template: DocumentTemplate = {
      id: templateDoc.id,
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

    if (err instanceof Error && "status" in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, "Failed to generate document");
  }
};
