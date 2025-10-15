import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { SMTPConfig } from "$lib/services/emailService";
import nodemailer from "nodemailer";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { to, smtpConfig }: { to: string; smtpConfig: SMTPConfig } =
      await request.json();

    if (!smtpConfig || !smtpConfig.enabled) {
      throw error(400, "SMTP configuration is required and must be enabled");
    }

    if (!to) {
      throw error(400, "Test email address is required");
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

    console.log("SMTP Test Configuration:", {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user,
      fromEmail: smtpConfig.fromEmail,
      to: to,
    });

    // Create transporter with SMTP config
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
      // Add additional options for better compatibility
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
      debug: true, // Enable debugging for test emails
      logger: true, // Enable logging for test emails
    });

    // Verify connection
    await transporter.verify();

    // Send test email
    const mailOptions = {
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: to,
      subject: "TK-Crm SMTP Test Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">SMTP Configuration Test</h2>
          <p>Great! Your SMTP configuration is working correctly.</p>
          <p>This test email confirms that TK-Crm can successfully send emails through your SMTP server.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Sent from TK-Crm at ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `
SMTP Configuration Test

Great! Your SMTP configuration is working correctly.

This test email confirms that TK-Crm can successfully send emails through your SMTP server.

Sent from TK-Crm at ${new Date().toLocaleString()}
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return json({
      success: true,
      message: "Test email sent successfully!",
      messageId: info.messageId,
    });
  } catch (err) {
    console.error("SMTP test email error:", err);

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
          "Certificate error: The SMTP server is using a self-signed certificate.";
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
      } else if (err.message.includes("Greeting never received")) {
        errorMessage =
          "Connection failed: The SMTP server didn't respond. This could be due to wrong port, firewall, or server issue.";
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
