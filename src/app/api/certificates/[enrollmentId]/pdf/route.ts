import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getCertificateData, issueCertificate } from "@/lib/certificate";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "./uploads";
const GENERATED_PREFIX = "generated";

/**
 * Issues the certificate if it hasn't been already (idempotent — see
 * issueCertificate) and streams the stored PDF back. Owner-only, or ADMIN,
 * the same rule as the HTML certificate page.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  const { enrollmentId } = await params;

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getCertificateData(enrollmentId);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (data.learnerUserId !== session.user.id && session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const issued = await issueCertificate(enrollmentId);
  if (!issued) {
    return NextResponse.json(
      { error: "Could not generate the certificate." },
      { status: 500 },
    );
  }

  const fullPath = path.join(
    /*turbopackIgnore: true*/ UPLOADS_DIR,
    GENERATED_PREFIX,
    issued.storageKey,
  );
  const resolvedGeneratedDir = path.resolve(
    /*turbopackIgnore: true*/ UPLOADS_DIR,
    GENERATED_PREFIX,
  );
  if (!path.resolve(fullPath).startsWith(resolvedGeneratedDir)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const pdf = await readFile(fullPath);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate-${enrollmentId}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
