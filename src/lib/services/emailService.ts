import type { GeneratedDocument, DocumentDelivery } from "$lib/types/document";

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: EmailAttachment[];
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  type: string;
  disposition?: "attachment" | "inline";
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveryId?: string;
}

export interface SMTPConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
}

// Email service supporting both SMTP and mock implementations
class EmailService {
  private smtpConfig: SMTPConfig | null = null;
  private mockFromEmail: string = "noreply@tk-crm.com";
  private mockFromName: string = "TK-Crm";

  // Configure SMTP settings
  setSMTPConfig(config: SMTPConfig) {
    this.smtpConfig = config.enabled ? config : null;
  }

  // Get current SMTP config (for UI display)
  getSMTPConfig(): SMTPConfig | null {
    return this.smtpConfig;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      if (this.smtpConfig) {
        // Use SMTP via API endpoint
        const response = await fetch("/api/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            smtpConfig: this.smtpConfig,
            emailOptions: options,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send email via SMTP");
        }

        const result = await response.json();
        return {
          success: true,
          messageId: result.messageId,
          deliveryId: result.deliveryId,
        };
      } else {
        // Mock implementation for development
        console.log("Sending email (mock):", {
          to: options.to,
          subject: options.subject,
          hasAttachments: options.attachments?.length || 0,
        });

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock success response
        return {
          success: true,
          messageId: `mock-${Date.now()}`,
          deliveryId: `delivery-${Date.now()}`,
        };
      }
    } catch (error) {
      console.error("Email send error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    // Process emails with concurrency control (max 10 concurrent)
    const batches = this.chunkArray(emails, 10);

    for (const batch of batches) {
      const batchPromises = batch.map((email) => this.sendEmail(email));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to avoid rate limiting
      if (batches.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Email template functions
export class EmailTemplates {
  static documentDelivery(
    clientName: string,
    companyName: string,
    documentName: string,
    documentCount: number = 1,
  ): EmailTemplate {
    const subject = `Documents from ${companyName}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document Delivery</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { margin-bottom: 20px; }
            .documents { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Document Delivery</h1>
              <p>Hello ${clientName},</p>
            </div>

            <div class="content">
              <p>${companyName} has sent you ${documentCount === 1 ? "a document" : `${documentCount} documents`} that require your attention.</p>

              <div class="documents">
                <h3>Documents Included:</h3>
                <ul>
                  <li>${documentName}</li>
                  ${documentCount > 1 ? "<li>Additional documents attached</li>" : ""}
                </ul>
              </div>

              <p>Please review ${documentCount === 1 ? "the document" : "these documents"} and complete any required actions. You can access your client portal to view and submit completed documents.</p>

              <a href="#" class="button">View in Client Portal</a>
            </div>

            <div class="footer">
              <p>This email was sent by ${companyName} using TK-Crm.</p>
              <p>If you have any questions, please contact your account representative.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Hello ${clientName},

${companyName} has sent you ${documentCount === 1 ? "a document" : `${documentCount} documents`} that require your attention.

Documents: ${documentName}

Please review ${documentCount === 1 ? "the document" : "these documents"} and complete any required actions. You can access your client portal to view and submit completed documents.

This email was sent by ${companyName} using TK-Crm.
If you have any questions, please contact your account representative.
    `;

    return { subject, htmlBody, textBody };
  }

  static documentReminder(
    clientName: string,
    companyName: string,
    documentName: string,
    daysOverdue: number,
  ): EmailTemplate {
    const subject = `Reminder: Documents Require Your Attention - ${companyName}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .urgent { color: #856404; font-weight: bold; }
            .content { margin-bottom: 20px; }
            .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }
            .button { display: inline-block; background: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="urgent">Document Reminder</h1>
              <p>Hello ${clientName},</p>
            </div>

            <div class="content">
              <p>This is a friendly reminder that you have documents from ${companyName} that are ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue.</p>

              <p><strong>Pending Documents:</strong></p>
              <ul>
                <li>${documentName}</li>
              </ul>

              <p>Please review and complete these documents as soon as possible to avoid any delays in your process.</p>

              <a href="#" class="button">Complete Documents Now</a>
            </div>

            <div class="footer">
              <p>This reminder was sent by ${companyName} using DijiCRM.</p>
              <p>If you have already completed these documents, please disregard this reminder.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return { subject, htmlBody };
  }

  static documentCompleted(
    clientName: string,
    companyName: string,
    documentName: string,
  ): EmailTemplate {
    const subject = `Document Completed - ${companyName}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document Completed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .success { color: #155724; font-weight: bold; }
            .content { margin-bottom: 20px; }
            .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="success">Document Completed</h1>
              <p>Hello ${clientName},</p>
            </div>

            <div class="content">
              <p>Great news! Your document has been successfully completed and received by ${companyName}.</p>

              <p><strong>Completed Document:</strong></p>
              <ul>
                <li>${documentName}</li>
              </ul>

              <p>Thank you for your prompt attention to this matter. Your documents are now being processed.</p>

              <a href="#" class="button">View All Documents</a>
            </div>

            <div class="footer">
              <p>This confirmation was sent by ${companyName} using DijiCRM.</p>
              <p>If you have any questions about your submission, please contact your account representative.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return { subject, htmlBody };
  }

  static clientInvitation(
    clientName: string,
    companyName: string,
    invitationUrl: string,
  ): EmailTemplate {
    const subject = `Welcome to ${companyName} - Complete Your Account Setup`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Client Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #e3f2fd; border: 1px solid #bbdefb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .welcome { color: #1976d2; font-weight: bold; }
            .content { margin-bottom: 20px; }
            .invitation-box { background: #f8f9fa; border: 2px solid #007bff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; }
            .button { display: inline-block; background: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; font-size: 16px; }
            .note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="welcome">Welcome to ${companyName}!</h1>
              <p>Hello ${clientName},</p>
            </div>

            <div class="content">
              <p>${companyName} has invited you to join their client portal. This secure platform allows you to:</p>
              <ul>
                <li>View and download your invoices</li>
                <li>Access important business documents</li>
                <li>Submit completed forms and paperwork</li>
                <li>Track your account status and communications</li>
              </ul>

              <div class="invitation-box">
                <h3>Complete Your Account Setup</h3>
                <p>Click the button below to set your password and activate your account.</p>
                <a href="${invitationUrl}" class="button">Activate My Account</a>
                <p style="margin-top: 15px; font-size: 14px; color: #666;">
                  This invitation link will expire in 7 days for security reasons.
                </p>
              </div>

              <div class="note">
                <strong>Security Note:</strong> This invitation is specifically for you. If you did not expect this invitation, please contact ${companyName} directly.
              </div>

              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                ${invitationUrl}
              </p>
            </div>

            <div class="footer">
              <p>This invitation was sent by ${companyName} using DijiCRM.</p>
              <p>If you have any questions about setting up your account, please contact your account representative at ${companyName}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Welcome to ${companyName}!

Hello ${clientName},

${companyName} has invited you to join their client portal. This secure platform allows you to:
- View and download your invoices
- Access important business documents
- Submit completed forms and paperwork
- Track your account status and communications

To complete your account setup, please visit:
${invitationUrl}

This invitation link will expire in 7 days for security reasons.

Security Note: This invitation is specifically for you. If you did not expect this invitation, please contact ${companyName} directly.

If you have any questions about setting up your account, please contact your account representative at ${companyName}.

This invitation was sent by ${companyName} using DijiCRM.
    `;

    return { subject, htmlBody, textBody };
  }
}

// Export singleton instance
export const emailService = new EmailService();
