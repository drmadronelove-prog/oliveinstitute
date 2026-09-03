import Link from "next/link";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { label: "Course Registration", href: "/registration" },
  { label: "Calendar", href: "/calendar" },
  { label: "Class Schedule", href: "/schedule" },
];

export function TopNav({
  activeHref = "/dashboard",
  logoHref = "/dashboard",
}: {
  activeHref?: string;
  logoHref?: string;
}) {
  return (
    <header className="w-full bg-[var(--color-forest)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-10 py-4 md:min-h-[66px]">
        <Link href={logoHref} className="flex items-center gap-3">
          <Logo />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-xl font-semibold text-[var(--color-cream)]">
              Sati Center
            </span>
            <span className="font-heading text-xs italic text-[var(--color-cream)]/[0.66]">
              for Buddhist Studies
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-[30px]">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === activeHref;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`font-serif text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-cream)]/[0.82] pb-1 border-b transition-colors ${
                      isActive
                        ? "border-[var(--color-gold-light)]"
                        : "border-transparent hover:border-[var(--color-cream)]/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
