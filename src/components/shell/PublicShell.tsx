import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Wordmark } from "./Wordmark";

const NAV_LINKS = [
  { href: "/clinicians", label: "For clinicians" },
  { href: "/explore", label: "Explore" },
];

/**
 * Shell for the logged-out storefront. Unlike `AppShell` it renders no
 * learner sidebar and never requires a session — it only asks for one to
 * decide between "Sign in" and a link back into the app.
 */
export async function PublicShell({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="w-full bg-[var(--color-olive)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:min-h-[66px] md:px-10">
          <Link href="/" className="flex items-center">
            <Wordmark />
          </Link>

          <nav aria-label="Primary">
            <ul className="flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-[var(--color-ivory)]/85 underline-offset-4 transition-colors hover:text-[var(--color-ivory)] hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={session ? "/dashboard" : "/login"}
                  className="rounded-md bg-[var(--color-ivory)]/15 px-3 py-1.5 font-body text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-ivory)]/25"
                >
                  {session ? "My courses" : "Sign in"}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-black/10 bg-[var(--color-sage-pale)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 md:px-10">
          <p className="font-body text-sm text-[var(--color-ink-muted)]">
            © {new Date().getFullYear()} Olive Institute
          </p>
          <ul className="flex gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-body text-sm text-[var(--color-ink-muted)] underline underline-offset-2"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}
