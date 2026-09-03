import { emailService } from "@/lib/email";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { formatPrice } from "@/lib/format";

/**
 * The one transactional email a completed purchase sends. Called only from
 * the webhook handler, alongside the same PENDING -> PAID transition that
 * grants access — so a receipt only ever goes out for a purchase that is
 * actually paid, and only once (the handler's idempotency guard is what
 * stops a replayed webhook from sending it twice).
 */
export async function sendPurchaseReceiptEmail(params: {
  to: string;
  name: string;
  courseTitle: string;
  courseSlug: string;
  amountCents: number;
  currency: string;
}) {
  const link = absoluteUrl(`/courses/${params.courseSlug}`);
  await emailService.send({
    to: params.to,
    subject: `Your receipt for ${params.courseTitle}`,
    body: [
      `Hello ${params.name},`,
      "",
      `Thanks for your purchase — you now have access to ${params.courseTitle}.`,
      "",
      `Amount charged: ${formatPrice(params.amountCents, params.currency)}`,
      "",
      `Start the course any time: ${link}`,
      "",
      `— ${SITE_NAME}`,
    ].join("\n"),
  });
}
