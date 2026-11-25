// Emails a finished form to James through EmailJS (free plan: 200 emails a month).
// The email's design is built by email.ts; the EmailJS template just prints it ({{{html}}}).
// Setup steps are in the README ("Form emails").
import type { EmailParts } from "./email";
// The recipient (James) is typed into the EmailJS template itself, never sent from here,
// so the public key can't be used to email anyone else.

// James's EmailJS account (Outlook: jpickles.coaching@outlook.com). These are public by design:
// they're visible in any browser. Safety comes from the template's fixed "To Email".
// Vercel environment variables, if set, override them.
const SERVICE = (import.meta.env.PUBLIC_EMAILJS_SERVICE_ID as string | undefined) || "service_xmftby5";
const TEMPLATE = (import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID as string | undefined) || "template_b837y9l";
const KEY = (import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY as string | undefined) || "8yJ3MF4HjOlUegLyf";
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
