import { TopNav } from "@/components/shell/TopNav";
import { Wordmark } from "@/components/shell/Wordmark";
import { Sidebar } from "@/components/shell/Sidebar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HeroCard } from "@/components/dashboard/HeroCard";
import { CourseTile } from "@/components/dashboard/CourseTile";
import { ResourceList } from "@/components/course/ResourceList";

type Swatch = { name: string; token: string; hex: string; note?: string };

const BRAND: Swatch[] = [
  { name: "Ink", token: "--color-olive", hex: "#0B2545", note: "Nav, headings" },
  { name: "Glass", token: "--color-sage", hex: "#9FB3B0", note: "Badges, hero" },
  { name: "Linen", token: "--color-sage-pale", hex: "#E9E9E9", note: "Inset rows" },
  { name: "Paper", token: "--color-ivory", hex: "#F3F3F3", note: "Page ground" },
  { name: "Rose", token: "--color-terracotta", hex: "#895F58", note: "Accent" },
  { name: "Gold", token: "--color-gold", hex: "#C5A572", note: "Dividers" },
];

const SHADES: Swatch[] = [
  { name: "Ink dark", token: "--color-olive-dark", hex: "#091E37" },
  { name: "Ink light", token: "--color-olive-light", hex: "#485C74" },
  { name: "Glass dark", token: "--color-sage-dark", hex: "#7F8F8D" },
  { name: "Glass light", token: "--color-sage-light", hex: "#B7C6C4" },
  { name: "Paper (top)", token: "--color-sage-pale-top", hex: "#F3F3F3" },
  { name: "Soft", token: "--color-sage-pale-deep", hex: "#E1E1E1" },
  { name: "Rose dark", token: "--color-terracotta-dark", hex: "#6E4C46" },
  { name: "Rose light", token: "--color-terracotta-light", hex: "#A78782" },
  { name: "Gold dark", token: "--color-gold-dark", hex: "#9E845B" },
  { name: "Gold light", token: "--color-gold-light", hex: "#D4BC95" },
  { name: "Card", token: "--color-card", hex: "#FFFFFF" },
  { name: "Ink (text)", token: "--color-ink", hex: "#0B2545" },
  { name: "Slate (muted text)", token: "--color-ink-muted", hex: "#4D5E74" },
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
      <h2 className="mb-1 font-heading text-2xl italic text-[var(--color-olive)]">
        {title}
      </h2>
      {description ? (
        <p className="mb-5 max-w-prose font-body text-sm text-[var(--color-ink-muted)]">
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
          className="overflow-hidden rounded-lg ring-1 ring-black/5"
        >
          <div
            className="h-16 w-full"
            style={{ backgroundColor: `var(${swatch.token})` }}
          />
          <div className="bg-[var(--color-card)] px-3 py-2">
            <p className="font-body text-xs font-medium text-[var(--color-ink)]">
              {swatch.name}
            </p>
            <p className="font-body text-[0.6875rem] text-[var(--color-ink-muted)]">
              {swatch.hex}
              {swatch.note ? ` · ${swatch.note}` : ""}
            </p>
            <code className="mt-1 block font-body text-[0.625rem] text-[var(--color-ink-muted)]">
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
      <TopNav />

      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <h1 className="mb-2 font-heading text-4xl font-semibold text-[var(--color-olive)]">
          Style Guide
        </h1>
        <p className="mb-12 max-w-prose font-body text-[var(--color-ink-muted)]">
          Every design token and shared component in isolation. The palette
          matches oliveclinical.com&apos;s own — ink and glass on paper, with
          rose as the single accent and muted gold for fine rules. Headings
          are Cormorant Garamond; body and UI text are DM Sans.
        </p>

        <Section
          title="Brand palette"
          description="The six brand colors. Everything else on this page is built from these."
        >
          <SwatchGrid swatches={BRAND} />
        </Section>

        <Section
          title="Derived shades"
          description="Hover, gradient, divider, and type steps derived from the brand colors."
        >
          <SwatchGrid swatches={SHADES} />
        </Section>

        <Section
          title="Typography"
          description="font-heading is Cormorant Garamond; font-body is DM Sans. There is no font-serif utility."
        >
          <div className="flex flex-col gap-3">
            <p className="font-heading text-4xl font-semibold text-[var(--color-olive)]">
              Heading / Cormorant Garamond 4xl semibold
            </p>
            <p className="font-heading text-2xl italic text-[var(--color-olive)]">
              Section heading / Cormorant Garamond 2xl italic
            </p>
            <p className="font-heading text-lg font-semibold text-[var(--color-ink)]">
              Card title / Cormorant Garamond lg semibold
            </p>
            <p className="font-body text-base text-[var(--color-ink)]">
              Body text / DM Sans base — the quick brown fox jumps over the
              lazy dog.
            </p>
            <p className="font-body text-sm text-[var(--color-ink-muted)]">
              Muted / DM Sans small — metadata like dates and captions.
            </p>
            <p className="font-body text-xs uppercase tracking-[0.18em] text-[var(--color-olive)]">
              Small caps label
            </p>
          </div>
        </Section>

        <Section
          title="Wordmark"
          description="Stands in for a logo asset. tone=light sits on olive; tone=dark sits on ivory."
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-[var(--color-olive)] px-6 py-4">
              <Wordmark />
            </div>
            <div className="rounded-lg bg-[var(--color-ivory)] px-6 py-4 ring-1 ring-black/5">
              <Wordmark tone="dark" />
            </div>
          </div>
        </Section>

        <Section title="Top nav">
          <div className="overflow-hidden rounded-lg ring-1 ring-black/5">
            <TopNav />
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

        <Section title="Hero card">
          <HeroCard
            title="Olive Institute"
            subtext="Self-paced courses you can start whenever you're ready, and work through at your own pace."
          />
        </Section>

        <Section
          title="Course tiles"
          description="Default and muted treatments, with and without a secondary label."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CourseTile
              href="/style-guide"
              title="Foundations of Practice"
              meta="Clinician · 3h 10m"
              secondaryLabel="12 enrolled"
            />
            <CourseTile
              href="/style-guide"
              title="Readings in Ethics"
              meta="Public · 1h 45m"
            />
            <CourseTile
              href="/style-guide"
              title="Archived Seminar"
              meta="Public · 55m"
              secondaryLabel="Archived"
              muted
            />
          </div>
        </Section>

        <Section
          title="Cards"
          description="The base surface. accentColor adds a left rule."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <p className="font-body text-sm text-[var(--color-ink-muted)]">
                The base <code>Card</code> — a white, rounded surface used as
                the building block for every content panel.
              </p>
            </Card>
            <Card accentColor="var(--color-terracotta)">
              <p className="font-body text-sm text-[var(--color-ink-muted)]">
                The same card with a terracotta accent rule, used to draw the
                eye to a single panel.
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
    </div>
  );
}
