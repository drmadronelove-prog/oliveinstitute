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

/**
 * Writes a copy of every message to `EMAIL_CAPTURE_DIR` as JSON, so an
 * end-to-end test can follow a real verification or reset link instead of
 * reaching into the database for a token it cannot unhash.
 *
 * Development and test only — never set EMAIL_CAPTURE_DIR in production,
 * where it would leave password reset links sitting on disk.
 */
class CapturingEmailService implements EmailService {
  constructor(
    private readonly inner: EmailService,
    private readonly dir: string,
  ) {}

  async send(params: { to: string; subject: string; body: string }) {
    await this.inner.send(params);

    const { mkdir, writeFile } = await import("fs/promises");
    const path = await import("path");
    await mkdir(this.dir, { recursive: true });
    await writeFile(
      path.join(this.dir, `${Date.now()}-${crypto.randomUUID()}.json`),
      JSON.stringify({ ...params, sentAt: new Date().toISOString() }, null, 2),
    );
  }
}

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Olive Institute <noreply@oliveinstitute.org>";

// Swap in another EmailService implementation (SMTP/nodemailer, etc.) by
// changing this one line — every call site depends only on the interface.
const transport: EmailService = apiKey
  ? new ResendEmailService(apiKey, from)
  : new ConsoleEmailService();

const captureDir = process.env.EMAIL_CAPTURE_DIR;

export const emailService: EmailService = captureDir
  ? new CapturingEmailService(transport, captureDir)
  : transport;
