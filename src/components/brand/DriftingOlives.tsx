import type { CSSProperties } from "react";

/**
 * The loose olives that drift across the hero and the dashboard band.
 *
 * Purely decorative — the whole cluster is `aria-hidden`, carries no text,
 * and stops moving entirely under `prefers-reduced-motion` (handled in
 * globals.css, alongside the keyframes). Each olive is the same shape as
 * the brand mark: a filled circle with an outlined highlight punched out
 * of it, drawn here in CSS rather than SVG so the outline and hard shadow
 * match every other raised surface on the page.
 */

type Olive = {
  /** Which of the five drift loops in globals.css this one follows. */
  float: 1 | 2 | 3 | 4 | 5;
  className: string;
  style: CSSProperties;
};

/** Sized in percentages so the cluster scales with its square container. */
const HERO_OLIVES: Olive[] = [
  {
    float: 1,
    className: "bg-[var(--plum)]",
    style: { width: "52%", height: "52%", left: "8%", top: "10%" },
  },
  {
    float: 2,
    className: "bg-[var(--gold)]",
    style: { width: "40%", height: "40%", right: "4%", top: "30%" },
  },
  {
    float: 3,
    className: "bg-[var(--glass)]",
    style: { width: "26%", height: "26%", left: "22%", bottom: "6%" },
  },
  {
    float: 4,
    className: "bg-[var(--rose)]",
    style: { width: "16%", height: "16%", right: "18%", top: "4%" },
  },
  {
    float: 5,
    className: "bg-[var(--dusk)]",
    style: { width: "12%", height: "12%", right: "10%", bottom: "14%" },
  },
];

/** The band's panel is a fixed height, so these are fixed pixel sizes. */
function bandOlives(tone: "plum" | "gold"): Olive[] {
  return [
    {
      float: 1,
      className: tone === "gold" ? "bg-[var(--plum)]" : "bg-[var(--gold)]",
      style: { width: 120, height: 120, left: 20, top: 30 },
    },
    {
      float: 2,
      className: "bg-[var(--glass)]",
      style: { width: 78, height: 78, right: 30, top: 6 },
    },
    {
      float: 3,
      className: "bg-[var(--rose)]",
      style: { width: 58, height: 58, right: 60, bottom: 6 },
    },
    {
      float: 4,
      className: tone === "gold" ? "bg-[var(--dusk)]" : "bg-[var(--paper)]",
      style: { width: 34, height: 34, left: 150, bottom: 10 },
    },
  ];
}

function Olive({
  olive,
  mini,
}: {
  olive: Olive;
  /** The band's olives travel a shorter loop at a quicker tempo. */
  mini: boolean;
}) {
  return (
    <span
      className={`olive-float olive-float-${olive.float} ${
        mini ? "olive-float-mini" : ""
      } absolute rounded-full border-2 border-[var(--ink)] ${olive.className}`}
      style={{
        ...olive.style,
        boxShadow: mini ? "var(--pop)" : "var(--pop-lg)",
      }}
    >
      {/* The highlight: the same bite the brand mark takes out of itself. */}
      <span className="absolute left-[53%] top-[17%] h-[30%] w-[30%] rounded-full border-2 border-[var(--ink)] bg-[var(--paper)]" />
    </span>
  );
}

export function DriftingOlives({
  variant,
  tone = "plum",
  className = "",
}: {
  variant: "hero" | "band";
  /** Which band the cluster sits in, so two of its olives can change colour. */
  tone?: "plum" | "gold";
  className?: string;
}) {
  const olives = variant === "hero" ? HERO_OLIVES : bandOlives(tone);

  return (
    <div
      aria-hidden="true"
      className={
        variant === "hero"
          ? `relative mx-auto aspect-square w-full max-w-[210px] sm:max-w-[240px] lg:max-w-[400px] ${className}`
          : `relative h-[190px] ${className}`
      }
    >
      {olives.map((olive) => (
        <Olive key={olive.float} olive={olive} mini={variant === "band"} />
      ))}
    </div>
  );
}
