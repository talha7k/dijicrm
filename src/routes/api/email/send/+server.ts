import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { EmailOptions, SMTPConfig } from "$lib/services/emailService";
import nodemailer from "nodemailer";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const {
      smtpConfig,
      emailOptions,
    }: { smtpConfig: SMTPConfig; emailOptions: EmailOptions } =
      await request.json();

    if (!smtpConfig || !smtpConfig.enabled) {
      throw error(400, "SMTP configuration is required and must be enabled");
    }

    // Validate required fields
    if (!smtpConfig.host || !smtpConfig.host.trim()) {
      throw error(400, "SMTP host is required");
    }
    if (!smtpConfig.auth.user || !smtpConfig.auth.user.trim()) {
      throw error(400, "SMTP username is required");
    }
    if (!smtpConfig.auth.pass || !smtpConfig.auth.pass.trim()) {
      throw error(400, "SMTP password is required");
    }
    if (!smtpConfig.fromEmail || !smtpConfig.fromEmail.trim()) {
      throw error(400, "From email is required");
    }

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
      debug: process.env.NODE_ENV === "development",
      logger: process.env.NODE_ENV === "development",
    });

    // Verify connection
    await transporter.verify();

    // Prepare email options
    const mailOptions = {
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: emailOptions.to,
      subject: emailOptions.subject,
      html: emailOptions.htmlBody,
      text: emailOptions.textBody,
      attachments: emailOptions.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.content, "base64"),
        type: attachment.type,
        disposition: attachment.disposition || "attachment",
      })),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return json({
      success: true,
      messageId: info.messageId,
      deliveryId: `smtp-${Date.now()}`,
    });
  } catch (err) {
    console.error("SMTP email send error:", err);

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
      },
      { status: statusCode },
    );
  }
};
