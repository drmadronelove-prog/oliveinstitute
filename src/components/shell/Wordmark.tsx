/**
 * Text wordmark. Stands in for a logo asset until real Olive Institute
 * artwork exists — at which point this is the one place to swap it in.
 *
 * `tone` picks the type color for the surface it sits on: "light" for the
 * olive nav bar, "dark" for the ivory page ground.
 */
export function Wordmark({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const color =
    tone === "light" ? "text-[var(--color-ivory)]" : "text-[var(--color-olive)]";

  return (
    <span
      className={`font-heading text-2xl font-semibold tracking-[0.01em] ${color} ${className}`}
    >
      Olive Institute
    </span>
  );
}
