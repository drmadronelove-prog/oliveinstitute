import { TopNav } from "@/components/shell/TopNav";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { Wordmark } from "@/components/shell/Wordmark";
import { Sidebar } from "@/components/shell/Sidebar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OliveMark } from "@/components/brand/OliveMark";
import { DriftingOlives } from "@/components/brand/DriftingOlives";
import { DashboardBand } from "@/components/dashboard/DashboardBand";
import { StatGrid } from "@/components/dashboard/StatGrid";
import { CourseTile } from "@/components/dashboard/CourseTile";
import { CourseCard } from "@/components/storefront/CourseCard";
import { ResourceList } from "@/components/course/ResourceList";

type Swatch = { name: string; token: string; hex: string; note?: string };

const BRAND: Swatch[] = [
  { name: "Ink", token: "--ink", hex: "#0B2545", note: "Nav, outlines, type" },
  { name: "Paper", token: "--paper", hex: "#F3F3F3", note: "Page ground" },
  { name: "Linen", token: "--linen", hex: "#E9E9E9", note: "Section bands" },
  { name: "Glass", token: "--glass", hex: "#9FB3B0", note: "Badges, tiles" },
  { name: "Plum", token: "--plum", hex: "#7A4F6E", note: "Accent, focus ring" },
  { name: "Gold", token: "--gold", hex: "#C5A572", note: "CTA, rules" },
  { name: "Rose", token: "--rose", hex: "#C4877E", note: "Tiles" },
  { name: "Dusk", token: "--dusk", hex: "#B88894", note: "Notes" },
];

const TYPE_ON_COLOR: Swatch[] = [
  {
    name: "Muted",
    token: "--muted",
    hex: "#4D5E74",
    note: "Body copy on paper",
  },
  { name: "On ink", token: "--on-ink", hex: "#C9D2DE", note: "Copy on ink" },
  { name: "On plum", token: "--on-plum", hex: "#EFE4EC", note: "Copy on plum" },
  {
    name: "Eyebrow on plum",
    token: "--eyebrow-on-plum",
    hex: "#E3D8C6",
    note: "Label on plum",
  },
  {
    name: "Role chip",
    token: "--role-chip",
    hex: "#716B5E",
    note: "Role label on paper",
  },
  { name: "Rule", token: "--rule", hex: "#CBA558", note: "Lockup hairline" },
  { name: "Mist", token: "--mist", hex: "#8C9BB0", note: "Ticker metadata" },
  { name: "Soft", token: "--soft", hex: "#E1E1E1", note: "Inset rows" },
];

const SAMPLE_RESOURCES = [
  {
    id: "m1",
    type: "PDF" as const,
    title: "Course reader (PDF)",
    url: "/api/files/demo/reader.pdf",
    uploadedAt: new Date("2026-01-01"),
  },
  {
    id: "m2",
    type: "LINK" as const,
    title: "Further reading",
    url: "https://example.org/reading",
    uploadedAt: new Date("2026-01-01"),
  },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="mb-1 font-heading text-3xl font-medium tracking-[-0.025em] text-[var(--ink)]">
        {title}
      </h2>
      {description ? (
        <p className="mb-5 max-w-prose font-body text-[15px] text-[var(--muted)]">
          {description}
        </p>
      ) : (
        <div className="mb-5" />
      )}
      {children}
    </section>
  );
}

function SwatchGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {swatches.map((swatch) => (
        <div
          key={swatch.token}
          className="pop overflow-hidden rounded-[14px] bg-white"
        >
          <div
            className="h-16 w-full border-b-2 border-[var(--ink)]"
            style={{ backgroundColor: `var(${swatch.token})` }}
          />
          <div className="px-3 py-2">
            <p className="font-body text-xs font-semibold text-[var(--ink)]">
              {swatch.name}
            </p>
            <p className="font-body text-[0.6875rem] text-[var(--muted)]">
              {swatch.hex}
              {swatch.note ? ` · ${swatch.note}` : ""}
            </p>
            <code className="mt-1 block font-mono text-[0.625rem] text-[var(--muted)]">
              {swatch.token}
            </code>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav
        links={[{ href: "/style-guide", label: "For clinicians" }]}
        cta={{ href: "/style-guide", label: "My courses" }}
      />

      <main className="dot-grid flex-1">
        <div className="mx-auto w-full max-w-7xl px-6 py-10">
          <h1 className="mb-2 font-heading text-5xl font-medium tracking-[-0.03em] text-[var(--ink)]">
            Style Guide
          </h1>
          <p className="mb-12 max-w-prose font-body text-[var(--muted)]">
            Every design token and shared component in isolation. Colours are
            oliveclinical.com&apos;s own palette; the treatment is this site&apos;s:
            every raised surface is a 2px ink outline plus a hard, un-blurred
            shadow, and nothing is blurred or tinted. Display type is Fraunces
            (SOFT 50), body and UI are Geist, and small numerals are Geist Mono.
          </p>

          <Section
            title="Brand palette"
            description="The colours every surface is built from. Text on a coloured surface is always ink — the tinted-on-tinted combinations that used to appear here do not clear 4.5:1."
          >
            <SwatchGrid swatches={BRAND} />
          </Section>

          <Section
            title="Type colours and fine detail"
            description="Each of these is named for the surface it is legible on, and was checked against it rather than assumed."
          >
            <SwatchGrid swatches={TYPE_ON_COLOR} />
          </Section>

          <Section
            title="Typography"
            description="font-heading is Fraunces, font-body is Geist, font-mono is Geist Mono. There is no font-serif utility."
          >
            <div className="flex flex-col gap-3">
              <p className="font-heading text-5xl font-medium tracking-[-0.03em] text-[var(--ink)]">
                Display / Fraunces 5xl medium
              </p>
              <p className="font-heading text-3xl font-medium italic text-[var(--plum)]">
                Emphasis / Fraunces 3xl italic
              </p>
              <p className="font-heading text-xl font-medium text-[var(--ink)]">
                Card title / Fraunces xl medium
              </p>
              <p className="font-body text-base text-[var(--ink)]">
                Body text / Geist base — the quick brown fox jumps over the lazy
                dog.
              </p>
              <p className="font-body text-[15px] text-[var(--muted)]">
                Muted / Geist — metadata, descriptions and captions.
              </p>
              <p className="font-mono text-sm text-[var(--plum)]">
                01 · Geist Mono — module numbers, durations, counts
              </p>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-[var(--plum)]">
                Eyebrow label
              </p>
            </div>
          </Section>

          <Section
            title="The mark"
            description="One even-odd path, filled with currentColor, so the same file is the lockup, a drifting shape and a ticker separator."
          >
            <div className="flex flex-wrap items-center gap-8">
              <OliveMark className="h-20 w-20 text-[var(--plum)]" title="Olive Institute" />
              <OliveMark className="h-12 w-12 text-[var(--gold)]" />
              <OliveMark className="h-8 w-8 text-[var(--ink)]" />
            </div>
          </Section>

          <Section
            title="Lockup"
            description="tone=light sits on ink; tone=dark sits on paper."
          >
            <div className="flex flex-col gap-4">
              <div className="pop rounded-[14px] bg-[var(--ink)] px-6 py-4">
                <Wordmark />
              </div>
              <div className="pop rounded-[14px] bg-[var(--paper)] px-6 py-4">
                <Wordmark tone="dark" />
              </div>
            </div>
          </Section>

          <Section
            title="Raised surfaces"
            description="pop, pop-lg and btn-pop. A card lifts toward the top-left on hover; a button presses into the space its shadow occupied."
          >
            <div className="flex flex-wrap items-center gap-5">
              <span className="pop rounded-[14px] bg-white px-5 py-4 font-body text-sm">
                .pop
              </span>
              <span className="pop-lg rounded-[14px] bg-white px-5 py-4 font-body text-sm">
                .pop-lg
              </span>
              <span className="pop-lg pop-hover rounded-[14px] bg-[var(--glass)] px-5 py-4 font-body text-sm">
                .pop-hover
              </span>
              <button
                type="button"
                className="btn-pop rounded-full bg-[var(--gold)] px-6 py-3 font-body font-semibold text-[var(--ink)]"
              >
                .btn-pop
              </button>
            </div>
          </Section>

          <Section
            title="Drifting olives"
            description="Decorative only, aria-hidden, and stopped outright under prefers-reduced-motion."
          >
            <div className="pop-lg overflow-hidden rounded-3xl bg-[var(--plum)] px-8 py-6">
              <DriftingOlives variant="band" tone="plum" />
            </div>
          </Section>

          <Section title="Top nav and footer">
            <div className="pop overflow-hidden rounded-[14px]">
              <TopNav
                links={[{ href: "/style-guide", label: "Explore" }]}
                cta={{ href: "/style-guide", label: "Sign in" }}
              />
              <SiteFooter links={[{ href: "/style-guide", label: "Terms" }]} />
            </div>
          </Section>

          <Section
            title="Sidebar"
            description="Rendered only for learners; lists their enrolled courses."
          >
            <div className="max-w-xs">
              <Sidebar
                learnerCourses={[
                  { id: "c1", title: "Foundations of Practice" },
                  { id: "c2", title: "Readings in Ethics" },
                ]}
              />
            </div>
          </Section>

          <Section title="Badges">
            <div className="flex flex-wrap gap-3">
              <Badge>PDF</Badge>
              <Badge>LINK</Badge>
              <Badge>VIDEO</Badge>
              <Badge>Enrolled</Badge>
            </div>
          </Section>

          <Section
            title="Dashboard band"
            description="Plum for a learner, gold for staff. Replaced the old photo hero card."
          >
            <div className="flex flex-col gap-5">
              <DashboardBand
                tone="gold"
                title={
                  <>
                    Olive <em className="italic text-[var(--plum-on-gold)]">Institute</em>
                  </>
                }
                subtext="Self-paced courses, available whenever you are."
              />
              <StatGrid
                stats={[
                  { label: "Published courses", value: "3" },
                  { label: "Learners", value: "128" },
                  { label: "Enrollments this month", value: "41" },
                  { label: "Revenue this month", value: "$2,460.00" },
                ]}
              />
            </div>
          </Section>

          <Section
            title="Course tiles"
            description="Three surfaces in rotation, plus the muted treatment for a finished course."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CourseTile
                href="/style-guide"
                title="Foundations of Practice"
                meta="Clinician · 3h 10m"
                secondaryLabel="12 enrolled"
                tone="glass"
              />
              <CourseTile
                href="/style-guide"
                title="Readings in Ethics"
                meta="Public · 1h 45m"
                tone="rose"
              />
              <CourseTile
                href="/style-guide"
                title="Archived Seminar"
                meta="Public · 55m"
                secondaryLabel="Completed"
                muted
              />
            </div>
          </Section>

          <Section
            title="Catalogue card"
            description="How a published course appears on /explore and /clinicians."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <CourseCard
                course={{
                  slug: "style-guide",
                  title: "Foundations of Practice",
                  subtitle: "A clinical grounding, at your own pace",
                  track: "CLINICIAN",
                  priceCents: 24900,
                  estimatedMinutes: 190,
                  lessonCount: 5,
                }}
              />
            </div>
          </Section>

          <Section
            title="Cards"
            description="The base surface. accentColor adds a left rule."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <p className="font-body text-sm text-[var(--muted)]">
                  The base <code>Card</code> — an outlined white surface used as
                  the building block for every content panel.
                </p>
              </Card>
              <Card accentColor="var(--plum)">
                <p className="font-body text-sm text-[var(--muted)]">
                  The same card with a plum accent rule, used to draw the eye to
                  a single panel.
                </p>
              </Card>
            </div>
          </Section>

          <Section
            title="Resource list"
            description="How lesson resources render for instructors and learners."
          >
            <Card>
              <ResourceList resources={SAMPLE_RESOURCES} />
            </Card>
          </Section>

          <Section title="Empty state">
            <Card>
              <ResourceList resources={[]} />
            </Card>
          </Section>
        </div>
      </main>
    </div>
  );
}
