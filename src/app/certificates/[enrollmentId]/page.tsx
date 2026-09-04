import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireSession } from "@/lib/rbac";
import {
  CLINICIAN_DISCLAIMER,
  getCertificateData,
} from "@/lib/certificate";
import { withBasePath } from "@/lib/basePath";
import { SITE_NAME } from "@/lib/site";
import { PrintButton } from "./PrintButton";

/**
 * Owner-only (or ADMIN, matching this app's usual "admin sees everything"
 * rule) — print-styled, not wrapped in AppShell, so a learner printing or
 * saving it to PDF from the browser gets a clean page with no nav chrome.
 * The PDF a browser's print dialog produces and the one
 * GET /api/certificates/[enrollmentId]/pdf generates and stores show the
 * same underlying data (both come from getCertificateData) but are two
 * different renders — this page is HTML/CSS, that route is pdfkit.
 */
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const session = await requireSession();
  const { enrollmentId } = await params;

  const data = await getCertificateData(enrollmentId);
  if (!data) {
    notFound();
  }

  if (data.learnerUserId !== session.user.id && session.user.role !== Role.ADMIN) {
    notFound();
  }

  return (
    <main className="flex min-h-full flex-col items-center bg-[var(--color-ivory)] px-6 py-12 print:bg-white print:py-0">
      <div className="mb-6 flex gap-3 print:hidden">
        <PrintButton />
        <a
          href={withBasePath(`/api/certificates/${data.enrollmentId}/pdf`)}
          className="rounded-md border border-[var(--color-olive)] px-4 py-2 font-body text-sm text-[var(--color-olive)] transition-colors hover:bg-[var(--color-olive)] hover:text-white"
        >
          Download PDF
        </a>
      </div>

      <div className="w-full max-w-2xl rounded-xl border-4 border-double border-[var(--color-gold)] bg-white p-12 text-center shadow-sm print:max-w-none print:border-2 print:shadow-none">
        <p className="mb-6 font-body text-xs uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
          {SITE_NAME}
        </p>
        <h1 className="mb-6 font-heading text-4xl font-semibold text-[var(--color-ink)]">
          Certificate of Completion
        </h1>
        <p className="mb-2 font-body text-base text-[var(--color-ink)]">
          This certifies that
        </p>
        <p className="mb-4 font-heading text-2xl font-semibold text-[var(--color-olive)]">
          {data.learnerName}
        </p>
        <p className="mb-2 font-body text-base text-[var(--color-ink)]">
          has completed
        </p>
        <p className="mb-6 font-heading text-xl font-semibold text-[var(--color-olive)]">
          {data.courseTitle}
        </p>
        <p className="mb-2 font-body text-sm text-[var(--color-ink-muted)]">
          {data.hours} hour{data.hours === "1.0" ? "" : "s"} &middot;
          Completed{" "}
          {data.completedAt.toLocaleDateString("en-US", { dateStyle: "long" })}
        </p>

        {data.track === "CLINICIAN" ? (
          <p className="mt-4 font-body text-xs text-[var(--color-ink-muted)]">
            {CLINICIAN_DISCLAIMER}
          </p>
        ) : null}

        <div className="mt-12 border-t border-black/10 pt-4">
          <p className="font-body text-sm font-medium text-[var(--color-ink)]">
            {data.issuerName}
          </p>
          <p className="font-body text-xs text-[var(--color-ink-muted)]">
            License #{data.issuerLicenseNumber}
          </p>
        </div>

        <p className="mt-8 font-body text-xs text-[var(--color-ink-muted)]">
          Verification code: {data.verificationCode}
        </p>
      </div>
    </main>
  );
}
