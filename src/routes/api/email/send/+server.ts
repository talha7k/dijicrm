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

    // Create transporter with SMTP config
    const transporter = nodemailer.createTransporter({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure, // true for 465, false for other ports
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
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
