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

    // Create transporter with SMTP config
    const transporter = nodemailer.createTransporter({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
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

    const errorMessage =
      err instanceof Error ? err.message : "Unknown SMTP error";

    return json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
};
