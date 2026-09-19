export type Stat = { label: string; value: string };

/** Four figures across the top of the admin dashboard, each on its own colour. */
const SURFACES = [
  "bg-[var(--glass)] text-[var(--ink)]",
  "bg-[var(--gold)] text-[var(--ink)]",
  "bg-[var(--rose)] text-[var(--ink)]",
  "bg-[var(--ink)] text-[var(--paper)]",
];

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`pop flex flex-col gap-1.5 rounded-[18px] px-5 py-5 ${
            SURFACES[index % SURFACES.length]
          }`}
        >
          <dt
            className={`font-body text-xs font-semibold uppercase tracking-[0.1em] ${
              index === 3 ? "text-[var(--gold)]" : ""
            }`}
          >
            {stat.label}
          </dt>
          <dd className="m-0 font-heading text-[40px] font-medium leading-none tracking-[-0.02em]">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
