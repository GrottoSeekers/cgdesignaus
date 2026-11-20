// Emails a finished form to James through EmailJS (free plan: 200 emails a month).
// The email's design is built by email.ts; the EmailJS template just prints it ({{{html}}}).
// Setup steps are in the README ("Form emails").
import { COACH_EMAIL, type EmailParts } from "./email";

const SERVICE = (import.meta.env.PUBLIC_EMAILJS_SERVICE_ID as string | undefined) ?? "";
const TEMPLATE = (import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID as string | undefined) ?? "";
const KEY = (import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY as string | undefined) ?? "";
export const emailReady = Boolean(SERVICE && TEMPLATE && KEY);

export async function sendEmail(mail: EmailParts) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: SERVICE,
      template_id: TEMPLATE,
      user_id: KEY,
      template_params: {
        to_email: COACH_EMAIL,
        reply_to: mail.replyTo,
        from_name: mail.fromName,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      },
    }),
  });
  if (!res.ok) throw new Error(`Email failed (${res.status})`);
}
