export interface EmailService {
  send(params: { to: string; subject: string; body: string }): Promise<void>;
}

class ConsoleEmailService implements EmailService {
  async send(params: { to: string; subject: string; body: string }) {
    console.log(
      `[dev email] to=${params.to} subject="${params.subject}"\n${params.body}`,
    );
  }
}

class ResendEmailService implements EmailService {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(params: { to: string; subject: string; body: string }) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: params.to,
        subject: params.subject,
        text: params.body,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Resend send failed (${response.status}): ${detail}`);
    }
  }
}

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Sati Center LMS <noreply@saticenter.org>";

// Swap in another EmailService implementation (SMTP/nodemailer, etc.) by
// changing this one line — every call site depends only on the interface.
export const emailService: EmailService = apiKey
  ? new ResendEmailService(apiKey, from)
  : new ConsoleEmailService();
