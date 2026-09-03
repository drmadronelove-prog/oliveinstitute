import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function TopNav({ logoHref = "/dashboard" }: { logoHref?: string }) {
  return (
    <header className="w-full bg-[var(--color-olive)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-10 py-4 md:min-h-[66px]">
        <Link href={logoHref} className="flex items-center">
          <Wordmark />
        </Link>
      </div>
    </header>
  );
}
