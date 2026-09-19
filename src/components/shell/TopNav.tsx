import Link from "next/link";
import { Wordmark } from "./Wordmark";

export type NavLink = { href: string; label: string };

/**
 * The ink nav bar, shared by the app shell and the public storefront.
 * Links are pills that fill on hover; the last one is a gold call to
 * action carrying the same outline-and-offset treatment as every other
 * raised surface (its shadow is paper rather than ink, since it sits on
 * the dark bar).
 */
export function TopNav({
  logoHref = "/dashboard",
  links = [],
  cta,
}: {
  logoHref?: string;
  links?: NavLink[];
  cta?: NavLink;
}) {
  return (
    <header className="w-full bg-[var(--ink)]">
      <div className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3 md:px-10">
        <Link href={logoHref} className="flex items-center">
          <Wordmark />
        </Link>

        {links.length > 0 || cta ? (
          <nav aria-label="Primary">
            <ul className="flex flex-wrap items-center gap-1.5">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block rounded-full px-3.5 py-2 font-body text-sm font-medium text-[var(--paper)]/[0.88] transition-colors hover:bg-[var(--paper)]/10 hover:text-[var(--paper)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {cta ? (
                <li>
                  <Link
                    href={cta.href}
                    className="inline-block rounded-full border-2 border-[var(--ink)] bg-[var(--gold)] px-3.5 py-2 font-body text-sm font-semibold text-[var(--ink)] shadow-[3px_3px_0_var(--paper)] transition-transform hover:-translate-x-px hover:-translate-y-px"
                  >
                    {cta.label}
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
