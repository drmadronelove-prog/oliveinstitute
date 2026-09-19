import { OliveMark } from "@/components/brand/OliveMark";

/**
 * The lockup: the olive mark, a gold hairline, and the name. This is the
 * one place the brand's identity is assembled — nav, footer, the login
 * card and the lesson player header all render it.
 *
 * `tone` picks the type colour for the surface it sits on: "light" for the
 * ink nav bar, "dark" for the paper page ground.
 */
export function Wordmark({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const color =
    tone === "light" ? "text-[var(--paper)]" : "text-[var(--ink)]";

  return (
    <span className={`inline-flex items-center gap-[11px] ${color} ${className}`}>
      <OliveMark className="block h-9 w-9" />
      <span
        aria-hidden="true"
        className="block h-[30px] w-[1.5px] bg-[var(--rule)]"
      />
      <span className="font-heading whitespace-nowrap text-[28px] font-normal leading-none tracking-[-0.02em]">
        Olive Institute
      </span>
    </span>
  );
}
