import { createHash } from "crypto";
import PDFDocument from "pdfkit";
import { Track } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { SITE_NAME } from "@/lib/site";

/**
 * Required verbatim on every CLINICIAN-track certificate — this is not
 * APA-approved continuing education, and the certificate has to say so.
 */
export const CLINICIAN_DISCLAIMER =
  "This certificate documents completion of a self-paced educational program. It is not APA-approved continuing education.";

/**
 * The credentialed person/organization issuing certificates, and their
 * license number — real identifying information a course platform issuing
 * CE certificates needs, so there is no plausible default here. Left
 * unset, the certificate says so plainly rather than fabricating one.
 */
export const CERTIFICATE_ISSUER_NAME =
  process.env.CERTIFICATE_ISSUER_NAME?.trim() || "";
export const CERTIFICATE_ISSUER_LICENSE_NUMBER =
  process.env.CERTIFICATE_ISSUER_LICENSE_NUMBER?.trim() || "";

/** Minutes to hours, one decimal place — e.g. 190 -> "3.2". */
export function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

/**
 * A short, deterministic code printed on the certificate — derived from
 * the enrollment id via SHA-256 rather than the raw id itself (so it isn't
 * just the database primary key on public display), grouped for
 * readability. Recomputable from the id alone; nothing extra to store.
 */
export function deriveVerificationCode(enrollmentId: string): string {
  const hash = createHash("sha256").update(enrollmentId).digest("hex").toUpperCase();
  const code = hash.slice(0, 12);
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

export type CertificateData = {
  enrollmentId: string;
  learnerUserId: string;
  learnerName: string;
  courseTitle: string;
  track: Track;
  estimatedMinutes: number;
  hours: string;
  completedAt: Date;
  verificationCode: string;
  issuerName: string;
  issuerLicenseNumber: string;
};

/** Null for an enrollment that doesn't exist, or hasn't been completed yet — there is nothing to certify. */
export async function getCertificateData(
  enrollmentId: string,
): Promise<CertificateData | null> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      userId: true,
      completedAt: true,
      user: { select: { name: true } },
      course: { select: { title: true, track: true, estimatedMinutes: true } },
    },
  });
  if (!enrollment || !enrollment.completedAt) return null;

  return {
    enrollmentId: enrollment.id,
    learnerUserId: enrollment.userId,
    learnerName: enrollment.user.name,
    courseTitle: enrollment.course.title,
    track: enrollment.course.track,
    estimatedMinutes: enrollment.course.estimatedMinutes,
    hours: formatHours(enrollment.course.estimatedMinutes),
    completedAt: enrollment.completedAt,
    verificationCode: deriveVerificationCode(enrollment.id),
    issuerName: CERTIFICATE_ISSUER_NAME || "Issuer name not configured",
    issuerLicenseNumber:
      CERTIFICATE_ISSUER_LICENSE_NUMBER || "not configured",
  };
}

/**
 * Renders the certificate as a PDF from the exact same data the HTML page
 * at /certificates/[enrollmentId] shows — one shared `getCertificateData`
 * call feeding both, rather than a screenshot of the page. This app has no
 * headless-browser dependency, and adding one (Playwright/Puppeteer, with
 * a bundled Chromium) just to convert one page to PDF would be a heavy,
 * unrelated infra decision; pdfkit draws the equivalent content directly
 * and needs nothing beyond Node.
 */
export function renderCertificatePdf(data: CertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 72 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(10)
      .fillColor("#4d5e74")
      .text(SITE_NAME.toUpperCase(), { align: "center" });
    doc.moveDown(1.5);
    doc
      .fontSize(28)
      .fillColor("#0b2545")
      .text("Certificate of Completion", { align: "center" });
    doc.moveDown(1.5);
    doc.fontSize(14).fillColor("#0b2545").text("This certifies that", {
      align: "center",
    });
    doc.moveDown(0.5);
    doc
      .fontSize(22)
      .fillColor("#0b2545")
      .text(data.learnerName, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor("#0b2545").text("has completed", {
      align: "center",
    });
    doc.moveDown(0.5);
    doc
      .fontSize(18)
      .fillColor("#0b2545")
      .text(data.courseTitle, { align: "center" });
    doc.moveDown(1);
    doc
      .fontSize(12)
      .fillColor("#4d5e74")
      .text(
        `${data.hours} hour${data.hours === "1.0" ? "" : "s"} · Completed ${data.completedAt.toLocaleDateString(
          "en-US",
          { dateStyle: "long" },
        )}`,
        { align: "center" },
      );

    if (data.track === Track.CLINICIAN) {
      doc.moveDown(1);
      doc
        .fontSize(9)
        .fillColor("#4d5e74")
        .text(CLINICIAN_DISCLAIMER, { align: "center" });
    }

    doc.moveDown(3);
    doc
      .fontSize(11)
      .fillColor("#0b2545")
      .text(data.issuerName, { align: "center" });
    doc
      .fontSize(9)
      .fillColor("#4d5e74")
      .text(`License #${data.issuerLicenseNumber}`, { align: "center" });

    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor("#4d5e74")
      .text(`Verification code: ${data.verificationCode}`, {
        align: "center",
      });

    doc.end();
  });
}

/**
 * Renders and stores the certificate PDF, then stamps
 * `certificateIssuedAt`/`certificateStorageKey`. Idempotent: an already-
 * issued certificate is returned as-is rather than regenerated, so calling
 * this more than once (the on-demand PDF route, on top of the automatic
 * call from `markLessonComplete`) never creates a second stored file.
 * Returns null only when the enrollment doesn't exist or isn't complete —
 * there's nothing to certify yet.
 */
export async function issueCertificate(
  enrollmentId: string,
): Promise<{ storageKey: string } | null> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, completedAt: true, certificateStorageKey: true },
  });
  if (!enrollment || !enrollment.completedAt) return null;

  if (enrollment.certificateStorageKey) {
    return { storageKey: enrollment.certificateStorageKey };
  }

  const data = await getCertificateData(enrollmentId);
  if (!data) return null;

  const pdf = await renderCertificatePdf(data);
  const { storageKey } = await storage.saveGeneratedFile(
    enrollmentId,
    "certificate.pdf",
    pdf,
  );

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { certificateIssuedAt: new Date(), certificateStorageKey: storageKey },
  });

  return { storageKey };
}
