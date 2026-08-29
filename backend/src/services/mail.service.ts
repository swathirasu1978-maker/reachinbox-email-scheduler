
import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.ETHEREAL_HOST,
  port: env.ETHEREAL_PORT,
  secure: env.ETHEREAL_PORT === 465,
  auth: {
    user: env.ETHEREAL_USER,
    pass: env.ETHEREAL_PASS
  }
});

export async function sendEmail(
  to: string,
  subject: string,
  body: string
) {
  const info = await transporter.sendMail({
    from: env.DEFAULT_FROM_EMAIL,
    to,
    subject,
    text: body,
    html: body.replace(/\n/g, "<br/>")
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  console.log("=================================");
  console.log("EMAIL SENT SUCCESSFULLY");
  console.log("Message ID:", info.messageId);
  console.log("Preview URL:", previewUrl);
  console.log("=================================");

  return {
    messageId: info.messageId,
    previewUrl: previewUrl || null
  };
}

