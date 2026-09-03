import type { Metadata } from "next";
import Link from "next/link";
import { Track } from "@prisma/client";
import { listPublishedCourses } from "@/lib/catalog";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { PublicShell } from "@/components/shell/PublicShell";
import { CatalogGrid } from "@/components/storefront/CatalogGrid";

const DESCRIPTION =
  "Self-paced courses from Olive Institute — clinical training for practitioners, and grounded practices for everyone else. Start whenever you like and work at your own pace.";

export const metadata: Metadata = {
  title: "Self-paced courses",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — self-paced courses`,
    description: DESCRIPTION,
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — self-paced courses`,
    description: DESCRIPTION,
  },
};

// Rendered per request: the catalogue is database-backed, so prerendering it
// would both bake the course list into the build and require a live database
// to build at all. Crawlers still receive fully rendered HTML with metadata.
export const dynamic = "force-dynamic";

const TRACKS = [
  {
    href: "/clinicians",
    eyebrow: "For clinicians",
    title: "Clinical training",
    body: "Structured, evidence-led courses for practitioners who want depth without a cohort schedule. Work through them between sessions, at whatever pace the week allows.",
    cta: "Browse clinician courses",
  },
  {
    href: "/explore",
    eyebrow: "For everyone",
    title: "Practices for everyday life",
    body: "Unhurried, practical courses with no clinical background assumed and nothing you have to believe. Start with the free preview and see if the voice suits you.",
    cta: "Explore courses",
  },
] as const;

export default async function HomePage() {
  const [clinicianCourses, publicCourses] = await Promise.all([
    listPublishedCourses(Track.CLINICIAN),
    listPublishedCourses(Track.PUBLIC),
  ]);

  return (
    <PublicShell>
      <section className="bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-olive)]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          <h1 className="max-w-3xl font-heading text-5xl font-semibold leading-[1.05] text-[var(--color-ivory)] md:text-6xl">
            Courses you can start today and finish at your own pace.
          </h1>
          <div className="my-6 h-[2px] w-16 bg-[var(--color-gold)]" />
          <p className="max-w-2xl font-body text-lg text-[var(--color-ivory)]/85">
            {DESCRIPTION}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          {TRACKS.map((track) => (
            <Link
              key={track.href}
              href={track.href}
              className="group flex flex-col gap-3 rounded-2xl bg-[var(--color-card)] p-8 shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="font-body text-xs uppercase tracking-[0.14em] text-[var(--color-terracotta)]">
                {track.eyebrow}
              </span>
              <h2 className="font-heading text-3xl font-semibold text-[var(--color-olive)]">
                {track.title}
              </h2>
              <p className="font-body text-sm text-[var(--color-ink-muted)]">
                {track.body}
              </p>
              <span className="mt-2 font-body text-sm font-medium text-[var(--color-olive)] underline underline-offset-4 group-hover:text-[var(--color-olive-dark)]">
                {track.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8 md:px-10">
        <h2 className="mb-1 font-heading text-2xl font-semibold text-[var(--color-olive)]">
          For clinicians
        </h2>
        <p className="mb-6 font-body text-sm text-[var(--color-ink-muted)]">
          Training for practising clinicians.
        </p>
        <CatalogGrid
          courses={clinicianCourses}
          emptyMessage="No clinician courses are published yet."
        />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
        <h2 className="mb-1 font-heading text-2xl font-semibold text-[var(--color-olive)]">
          For everyone
        </h2>
        <p className="mb-6 font-body text-sm text-[var(--color-ink-muted)]">
          No background needed.
        </p>
        <CatalogGrid
          courses={publicCourses}
          emptyMessage="No public courses are published yet."
        />
      </section>
    </PublicShell>
  );
}
