import Link from "next/link";
import { Logo } from "./Logo";

export function TopNav({ logoHref = "/dashboard" }: { logoHref?: string }) {
  return (
    <header className="w-full bg-[var(--color-forest)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-10 py-4 md:min-h-[66px]">
        <Link href={logoHref} className="flex items-center gap-3">
          <Logo />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-xl font-semibold text-[var(--color-cream)]">
              Olive Institute
            </span>
            <span className="font-heading text-xs italic text-[var(--color-cream)]/[0.66]">
              self-paced courses
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
