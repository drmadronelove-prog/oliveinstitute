import Link from "next/link";
import type { ReactNode } from "react";

export type BentoTile = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
};

/**
 * The admin tool tiles. Four surfaces, the first one double-height and the
 * last one double-width, each with a brand olive rolling off its top-right
 * corner — the tiles do the work the two inert placeholder squares used to
 * (see CLAUDE.md, phase 9).
 */
const TILES = [
  {
    surface: "bg-[var(--plum)] text-[var(--paper)]",
    description: "text-[var(--on-plum)]",
    arrow: "text-[var(--gold-on-plum)]",
    icon: "bg-[var(--paper)]/[0.14]",
    olive: "bg-[var(--gold)]",
    span: "md:row-span-2",
    oliveSize: "h-[150px] w-[150px]",
  },
  {
    surface: "bg-[var(--glass)] text-[var(--ink)]",
    description: "text-[var(--ink)]",
    arrow: "text-[var(--ink)]",
    icon: "bg-white/35",
    olive: "bg-[var(--paper)]",
    span: "",
    oliveSize: "h-[110px] w-[110px]",
  },
  {
    surface: "bg-[var(--gold)] text-[var(--ink)]",
    description: "text-[var(--ink)]",
    arrow: "text-[var(--ink)]",
    icon: "bg-white/35",
    olive: "bg-[var(--plum)]",
    span: "",
    oliveSize: "h-[110px] w-[110px]",
  },
  {
    surface: "bg-[var(--rose)] text-[var(--ink)]",
    description: "text-[var(--ink)]",
    arrow: "text-[var(--ink)]",
    icon: "bg-white/35",
    olive: "bg-[var(--glass)]",
    span: "md:col-span-2",
    oliveSize: "h-[110px] w-[110px]",
  },
] as const;

export function BentoTiles({ tiles }: { tiles: BentoTile[] }) {
  return (
    <div className="mt-5 grid gap-[18px] md:grid-cols-3">
      {tiles.map((tile, index) => {
        const style = TILES[index % TILES.length];
        return (
          <Link
            key={tile.href}
            href={tile.href}
            className={`pop-lg pop-hover group relative flex min-h-[170px] flex-col justify-between gap-6 overflow-hidden rounded-[20px] p-7 ${style.surface} ${style.span}`}
          >
            <span
              aria-hidden="true"
              className={`absolute -right-7 -top-7 rounded-full border-2 border-[var(--ink)] transition-transform duration-300 group-hover:-translate-x-1 group-hover:translate-y-1 group-hover:-rotate-[18deg] ${style.olive} ${style.oliveSize}`}
            >
              <span className="absolute left-[53%] top-[17%] h-[30%] w-[30%] rounded-full border-2 border-[var(--ink)] bg-[var(--paper)]" />
            </span>
            <span
              className={`relative z-[1] grid h-11 w-11 place-items-center rounded-xl border-[1.5px] border-current ${style.icon}`}
            >
              {tile.icon}
            </span>
            <span className="relative z-[1] flex items-end justify-between gap-3">
              <span>
                <span className="block font-heading text-[clamp(24px,2.4vw,32px)] font-medium leading-[1.05] tracking-[-0.02em]">
                  {tile.title}
                </span>
                <span
                  className={`mt-2.5 block max-w-[24rem] font-body text-[15px] leading-[1.45] ${style.description}`}
                >
                  {tile.description}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`text-[22px] transition-transform group-hover:translate-x-1 ${style.arrow}`}
              >
                →
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-[22px] w-[22px]",
  "aria-hidden": true,
};

export const TileIcons = {
  courses: (
    <svg {...ICON_PROPS}>
      <path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z" />
      <path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
    </svg>
  ),
  users: (
    <svg {...ICON_PROPS}>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M16 4a4 4 0 0 1 0 8" />
      <path d="M22 21a7 7 0 0 0-4-6.3" />
    </svg>
  ),
  enrollment: (
    <svg {...ICON_PROPS}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  finances: (
    <svg {...ICON_PROPS}>
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};
