import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedCourses } from "@/lib/catalog";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { PublicShell } from "@/components/shell/PublicShell";
import { DriftingOlives } from "@/components/brand/DriftingOlives";
import { CourseTicker } from "@/components/storefront/CourseTicker";

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

const HERO_FACTS = [
  "Neurodivergent-centered",
  "Faculty with lived experience",
  "No cohort schedule",
] as const;

/**
 * The five areas every course draws from. Editorial copy, not a query:
 * these are the subjects the Institute teaches, which is a slower-moving
 * thing than the list of courses currently on sale (that is the ticker's
 * job, and the two catalogue pages').
 */
const TOPIC_AREAS = [
  {
    title: "Everyday life",
    body: "The practical side: getting things done, managing energy, and making days work.",
    topics: [
      "Executive functioning",
      "Emotion regulation",
      "Sensory processing",
      "Burnout and recovery",
      "Demand avoidance",
      "Work and school",
    ],
    surface: "bg-[var(--gold)] text-[var(--ink)]",
    body_color: "text-[var(--ink)]",
    olive: "bg-[var(--plum)]",
    span: "md:col-span-3",
  },
  {
    title: "People and identity",
    body: "Who we are with others, and who we are when we stop masking.",
    topics: [
      "Relationships",
      "Families and parenting",
      "Gender and sexuality",
      "Masking and unmasking",
      "Community and belonging",
      "Justice sensitivity",
    ],
    surface: "bg-[var(--rose)] text-[var(--ink)]",
    body_color: "text-[var(--ink)]",
    olive: "bg-[var(--glass)]",
    span: "md:col-span-3",
  },
  {
    title: "How minds differ",
    body: "The conditions themselves, explained from the inside and without the deficit framing.",
    topics: ["ADHD", "Autism", "AuDHD", "OCD", "Late diagnosis"],
    surface: "bg-[var(--glass)] text-[var(--ink)]",
    body_color: "text-[var(--ink)]",
    olive: "bg-[var(--gold)]",
    span: "md:col-span-2",
  },
  {
    title: "Mind and body",
    body: "Settling the nervous system and working with what the body carries.",
    topics: [
      "Anxiety",
      "Trauma",
      "Nervous system regulation",
      "Mindfulness practices",
    ],
    surface: "bg-[var(--plum)] text-[var(--paper)]",
    body_color: "text-[var(--on-plum)]",
    olive: "bg-[var(--rose)]",
    span: "md:col-span-2",
  },
  {
    title: "For clinicians",
    body: "Training for practitioners who want their work to be neuro-affirming.",
    topics: [
      "Neuro-affirming practice",
      "Assessment",
      "Case formulation",
      "Trauma-informed care",
    ],
    surface: "bg-[var(--ink)] text-[var(--paper)]",
    body_color: "text-[var(--on-ink)]",
    olive: "bg-[var(--gold)]",
    span: "md:col-span-2",
  },
] as const;

const PATHS = [
  {
    href: "/clinicians",
    tag: "For clinicians",
    title: "Clinical training",
    body: "Structured, evidence-led courses for practitioners who want depth without a cohort schedule. Work through them between sessions, at whatever pace the week allows.",
    cta: "Browse clinician courses",
    surface: "bg-[var(--plum)] text-[var(--paper)]",
    tagColor: "text-[var(--eyebrow-on-plum)]",
    bodyColor: "text-[var(--on-plum)]",
    arrow: "bg-[var(--gold)] text-[var(--ink)]",
    olive: "bg-[var(--gold)]",
  },
  {
    href: "/explore",
    tag: "For neurodivergent individuals",
    title: "Understand your own mind",
    body: "Practical courses on how your brain works and what helps, written by people who share the experience. No clinical background assumed.",
    cta: "Explore courses",
    surface: "bg-[var(--glass)] text-[var(--ink)]",
    tagColor: "text-[var(--ink)]",
    bodyColor: "text-[var(--ink)]",
    arrow: "bg-[var(--ink)] text-[var(--paper)]",
    olive: "bg-[var(--paper)]",
  },
  {
    href: "/explore",
    tag: "For neurodivergent allies",
    title: "Support someone you love",
    body: "For partners, parents, friends, teachers and colleagues who want to understand and show up well.",
    cta: "Explore courses",
    surface: "bg-[var(--gold)] text-[var(--ink)]",
    tagColor: "text-[var(--ink)]",
    bodyColor: "text-[var(--ink)]",
    arrow: "bg-[var(--ink)] text-[var(--paper)]",
    olive: "bg-[var(--plum)]",
  },
] as const;

const STEPS = [
  {
    n: "01",
    title: "Try it free",
    body: "Most courses open with a free preview lesson. See if it clicks before you buy.",
  },
  {
    n: "02",
    title: "Go lesson by lesson",
    body: "Short lessons you mark done as you go, so your progress is always visible.",
  },
  {
    n: "03",
    title: "Choose your scope",
    body: "Take individual courses on the topics you need, or work through a full certificate.",
  },
] as const;

/** The outlined circle that sits half off the corner of a coloured card. */
function CornerOlive({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute -right-7 -top-7 h-[100px] w-[100px] rounded-full border-2 border-[var(--ink)] ${className}`}
    >
      <span className="absolute left-[53%] top-[17%] h-[30%] w-[30%] rounded-full border-2 border-[var(--ink)] bg-[var(--paper)]" />
    </span>
  );
}

export default async function HomePage() {
  const courses = await listPublishedCourses();

  return (
    <PublicShell>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="dot-grid overflow-hidden border-b-2 border-[var(--ink)]">
        <div className="mx-auto grid max-w-7xl items-center gap-3 px-6 pb-14 pt-12 md:px-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-8">
          <div>
            <span className="font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--plum)]">
              Self-paced courses
            </span>
            <h1 className="mt-4 font-heading text-[clamp(2.9rem,6.6vw,5.75rem)] font-medium leading-[0.98] text-[var(--ink)]">
              Start today. Finish at{" "}
              <em className="italic font-normal text-[var(--plum)]">
                your
              </em>{" "}
              pace.
            </h1>
            <p className="mt-7 max-w-[34rem] font-body text-[clamp(18px,1.9vw,20px)] leading-[1.55] text-[var(--ink)]">
              Courses for clinicians, neurodivergent individuals and
              neurodivergent allies. Start whenever you like, stop whenever you
              need to.
            </p>
            <div className="mt-9 flex flex-wrap gap-3.5">
              <Link
                href="/clinicians"
                className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-[var(--ink)] bg-[var(--gold)] px-5 py-3 font-body text-[15px] font-semibold leading-none text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] transition-[transform,box-shadow] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              >
                Browse clinician courses{" "}
                <span aria-hidden="true" className="text-sm">
                  →
                </span>
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-[var(--ink)] bg-[var(--paper)] px-5 py-3 font-body text-[15px] font-semibold leading-none text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] transition-[transform,box-shadow,background-color] hover:-translate-x-px hover:-translate-y-px hover:bg-white hover:shadow-[4px_4px_0_var(--ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              >
                Explore courses
              </Link>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5 font-body text-sm text-[var(--muted)]">
              {HERO_FACTS.map((fact) => (
                <li key={fact} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-[var(--plum)]"
                  />
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <DriftingOlives variant="hero" />
        </div>
      </section>

      <CourseTicker courses={courses} />

      {/* ── Ethos ────────────────────────────────────────────────────── */}
      <section
        aria-label="Who we are for"
        className="border-b-2 border-[var(--ink)] py-20"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="grid gap-[22px] lg:grid-cols-[1.1fr_1fr]">
            <article className="pop-lg relative flex flex-col gap-3.5 overflow-hidden rounded-3xl bg-[var(--plum)] px-8 pb-9 pt-9 text-[var(--paper)] md:px-10">
              <CornerOlive className="bg-[var(--rose)]" />
              <span className="relative z-[1] pr-16 font-body text-xs font-semibold uppercase tracking-[0.14em] text-[var(--eyebrow-on-plum)]">
                Who we build for
              </span>
              <h2 className="relative z-[1] max-w-[16ch] pr-16 font-heading text-[clamp(30px,3.4vw,44px)] font-medium leading-[1.02] tracking-[-0.03em]">
                We center <em className="italic text-[var(--gold-on-plum)]">neurodivergent</em>{" "}
                learners.
              </h2>
              <p className="relative z-[1] max-w-[32rem] font-body text-[17px] leading-[1.55] text-[var(--on-plum)]">
                Every course is designed around how neurodivergent people
                actually learn, not adapted after the fact.
              </p>
              <ul className="relative z-[1] mt-auto grid gap-2.5 pt-2">
                {[
                  "Short lessons and progress you can see",
                  "No deadlines, no cohort schedule",
                  "Free previews, so you can check the fit first",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 font-body text-[15px] font-medium"
                  >
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 rounded-full border-[1.5px] border-[var(--paper)] bg-[var(--gold)] shadow-[2px_2px_0_var(--ink)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="pop-lg relative flex flex-col gap-3.5 overflow-hidden rounded-3xl bg-[var(--gold)] px-8 pb-9 pt-9 text-[var(--ink)] md:px-10">
              <CornerOlive className="bg-[var(--glass)]" />
              <span className="relative z-[1] pr-16 font-body text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
                Who teaches
              </span>
              <h2 className="relative z-[1] max-w-[16ch] pr-16 font-heading text-[clamp(30px,3.4vw,44px)] font-medium leading-[1.02] tracking-[-0.03em]">
                All of our faculty have{" "}
                <em className="italic text-[var(--plum-on-gold)]">lived experience.</em>
              </h2>
              <p className="relative z-[1] mt-auto max-w-[28rem] font-body text-[17px] leading-[1.55]">
                The people teaching these courses know the material from the
                inside as well as from the literature.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Topics board ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="topics-heading"
        className="border-b-2 border-[var(--ink)] bg-[var(--linen)] py-20"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="font-body text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--plum)]">
                What we cover
              </span>
              <h2
                id="topics-heading"
                className="mt-2.5 font-heading text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.02] tracking-[-0.03em]"
              >
                Topics across the Institute
              </h2>
            </div>
            <p className="m-0 max-w-[26rem] font-body text-[var(--muted)]">
              Courses for clinicians, neurodivergent individuals and allies draw
              from the same five areas.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-6">
            {TOPIC_AREAS.map((area) => (
              <article
                key={area.title}
                className={`pop-lg pop-hover relative flex flex-col gap-2.5 overflow-hidden rounded-[22px] px-7 pb-6 pt-7 ${area.surface} ${area.span}`}
              >
                <CornerOlive className={area.olive} />
                <h3 className="relative z-[1] m-0 font-heading text-[clamp(24px,2.1vw,29px)] font-medium leading-[1.05] tracking-[-0.02em]">
                  {area.title}
                </h3>
                <p
                  className={`relative z-[1] m-0 max-w-[30rem] pr-12 font-body text-[15px] leading-[1.5] ${area.body_color}`}
                >
                  {area.body}
                </p>
                <ul className="relative z-[1] m-0 flex list-none flex-wrap gap-2 p-0 pt-3.5">
                  {area.topics.map((topic) => (
                    <li
                      key={topic}
                      className="rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 font-body text-sm font-medium text-[var(--ink)]"
                    >
                      {topic}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Paths and steps ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mb-8 mt-20 flex flex-wrap items-end justify-between gap-4">
          <h2 className="m-0 font-heading text-[clamp(2.1rem,4.4vw,3.25rem)] font-medium leading-none">
            Pick your path
          </h2>
          <p className="m-0 max-w-[26rem] font-body text-[var(--muted)]">
            Three audiences. Same unhurried pace.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PATHS.map((path) => (
            <Link
              key={path.title}
              href={path.href}
              className={`pop-lg pop-hover group relative flex min-h-[330px] flex-col gap-3.5 overflow-hidden rounded-3xl p-[34px] ${path.surface}`}
            >
              <span
                aria-hidden="true"
                className={`absolute -bottom-11 -right-11 z-0 h-[120px] w-[120px] rounded-full opacity-[0.35] ${path.olive}`}
              />
              <span
                className={`relative z-[1] font-body text-xs font-semibold uppercase tracking-[0.14em] ${path.tagColor}`}
              >
                {path.tag}
              </span>
              <h3 className="relative z-[1] m-0 max-w-[14ch] font-heading text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.02] md:min-h-[2.04em]">
                {path.title}
              </h3>
              <p
                className={`relative z-[1] m-0 max-w-[30rem] font-body text-[17px] leading-[1.55] ${path.bodyColor}`}
              >
                {path.body}
              </p>
              <span className="relative z-[1] mt-auto flex items-center gap-3 font-body text-base font-semibold">
                <span
                  aria-hidden="true"
                  className={`grid h-11 w-11 place-items-center rounded-full border-2 border-[var(--ink)] text-lg transition-transform group-hover:translate-x-1 ${path.arrow}`}
                >
                  →
                </span>
                {path.cta}
              </span>
            </Link>
          ))}
        </div>

        <div className="mb-8 mt-20 flex flex-wrap items-end justify-between gap-4">
          <h2 className="m-0 font-heading text-[clamp(2.1rem,4.4vw,3.25rem)] font-medium leading-none">
            How it works
          </h2>
          <p className="m-0 max-w-[26rem] font-body text-[var(--muted)]">
            Three steps, no deadlines.
          </p>
        </div>

        <div className="mb-20 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="pop flex flex-col gap-2.5 rounded-[20px] bg-white p-7"
            >
              <span className="font-mono text-sm font-medium text-[var(--plum)]">
                {step.n}
              </span>
              <h3 className="m-0 font-heading text-[26px] font-medium leading-[1.1] tracking-[-0.02em]">
                {step.title}
              </h3>
              <p className="m-0 font-body leading-[1.55] text-[var(--muted)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
