import { describe, expect, it, afterEach, vi } from "vitest";

/**
 * The transport is chosen once, at module load, from the environment — so
 * each case here sets the environment, imports a fresh copy of the module,
 * and resets the registry afterwards.
 */
async function loadEmailModule(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      vi.stubEnv(key, "");
      delete process.env[key];
    } else {
      vi.stubEnv(key, value);
    }
  }
  return import("@/lib/email");
}

const MESSAGE = {
  to: "learner@example.test",
  subject: "Confirm your email",
  body: "link",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("email transport selection", () => {
  it("is unconfigured unless both the key and the from address are set", async () => {
    const neither = await loadEmailModule({
      RESEND_API_KEY: undefined,
      EMAIL_FROM: undefined,
      EMAIL_CAPTURE_DIR: undefined,
      NODE_ENV: "development",
    });
    expect(neither.emailConfigured).toBe(false);

    const keyOnly = await loadEmailModule({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: undefined,
      EMAIL_CAPTURE_DIR: undefined,
      NODE_ENV: "development",
    });
    expect(keyOnly.emailConfigured).toBe(false);

    const both = await loadEmailModule({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Olive <noreply@verified.test>",
      EMAIL_CAPTURE_DIR: undefined,
      NODE_ENV: "development",
    });
    expect(both.emailConfigured).toBe(true);
  });

  it("logs rather than sending in development, so local work needs no key", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { emailService } = await loadEmailModule({
      RESEND_API_KEY: undefined,
      EMAIL_FROM: undefined,
      EMAIL_CAPTURE_DIR: undefined,
      NODE_ENV: "development",
    });

    await expect(emailService.send(MESSAGE)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledOnce();
  });

  it("refuses to send in production when it is unconfigured, naming what is missing", async () => {
    const { emailService } = await loadEmailModule({
      RESEND_API_KEY: undefined,
      EMAIL_FROM: undefined,
      EMAIL_CAPTURE_DIR: undefined,
      NODE_ENV: "production",
    });

    // The failure this guards against is the silent one: a learner told to
    // check an inbox that will never receive anything.
    await expect(emailService.send(MESSAGE)).rejects.toThrow(
      /RESEND_API_KEY and EMAIL_FROM/,
    );
  });

  it("refuses in production when only the from address is missing", async () => {
    const { emailService } = await loadEmailModule({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: undefined,
      EMAIL_CAPTURE_DIR: undefined,
      NODE_ENV: "production",
    });

    const error = await emailService.send(MESSAGE).catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain("Set EMAIL_FROM");
    // No invented default: a guessed domain is rejected by Resend anyway.
    expect((error as Error).message).not.toContain("oliveinstitute.org");
  });

  it("posts to Resend with the configured from address once both are set", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));

    const { emailService } = await loadEmailModule({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Olive <noreply@verified.test>",
      EMAIL_CAPTURE_DIR: undefined,
      NODE_ENV: "production",
    });

    await emailService.send(MESSAGE);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
      from: "Olive <noreply@verified.test>",
      to: MESSAGE.to,
      subject: MESSAGE.subject,
    });
  });

  it("surfaces a Resend rejection rather than swallowing it", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("The domain is not verified.", { status: 403 }),
    );

    const { emailService } = await loadEmailModule({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Olive <noreply@unverified.test>",
      EMAIL_CAPTURE_DIR: undefined,
      NODE_ENV: "production",
    });

    await expect(emailService.send(MESSAGE)).rejects.toThrow(
      /Resend send failed \(403\): The domain is not verified\./,
    );
  });
});
