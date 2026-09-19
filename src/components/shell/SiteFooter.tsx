import Link from "next/link";
import { Wordmark } from "./Wordmark";
import type { NavLink } from "./TopNav";

/** The ink footer: the lockup on one side, the same links as the nav on the other. */
export function SiteFooter({ links }: { links: NavLink[] }) {
  return (
    <footer className="mt-auto border-t-2 border-[var(--ink)] bg-[var(--ink)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-9 md:px-10">
        <Link href="/" className="flex items-center">
          <Wordmark />
        </Link>
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 font-body text-sm text-[var(--on-ink)]">
          <li>© {new Date().getFullYear()} Olive Institute</li>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:text-[var(--paper)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
