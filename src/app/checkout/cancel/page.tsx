import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PublicShell } from "@/components/shell/PublicShell";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Checkout canceled",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: slug } = await searchParams;

  const course = slug
    ? await prisma.course.findUnique({
        where: { slug },
        select: { slug: true, title: true },
      })
    : null;

  return (
    <PublicShell>
      <div className="mx-auto max-w-lg px-6 py-16">
        <Card>
          <h1 className="mb-2 font-heading text-2xl font-semibold text-[var(--color-olive)]">
            Checkout canceled
          </h1>
          <p className="mb-6 font-body text-sm text-[var(--color-ink-muted)]">
            No payment was made{course ? ` for ${course.title}` : ""}. Nothing
            was charged.
          </p>
          <Link
            href={course ? `/courses/${course.slug}` : "/explore"}
            className="block rounded-md bg-[var(--color-olive)] px-4 py-2.5 text-center font-body text-sm font-medium text-white transition-colors hover:bg-[var(--color-olive-dark)]"
          >
            {course ? "Back to the course page" : "Browse courses"}
          </Link>
        </Card>
      </div>
    </PublicShell>
  );
}
