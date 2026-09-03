import { emailService } from "@/lib/email";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

/**
 * The transactional emails the account flows send. Every one goes through
 * `EmailService`, so swapping the transport stays a one-line change.
 */

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string;
}) {
  const link = absoluteUrl(`/verify-email/${params.token}`);
  await emailService.send({
    to: params.to,
    subject: `Confirm your email for ${SITE_NAME}`,
    body: [
      `Hello ${params.name},`,
      "",
      `Confirm your email address to finish setting up your ${SITE_NAME} account:`,
      "",
      link,
      "",
      "The link is good for 24 hours. You can sign in and look around before confirming, but you will need to confirm before buying a course.",
      "",
      "If you didn't create this account, you can ignore this message.",
    ].join("\n"),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}) {
  const link = absoluteUrl(`/reset-password/${params.token}`);
  await emailService.send({
    to: params.to,
    subject: `Reset your ${SITE_NAME} password`,
    body: [
      `Hello ${params.name},`,
      "",
      "Use this link to choose a new password:",
      "",
      link,
      "",
      "The link expires in one hour and works once.",
      "",
      "If you didn't ask to reset your password, you can ignore this message — nothing has changed.",
    ].join("\n"),
  });
}

/** Sent when an admin creates an account: the invitee sets their own password. */
export async function sendAccountInviteEmail(params: {
  to: string;
  name: string;
  token: string;
}) {
  const link = absoluteUrl(`/reset-password/${params.token}`);
  await emailService.send({
    to: params.to,
    subject: `Set your password for ${SITE_NAME}`,
    body: [
      `Hello ${params.name},`,
      "",
      `An account has been created for you at ${SITE_NAME}. Choose a password to finish setting it up:`,
      "",
      link,
      "",
      "The link expires in one hour. If it lapses, use \"Forgot password\" on the sign-in page to get a new one.",
    ].join("\n"),
  });
}
