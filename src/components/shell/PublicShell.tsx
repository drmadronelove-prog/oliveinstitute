import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { TopNav, type NavLink } from "./TopNav";
import { SiteFooter } from "./SiteFooter";

const NAV_LINKS: NavLink[] = [
  { href: "/clinicians", label: "For clinicians" },
  { href: "/explore", label: "Explore" },
];

const FOOTER_LINKS: NavLink[] = [
  ...NAV_LINKS,
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
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
      <TopNav
        logoHref="/"
        links={NAV_LINKS}
        cta={
          session
            ? { href: "/dashboard", label: "My courses" }
            : { href: "/login", label: "Sign in" }
        }
      />

      <main className="flex-1">{children}</main>

      <SiteFooter links={FOOTER_LINKS} />
    </div>
  );
}
