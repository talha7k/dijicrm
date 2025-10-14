import { writable } from "svelte/store";
import { Timestamp } from "firebase/firestore";
import type { GeneratedDocument, DocumentDelivery } from "$lib/types/document";
import {
  emailService,
  type EmailOptions,
  EmailTemplates,
} from "$lib/services/emailService";

interface DocumentDeliveryState {
  deliveries: DocumentDelivery[];
  loading: boolean;
  error: string | null;
}

function createDocumentDeliveryStore() {
  const { subscribe, set, update } = writable<DocumentDeliveryState>({
    deliveries: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,
    set,
    update,

    // Send a single document via email
    async deliverDocument(
      document: GeneratedDocument,
      recipientEmail: string,
      companyName: string,
      clientName: string,
    ): Promise<DocumentDelivery | null> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Create email content
        const template = EmailTemplates.documentDelivery(
          clientName,
          companyName,
          `Document: ${document.id}`, // TODO: Get actual document name
          1,
        );

        // Prepare email options
        const emailOptions: EmailOptions = {
          to: recipientEmail,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          attachments: document.pdfUrl
            ? [
                {
                  filename: `document-${document.id}.pdf`,
                  content: "mock-pdf-content-base64", // TODO: Get actual PDF content
                  type: "application/pdf",
                },
              ]
            : undefined,
          metadata: {
            documentId: document.id,
            orderId: document.orderId,
            clientId: document.clientId,
          },
        };

        // Send email
        const emailResult = await emailService.sendEmail(emailOptions);

        if (!emailResult.success) {
          throw new Error(emailResult.error || "Failed to send email");
        }

        // Create delivery record
        const delivery: DocumentDelivery = {
          id: `delivery-${Date.now()}`,
          documentId: document.id,
          recipientEmail,
          status: emailResult.success ? "sent" : "bounced",
          sentAt: Timestamp.now(),
          errorMessage: emailResult.error,
          retryCount: 0,
          maxRetries: 3,
          emailServiceId: emailResult.messageId,
        };

        // Update document status
        update((state) => ({
          ...state,
          deliveries: [...state.deliveries, delivery],
          loading: false,
        }));

        return delivery;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Delivery failed";

        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));

        return null;
      }
    },

    // Send multiple documents for a case
    async deliverCaseDocuments(
      documents: GeneratedDocument[],
      recipientEmail: string,
      companyName: string,
      clientName: string,
    ): Promise<DocumentDelivery[]> {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        const deliveries: DocumentDelivery[] = [];

        // Create bulk email content
        const template = EmailTemplates.documentDelivery(
          clientName,
          companyName,
          `${documents.length} Documents`,
          documents.length,
        );

        // Prepare attachments
        const attachments = documents
          .filter((doc) => doc.pdfUrl)
          .map((doc) => ({
            filename: `document-${doc.id}.pdf`,
            content: "mock-pdf-content-base64", // TODO: Get actual PDF content
            type: "application/pdf" as const,
          }));

        // Send bulk email
        const emailOptions: EmailOptions = {
          to: recipientEmail,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          attachments: attachments.length > 0 ? attachments : undefined,
          metadata: {
            orderId: documents[0]?.orderId,
            clientId: documents[0]?.clientId,
            documentCount: documents.length,
          },
        };

        const emailResult = await emailService.sendEmail(emailOptions);

        // Create delivery records for each document
        for (const document of documents) {
          const delivery: DocumentDelivery = {
            id: `delivery-${document.id}-${Date.now()}`,
            documentId: document.id,
            recipientEmail,
            status: emailResult.success ? "sent" : "bounced",
            sentAt: Timestamp.now(),
            errorMessage: emailResult.error,
            retryCount: 0,
            maxRetries: 3,
            emailServiceId: emailResult.messageId,
          };

          deliveries.push(delivery);
        }

        update((state) => ({
          ...state,
          deliveries: [...state.deliveries, ...deliveries],
          loading: false,
        }));

        return deliveries;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Bulk delivery failed";

        update((state) => ({
          ...state,
          loading: false,
          error: errorMessage,
        }));

        return [];
      }
    },

    // Retry failed deliveries with exponential backoff
    async retryDelivery(deliveryId: string): Promise<boolean> {
      let currentDelivery: DocumentDelivery | undefined;

      update((state) => {
        currentDelivery = state.deliveries.find(
          (d: DocumentDelivery) => d.id === deliveryId,
        );
        return { ...state, loading: true };
      });

      if (!currentDelivery) {
        update((state) => ({
          ...state,
          loading: false,
          error: "Delivery not found",
        }));
        return false;
      }

      if (currentDelivery.retryCount >= currentDelivery.maxRetries) {
        update((state) => ({
          ...state,
          loading: false,
          error: "Maximum retry attempts exceeded",
        }));
        return false;
      }

      try {
        // Calculate exponential backoff delay (base delay * 2^retryCount)
        const baseDelay = 1000; // 1 second
        const backoffDelay =
          baseDelay * Math.pow(2, currentDelivery.retryCount);
        const jitter = Math.random() * 0.1 * backoffDelay; // Add 10% jitter
        const totalDelay = backoffDelay + jitter;

        // Wait for backoff delay
        await new Promise((resolve) => setTimeout(resolve, totalDelay));

        // Mock retry logic - in real implementation, resend the email
        const success = Math.random() > 0.3; // 70% success rate for retry

        const updatedDelivery: DocumentDelivery = {
          ...currentDelivery,
          status: success ? "sent" : "bounced",
          retryCount: currentDelivery.retryCount + 1,
          sentAt: success ? Timestamp.now() : currentDelivery.sentAt,
          errorMessage: success
            ? undefined
            : `Retry ${currentDelivery.retryCount + 1} failed`,
          lastRetryAt: Timestamp.now(),
        };

        update((state) => ({
          ...state,
          deliveries: state.deliveries.map((d: DocumentDelivery) =>
            d.id === deliveryId ? updatedDelivery : d,
          ),
          loading: false,
        }));

        return success;
      } catch (error) {
        update((state) => ({
          ...state,
          loading: false,
          error: error instanceof Error ? error.message : "Retry failed",
        }));

        return false;
      }
    },

    // Schedule automatic retries for failed deliveries
    scheduleAutomaticRetries() {
      let currentState: DocumentDeliveryState;

      update((state) => {
        currentState = state;
        return state;
      });

      const failedDeliveries = currentState!.deliveries.filter(
        (d: DocumentDelivery) =>
          d.status === "bounced" && d.retryCount < d.maxRetries,
      );

      for (const delivery of failedDeliveries) {
        // Calculate next retry time with exponential backoff
        const baseDelay = 60000; // 1 minute base
        const backoffDelay = baseDelay * Math.pow(2, delivery.retryCount);
        const sentTime = delivery.sentAt?.toMillis() || Date.now();
        const nextRetryTime = sentTime + backoffDelay;

        const now = Date.now();
        const timeUntilRetry = nextRetryTime - now;

        if (timeUntilRetry > 0 && timeUntilRetry < 24 * 60 * 60 * 1000) {
          // Within 24 hours
          setTimeout(async () => {
            // Check if delivery still needs retry (might have been retried manually)
            const currentState = await new Promise<DocumentDeliveryState>(
              (resolve) => {
                const unsubscribe = subscribe((state) => {
                  unsubscribe();
                  resolve(state);
                });
              },
            );

            const currentDelivery = currentState.deliveries.find(
              (d: DocumentDelivery) => d.id === delivery.id,
            );
            if (
              currentDelivery?.status === "bounced" &&
              currentDelivery.retryCount < currentDelivery.maxRetries
            ) {
              await this.retryDelivery(delivery.id);
            }
          }, timeUntilRetry);
        }
      }
    },

    // Get delivery by ID
    getDelivery(deliveryId: string): DocumentDelivery | undefined {
      // This would need to be implemented with proper state management
      // For now, return undefined
      return undefined;
    },

    // Get deliveries for a document
    getDocumentDeliveries(documentId: string): DocumentDelivery[] {
      let currentState: DocumentDeliveryState;
      subscribe((state) => (currentState = state))();
      return currentState!.deliveries.filter(
        (d) => d.documentId === documentId,
      );
    },

    // Get deliveries for a client
    getClientDeliveries(clientEmail: string): DocumentDelivery[] {
      let currentState: DocumentDeliveryState;
      subscribe((state) => (currentState = state))();
      return currentState!.deliveries.filter(
        (d) => d.recipientEmail === clientEmail,
      );
    },

    // Update delivery status (called by webhooks or polling)
    updateDeliveryStatus(
      deliveryId: string,
      status: DocumentDelivery["status"],
      additionalData?: Partial<DocumentDelivery>,
    ) {
      update((state) => ({
        ...state,
        deliveries: state.deliveries.map((delivery) =>
          delivery.id === deliveryId
            ? {
                ...delivery,
                status,
                ...additionalData,
                ...(status === "delivered" &&
                  !delivery.deliveredAt && { deliveredAt: Timestamp.now() }),
              }
            : delivery,
        ),
      }));
    },

    // Send reminder for overdue documents
    async sendReminder(
      document: GeneratedDocument,
      recipientEmail: string,
      companyName: string,
      clientName: string,
      daysOverdue: number,
    ): Promise<boolean> {
      try {
        const template = EmailTemplates.documentReminder(
          clientName,
          companyName,
          `Document: ${document.id}`, // TODO: Get actual document name
          daysOverdue,
        );

        const emailOptions: EmailOptions = {
          to: recipientEmail,
          subject: template.subject,
          htmlBody: template.htmlBody,
          metadata: {
            documentId: document.id,
            reminder: true,
            daysOverdue,
          },
        };

        const result = await emailService.sendEmail(emailOptions);
        return result.success;
      } catch (error) {
        console.error("Failed to send reminder:", error);
        return false;
      }
    },

    // Send completion confirmation
    async sendCompletionConfirmation(
      document: GeneratedDocument,
      recipientEmail: string,
      companyName: string,
      clientName: string,
    ): Promise<boolean> {
      try {
        const template = EmailTemplates.documentCompleted(
          clientName,
          companyName,
          `Document: ${document.id}`, // TODO: Get actual document name
        );

        const emailOptions: EmailOptions = {
          to: recipientEmail,
          subject: template.subject,
          htmlBody: template.htmlBody,
          metadata: {
            documentId: document.id,
            completion: true,
          },
        };

        const result = await emailService.sendEmail(emailOptions);
        return result.success;
      } catch (error) {
        console.error("Failed to send completion confirmation:", error);
        return false;
      }
    },

    // Poll delivery status for pending deliveries
    async pollDeliveryStatus(deliveryId?: string): Promise<void> {
      try {
        let currentState: DocumentDeliveryState;

        update((state) => {
          currentState = state;
          return state;
        });

        const deliveriesToPoll = deliveryId
          ? currentState!.deliveries.filter(
              (d: DocumentDelivery) =>
                d.id === deliveryId &&
                (d.status === "sent" || d.status === "pending"),
            )
          : currentState!.deliveries.filter(
              (d: DocumentDelivery) =>
                d.status === "sent" || d.status === "pending",
            );

        for (const delivery of deliveriesToPoll) {
          // In a real implementation, you'd call the email service API
          // For now, simulate status updates
          const shouldUpdate = Math.random() > 0.7; // 30% chance of status change

          if (shouldUpdate) {
            const newStatus: DocumentDelivery["status"] =
              Math.random() > 0.9 ? "delivered" : "sent";
            const deliveredAt =
              newStatus === "delivered" ? Timestamp.now() : undefined;

            update((state) => ({
              ...state,
              deliveries: state.deliveries.map((d: DocumentDelivery) =>
                d.id === delivery.id
                  ? { ...d, status: newStatus, deliveredAt }
                  : d,
              ),
            }));
          }
        }
      } catch (error) {
        console.error("Failed to poll delivery status:", error);
      }
    },

    // Start polling for delivery status updates
    startPolling(intervalMs: number = 300000): () => void {
      // Default 5 minutes
      const pollInterval = setInterval(() => {
        this.pollDeliveryStatus();
      }, intervalMs);

      // Return cleanup function
      return () => clearInterval(pollInterval);
    },
  };
}

export const documentDeliveryStore = createDocumentDeliveryStore();
