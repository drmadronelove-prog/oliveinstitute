import type { Metadata } from "next";
import { Track } from "@prisma/client";
import { listPublishedCourses } from "@/lib/catalog";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { PublicShell } from "@/components/shell/PublicShell";
import { CatalogGrid } from "@/components/storefront/CatalogGrid";

const TITLE = "Explore courses";
const DESCRIPTION =
  "Self-paced courses from Olive Institute for anyone: practical, unhurried practices with no clinical background needed and nothing you have to believe.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/explore") },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/explore"),
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// Rendered per request: the catalogue is database-backed, so prerendering it
// would both bake the course list into the build and require a live database
// to build at all. Crawlers still receive fully rendered HTML with metadata.
export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const courses = await listPublishedCourses(Track.PUBLIC);

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <h1 className="mb-2 font-heading text-4xl font-semibold text-[var(--color-olive)]">
          {TITLE}
        </h1>
        <p className="mb-10 max-w-2xl font-body text-[var(--color-ink-muted)]">
          {DESCRIPTION}
        </p>
        <CatalogGrid
          courses={courses}
          emptyMessage="No courses are published yet. Check back soon."
        />
      </div>
    </PublicShell>
  );
}
