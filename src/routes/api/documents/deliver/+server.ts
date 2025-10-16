import { json, error, type RequestEvent } from "@sveltejs/kit";
import { emailService, EmailTemplates } from "$lib/services/emailService";
import { Timestamp } from "firebase/firestore";
import type { DocumentDelivery } from "$lib/types/document";
import { getDb, getAuthAdmin } from "$lib/firebase-admin";
import { requireCompanyAccess } from "$lib/utils/server-company-validation";

export const POST = async ({ request, locals }: RequestEvent) => {
  try {
    const db = getDb();
    const auth = getAuthAdmin();

    // Get user from locals (set by auth hooks)
    const user = locals.user;
    if (!user || !user.uid) {
      throw error(401, "Unauthorized");
    }

    const body = await request.json();
    const {
      documentIds,
      recipientEmail,
      companyName,
      clientName,
      orderId,
      companyId,
    } = body;

    if (
      !documentIds ||
      !Array.isArray(documentIds) ||
      documentIds.length === 0
    ) {
      throw error(400, "documentIds array is required");
    }

    if (!recipientEmail || !companyName || !clientName || !companyId) {
      throw error(
        400,
        "recipientEmail, companyName, clientName, and companyId are required",
      );
    }

    // Validate user has access to the company
    await requireCompanyAccess(user.uid, companyId, "deliver documents");

    // Fetch documents from database - ensure they belong to the company
    const documents = [];
    for (const documentId of documentIds) {
      const docRef = db.collection("generatedDocuments").doc(documentId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        const docData = docSnap.data();
        // Validate document belongs to the company
        if (docData.companyId === companyId) {
          documents.push({
            id: documentId,
            ...docData,
          });
        } else {
          console.warn(
            `Document ${documentId} does not belong to company ${companyId}`,
          );
        }
      } else {
        console.warn(`Document ${documentId} not found`);
      }
    }

    // Create email content for bulk delivery
    const template = EmailTemplates.documentDelivery(
      clientName,
      companyName,
      `${documentIds.length} Documents`,
      documentIds.length,
    );

    // Prepare attachments
    const attachments = [];
    for (const document of documents) {
      if (document.pdfUrl) {
        // In a real implementation, you would fetch the PDF from storage
        // For now, we'll include the URL as a reference
        attachments.push({
          filename: `document-${document.id}.pdf`,
          content: document.pdfUrl, // This should be the actual file content
          type: "application/pdf" as const,
        });
      }
    }

    // Send bulk email
    const emailOptions = {
      to: recipientEmail,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      attachments: attachments.length > 0 ? attachments : undefined,
      metadata: {
        orderId: orderId || null,
        companyId,
        userId: user.uid,
        documentCount: documentIds.length,
      },
    };

    const emailResult = await emailService.sendEmail(emailOptions);

    // Create delivery records
    const deliveries: DocumentDelivery[] = documentIds.map((documentId) => ({
      id: `delivery-${documentId}-${Date.now()}`,
      companyId,
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
