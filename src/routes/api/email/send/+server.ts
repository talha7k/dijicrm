import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { EmailOptions, SMTPConfig } from "$lib/services/emailService";
import nodemailer from "nodemailer";

// Logger that collects messages for client-side display
const logs: string[] = [];
function log(message: string) {
  logs.push(message);
  console.log(message);
}

export const POST: RequestHandler = async ({ request, locals }) => {
  log("📧 [EMAIL API] Email send request received");
  log(`📧 [EMAIL API] User: ${locals.user?.uid || "undefined"}`);

  try {
    // Get current user from locals (set by auth hooks)
    const user = locals.user;
    if (!user || !user.uid) {
      log("📧 [EMAIL API] No user found in locals, returning 401");
      throw error(401, "Unauthorized");
    }

    log(`📧 [EMAIL API] User authenticated: ${user.uid}`);

    let requestBody;
    try {
      requestBody = await request.json();
      log("📧 [EMAIL API] Request body parsed successfully");
      log(`📧 [EMAIL API] Request body keys: ${Object.keys(requestBody)}`);
    } catch (parseError) {
      log(`📧 [EMAIL API] Failed to parse request body: ${parseError}`);
      throw error(400, "Invalid JSON in request body");
    }

    const {
      smtpConfig,
      emailOptions,
      companyId,
    }: {
      smtpConfig: SMTPConfig;
      emailOptions: EmailOptions;
      companyId: string;
    } = requestBody;

    log(`📧 [EMAIL API] Company ID: ${companyId}`);
    log(`📧 [EMAIL API] SMTP enabled: ${smtpConfig?.enabled}`);
    log(`📧 [EMAIL API] Email to: ${emailOptions?.to}`);
    log(`📧 [EMAIL API] Email subject: ${emailOptions?.subject}`);
    log(
      `📧 [EMAIL API] Attachments count: ${emailOptions?.attachments?.length || 0}`,
    );

    if (!companyId) {
      log("📧 [EMAIL API] Missing company ID");
      throw error(400, "Company ID is required");
    }

    if (!smtpConfig || !smtpConfig.enabled) {
      log("📧 [EMAIL API] SMTP not configured or disabled");
      throw error(400, "SMTP configuration is required and must be enabled");
    }

    log(`📧 [EMAIL API] SMTP Host: ${smtpConfig.host}`);
    log(`📧 [EMAIL API] SMTP Port: ${smtpConfig.port}`);
    log(`📧 [EMAIL API] SMTP Secure: ${smtpConfig.secure}`);

    // Validate required fields
    if (!smtpConfig.host || !smtpConfig.host.trim()) {
      log("📧 [EMAIL API] Missing SMTP host");
      throw error(400, "SMTP host is required");
    }
    if (!smtpConfig.auth.user || !smtpConfig.auth.user.trim()) {
      log("📧 [EMAIL API] Missing SMTP username");
      throw error(400, "SMTP username is required");
    }
    if (!smtpConfig.auth.pass || !smtpConfig.auth.pass.trim()) {
      log("📧 [EMAIL API] Missing SMTP password");
      throw error(400, "SMTP password is required");
    }
    if (!smtpConfig.fromEmail || !smtpConfig.fromEmail.trim()) {
      log("📧 [EMAIL API] Missing from email");
      throw error(400, "From email is required");
    }

    log("📧 [EMAIL API] Creating SMTP transporter...");

    // Create transporter with SMTP config
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure, // true for 465, false for other ports
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
      // Add additional options for better compatibility
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    } as any);

    log("📧 [EMAIL API] Verifying SMTP connection...");

    // Verify connection
    await transporter.verify();

    log("📧 [EMAIL API] SMTP connection verified successfully");

    // Verify connection
    await transporter.verify();

    console.log("📧 [EMAIL API] SMTP connection verified successfully");

    log("📧 [EMAIL API] Preparing email options...");

    // Prepare email options
    const mailOptions = {
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: emailOptions.to,
      subject: emailOptions.subject,
      html: emailOptions.htmlBody,
      text: emailOptions.textBody,
      attachments: emailOptions.attachments?.map((attachment) => {
        log(
          `📧 [EMAIL API] Processing attachment: ${attachment.filename} Size: ${attachment.content.length}`,
        );
        return {
          filename: attachment.filename,
          content: Buffer.from(attachment.content, "base64"),
          type: attachment.type,
          disposition: attachment.disposition || "attachment",
        };
      }),
    };

    log("📧 [EMAIL API] Sending email...");
    log(`📧 [EMAIL API] From: ${mailOptions.from}`);
    log(`📧 [EMAIL API] To: ${mailOptions.to}`);
    log(`📧 [EMAIL API] Subject: ${mailOptions.subject}`);
    log(`📧 [EMAIL API] HTML body length: ${mailOptions.html?.length || 0}`);
    log(`📧 [EMAIL API] Attachments: ${mailOptions.attachments?.length || 0}`);

    // Send email
    const info = await transporter.sendMail(mailOptions);

    log("📧 [EMAIL API] Email sent successfully!");
    log(`📧 [EMAIL API] Message ID: ${info.messageId}`);
    log(`📧 [EMAIL API] Response: ${info.response}`);

    return json({
      success: true,
      messageId: info.messageId,
      deliveryId: `smtp-${Date.now()}`,
    });
  } catch (err) {
    log(`📧 [EMAIL API] ERROR: ${err}`);
    log(
      `📧 [EMAIL API] Error stack: ${err instanceof Error ? err.stack : "No stack trace"}`,
    );

    let errorMessage = "Unknown SMTP error";
    let statusCode = 500;

    if (err instanceof Error) {
      errorMessage = err.message;

      // Provide more specific error messages for common issues
      if (err.message.includes('Missing credentials for "PLAIN"')) {
        errorMessage =
          "Authentication failed: Please check your username and password. For Gmail, use an App Password instead of your regular password.";
        statusCode = 400;
      } else if (err.message.includes("self signed certificate")) {
        errorMessage =
          "Certificate error: The SMTP server is using a self-signed certificate. This is allowed but the connection failed.";
      } else if (err.message.includes("ECONNREFUSED")) {
        errorMessage =
          "Connection refused: Please check the SMTP host and port. The server may be down or the port may be blocked.";
      } else if (err.message.includes("ETIMEDOUT")) {
        errorMessage =
          "Connection timeout: The SMTP server is not responding. Please check the host and port.";
      } else if (err.message.includes("535")) {
        errorMessage =
          "Authentication failed: Invalid username or password. For Gmail, make sure to use an App Password.";
      } else if (err.message.includes("550")) {
        errorMessage =
          "Sender address rejected: Please check the 'From Email' configuration.";
      }
    }

    return json(
      {
        success: false,
        error: errorMessage,
        logs: logs.slice(), // Return logs even on error
      },
      { status: statusCode },
    );
  }
};
