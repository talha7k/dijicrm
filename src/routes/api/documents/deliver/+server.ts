import { json, error, type RequestEvent } from "@sveltejs/kit";
import { emailService, EmailTemplates } from "$lib/services/emailService";
import { Timestamp } from "firebase/firestore";
import type { DocumentDelivery } from "$lib/types/document";

export const POST = async ({ request }: RequestEvent) => {
  try {
    const body = await request.json();
    const { documentIds, recipientEmail, companyName, clientName, orderId } =
      body;

    if (
      !documentIds ||
      !Array.isArray(documentIds) ||
      documentIds.length === 0
    ) {
      throw error(400, "documentIds array is required");
    }

    if (!recipientEmail || !companyName || !clientName) {
      throw error(
        400,
        "recipientEmail, companyName, and clientName are required",
      );
    }

    // Mock documents - in real implementation, fetch from database
    const mockDocuments = documentIds.map((id) => ({
      id,
      orderId: orderId || "order-1",
      clientId: "client-1",
      templateId: "template-1",
      templateVersion: 1,
      htmlContent: "<div>Mock document content</div>",
      pdfUrl: `https://example.com/docs/${id}.pdf`,
      status: "generated" as const,
      data: { clientName, companyName },
      generatedAt: new Date(),
      version: 1,
    }));

    // Create email content for bulk delivery
    const template = EmailTemplates.documentDelivery(
      clientName,
      companyName,
      `${documentIds.length} Documents`,
      documentIds.length,
    );

    // Prepare attachments (mock for now)
    const attachments = documentIds.map((id) => ({
      filename: `document-${id}.pdf`,
      content: "mock-pdf-content-base64", // TODO: Get actual PDF content from storage
      type: "application/pdf" as const,
    }));

    // Send bulk email
    const emailOptions = {
      to: recipientEmail,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      attachments: attachments.length > 0 ? attachments : undefined,
      metadata: {
        orderId: orderId || "order-1",
        clientId: "client-1", // TODO: Get from auth/session
        documentCount: documentIds.length,
      },
    };

    const emailResult = await emailService.sendEmail(emailOptions);

    // Create delivery records
    const deliveries: DocumentDelivery[] = documentIds.map((documentId) => ({
      id: `delivery-${documentId}-${Date.now()}`,
      documentId,
      recipientEmail,
      status: emailResult.success ? "sent" : "bounced",
      sentAt: Timestamp.now(),
      errorMessage: emailResult.error,
      retryCount: 0,
      maxRetries: 3,
      emailServiceId: emailResult.messageId,
    }));

    return json({
      success: emailResult.success,
      deliveries,
      deliveredCount: emailResult.success ? deliveries.length : 0,
      failedCount: emailResult.success ? 0 : deliveries.length,
      messageId: emailResult.messageId,
    });
  } catch (err) {
    console.error("Document delivery error:", err);

    if (err instanceof Error && "status" in err) {
      throw err; // Re-throw SvelteKit errors
    }

    throw error(500, "Failed to deliver documents");
  }
};
