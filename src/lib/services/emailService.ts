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

// Mock email service - replace with actual SendGrid/Mailgun implementation
class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || "mock-api-key";
    this.fromEmail = process.env.FROM_EMAIL || "noreply@dijicrm.com";
    this.fromName = process.env.FROM_NAME || "DijiCRM";
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Mock implementation - replace with actual email service
      console.log("Sending email:", {
        to: options.to,
        subject: options.subject,
        hasAttachments: options.attachments?.length || 0,
      });

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Mock success/failure (90% success rate for testing)
      const shouldSucceed = Math.random() > 0.1;

      if (shouldSucceed) {
        return {
          success: true,
          messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          deliveryId: `delivery-${Date.now()}`,
        };
      } else {
        return {
          success: false,
          error: "Mock email delivery failure",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown email error",
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
              <p>This email was sent by ${companyName} using DijiCRM.</p>
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

This email was sent by ${companyName} using DijiCRM.
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
}

// Export singleton instance
export const emailService = new EmailService();
