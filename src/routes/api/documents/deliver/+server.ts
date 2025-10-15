import { json, error, type RequestEvent } from "@sveltejs/kit";
import { emailService, EmailTemplates } from "$lib/services/emailService";
import { Timestamp } from "firebase/firestore";
import type { DocumentDelivery } from "$lib/types/document";
import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { PUBLIC_FIREBASE_PROJECT_ID } from "$env/static/public";

// Initialize Firebase Admin if not already initialized
let adminApp: any;
let db: any;
let auth: any;

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
    auth = getAuth(adminApp);
  } else {
    db = getFirestore();
    auth = getAuth();
  }
}

export const POST = async ({ request, locals }: RequestEvent) => {
  try {
    initializeFirebaseAdmin();

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

    // Fetch documents from database
    const documents = [];
    for (const documentId of documentIds) {
      const docRef = db.collection("generatedDocuments").doc(documentId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        documents.push({
          id: documentId,
          ...docSnap.data(),
        });
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
