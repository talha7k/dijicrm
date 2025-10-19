import { derived, writable } from "svelte/store";
import { get } from "svelte/store";
import { companyContext } from "./companyContext";
import type { UserProfile } from "$lib/types/user";
import { emailService } from "$lib/services/emailService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "$lib/firebase";

export interface EmailRecord {
  id: string;
  subject: string;
  sentDate: Date;
  status: "sent" | "delivered" | "opened" | "bounced" | "complained";
  recipient: string;
  opened?: boolean;
  preview?: string;
  messageId?: string;
  deliveryId?: string;
  deliveredAt?: Date;
  errorMessage?: string;
  lastChecked?: Date;
  attachments?: Array<{
    filename: string;
    size: number;
    type: string;
    documentType?: string; // e.g., "Invoice", "Contract", "Report"
  }>;
  metadata?: Record<string, any>;
}

interface EmailHistoryState {
  data: EmailRecord[];
  loading: boolean;
  error: string | null;
}

function createEmailHistoryStore() {
  const store = writable<EmailHistoryState>({
    data: [],
    loading: false,
    error: null,
  });

  return {
    subscribe: store.subscribe,

    async loadEmailsForClient(clientEmail: string) {
      store.update((state) => ({ ...state, loading: true, error: null }));

      try {
        // Get real email history from Firebase via email service
        const emails = await emailService.getEmailHistoryForClient(clientEmail);

        // Transform to match EmailRecord interface
        const transformedEmails: EmailRecord[] = emails.map((email) => ({
          id: email.id,
          subject: email.subject,
          sentDate: email.sentDate,
          status: email.status || "sent",
          recipient: email.recipient,
          opened: email.opened || false,
          preview: email.preview || "",
          messageId: email.messageId,
          deliveryId: email.deliveryId,
          deliveredAt: email.deliveredAt,
          errorMessage: email.errorMessage,
          lastChecked: email.lastChecked,
          attachments: email.attachments || [],
          metadata: email.metadata || {},
        }));

        store.update((state) => ({
          ...state,
          data: transformedEmails,
          loading: false,
        }));
      } catch (error) {
        store.update((state) => ({
          ...state,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load email history",
          loading: false,
        }));
      }
    },

    async sendEmail(
      emailData: {
        subject: string;
        message: string;
        recipient: string;
        attachments: Array<{
          file: File;
          documentType: string;
          filename: string;
        }>;
      },
      onLog?: (message: string) => void,
    ) {
      try {
        // Convert files to base64 for email service
        const emailAttachments: Array<{
          filename: string;
          content: string;
          type: string;
          documentType: string;
          size: number;
        }> = [];

        for (const attachment of emailData.attachments) {
          // Convert file to base64
          const base64Content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
              const base64 = result.split(",")[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(attachment.file);
          });

          emailAttachments.push({
            filename: attachment.filename,
            content: base64Content,
            type: attachment.file.type,
            documentType: attachment.documentType,
            size: attachment.file.size,
          });
        }

        // Check SMTP config from company context
        const companyData = get(companyContext);
        const smtpConfig = companyData?.data?.smtpConfig;
        if (!smtpConfig) {
          throw new Error(
            "SMTP configuration is required to send emails. Please configure your email settings in the Settings page.",
          );
        }

        // Send email via email service
        const emailResult = await emailService.sendEmail(
          {
            to: emailData.recipient,
            subject: emailData.subject,
            htmlBody: emailData.message,
            attachments: emailAttachments.map((att) => ({
              filename: att.filename,
              content: att.content,
              type: att.type,
            })),
          },
          onLog,
        );

        if (!emailResult.success) {
          throw new Error(emailResult.error || "Failed to send email");
        }

        // Create email record
        const emailRecord: EmailRecord = {
          id: `email-${Date.now()}`,
          subject: emailData.subject,
          sentDate: new Date(),
          status: "sent",
          recipient: emailData.recipient,
          opened: false,
          preview: emailData.message.substring(0, 100) + "...",
          messageId: emailResult.messageId,
          attachments: emailAttachments.map((att) => ({
            filename: att.filename,
            size: att.size,
            type: att.type,
            documentType: att.documentType,
          })),
        };

        // Add to local store
        store.update((state) => ({
          ...state,
          data: [emailRecord, ...state.data],
        }));

        return { success: true, emailId: emailRecord.id };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to send email",
        };
      }
    },

    async resendEmail(emailId: string) {
      try {
        // For now, just return success since we don't have full email content stored
        // In a real implementation, we'd need to store the full email content
        console.log("Resend email requested for:", emailId);

        // Simulate resend delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to resend email",
        };
      }
    },

    async getEmailDetails(emailId: string) {
      try {
        const emailDoc = await getDoc(doc(db, "emailHistory", emailId));

        if (!emailDoc.exists()) {
          return null;
        }

        const emailData = emailDoc.data();
        return {
          id: emailDoc.id,
          ...emailData,
          sentDate: emailData.sentDate?.toDate() || new Date(),
          deliveredAt: emailData.deliveredAt?.toDate(),
          lastChecked: emailData.lastChecked?.toDate(),
        } as EmailRecord;
      } catch (error) {
        console.error("Failed to get email details:", error);
        return null;
      }
    },
  };
}

export const emailHistoryStore = createEmailHistoryStore();

// Derived store for current user's email history
export const currentUserEmailHistory = derived(
  [emailHistoryStore],
  ([$emailHistory]) => $emailHistory,
);
