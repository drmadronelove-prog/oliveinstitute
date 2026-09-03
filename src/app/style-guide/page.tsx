import { TopNav } from "@/components/shell/TopNav";
import { Sidebar } from "@/components/shell/Sidebar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HeroCard } from "@/components/dashboard/HeroCard";

const SWATCHES: Array<{ name: string; token: string }> = [
  { name: "Forest", token: "var(--color-forest)" },
  { name: "Forest Dark", token: "var(--color-forest-dark)" },
  { name: "Sage", token: "var(--color-sage)" },
  { name: "Sage Dark", token: "var(--color-sage-dark)" },
  { name: "Cream", token: "var(--color-cream)" },
  { name: "Cream Warm", token: "var(--color-cream-warm)" },
  { name: "Gold", token: "var(--color-gold)" },
  { name: "Gold Light", token: "var(--color-gold-light)" },
  { name: "Card", token: "var(--color-card)" },
  { name: "Ink", token: "var(--color-ink)" },
  { name: "Ink Muted", token: "var(--color-ink-muted)" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="mb-5 font-heading text-2xl italic text-[var(--color-forest)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav activeHref="__none__" />

      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <h1 className="mb-2 font-heading text-4xl font-semibold text-[var(--color-forest)]">
          Style Guide
        </h1>
        <p className="mb-12 max-w-prose font-serif text-[var(--color-ink-muted)]">
          Every shared component in isolation, matching the Sati Center
          reference dashboard: warm cream backgrounds, forest green and sage
          accents, gold dividers, and serif type throughout.
        </p>

        <Section title="Color palette">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {SWATCHES.map((swatch) => (
              <div key={swatch.name} className="overflow-hidden rounded-lg ring-1 ring-black/5">
                <div
                  className="h-16 w-full"
                  style={{ backgroundColor: swatch.token }}
                />
                <div className="bg-[var(--color-card)] px-3 py-2 font-serif text-xs text-[var(--color-ink)]">
                  {swatch.name}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="flex flex-col gap-3">
            <p className="font-serif text-4xl font-semibold text-[var(--color-ink)]">
              Heading / 4xl semibold
            </p>
            <p className="font-serif text-2xl italic text-[var(--color-forest)]">
              Section heading / 2xl italic
            </p>
            <p className="font-serif text-lg font-semibold text-[var(--color-ink)]">
              Card title / lg semibold
            </p>
            <p className="font-serif text-base text-[var(--color-ink)]">
              Body text / base — the quick brown fox jumps over the lazy dog.
            </p>
            <p className="font-serif text-sm text-[var(--color-ink-muted)]">
              Muted / small — used for metadata like dates and captions.
            </p>
            <p className="font-serif text-xs uppercase tracking-[0.18em] text-[var(--color-forest)]">
              Small caps label
            </p>
          </div>
        </Section>

        <Section title="Quicklink buttons (neumorphic)">
          <div className="max-w-xs">
            <Sidebar />
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex gap-3">
            <Badge>Registration</Badge>
            <Badge>Course Materials</Badge>
            <Badge>Attendance</Badge>
          </div>
        </Section>

        <Section title="Hero card">
          <HeroCard
            title="Sati Certificate Program"
            subtext="A structured path of study and practice for students committed to deepening their understanding of the Buddhist tradition."
          />
        </Section>

        <Section title="Generic card">
          <Card className="max-w-md">
            <p className="font-serif text-sm text-[var(--color-ink-muted)]">
              The base <code>Card</code> component — a white, rounded-corner
              surface used as the building block for course tiles and other
              content panels.
            </p>
          </Card>
        </Section>

        <Section title="Full shell preview">
          <p className="mb-4 font-serif text-sm text-[var(--color-ink-muted)]">
            The top nav and sidebar above are the same components rendered
            on every dashboard page — only the main panel content changes
            per role. See <code>/dashboard</code> for the assembled shell.
          </p>
        </Section>
      </div>
    </div>
  );
}
