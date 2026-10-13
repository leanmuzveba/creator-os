/**
 * Transactional email via Brevo's HTTP API (same env vars as SkillTrade:
 * BREVO_API_KEY, MAIL_FROM_EMAIL — a sender verified in Brevo — and
 * optional MAIL_FROM_NAME).
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL);
}

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { email: process.env.MAIL_FROM_EMAIL, name: process.env.MAIL_FROM_NAME || 'Creator OS' },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}
