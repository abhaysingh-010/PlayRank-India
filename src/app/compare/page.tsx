import Link from "next/link";

const surface =
  "relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#080a0f]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl";

const panel =
  "rounded-[1.35rem] border border-white/[0.10] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/50">
      {children}
    </span>
  );
}

function CompareCard({
  href,
  label,
  title,
  description,
  accent,
  icon,
  metrics,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
  accent: "emerald" | "blue";
  icon: string;
  metrics: string[];
}) {
  const glow =
    accent === "emerald"
      ? "from-emerald-400/[0.16] via-emerald-400/[0.06] to-transparent"
      : "from-blue-400/[0.16] via-blue-400/[0.06] to-transparent";

  const text = accent === "emerald" ? "text-emerald-300" : "text-blue-300";
  const border =
    accent === "emerald" ? "hover:border-emerald-300/30" : "hover:border-blue-300/30";

  return (
    <Link
      href={href}
      className={`${surface} ${border} group block p-6 transition duration-300 hover:-translate-y-1`}
    >
      <div
        className={`pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br ${glow} blur-3xl transition group-hover:opacity-100`}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.3em] ${text}`}>
              {label}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
              {title}
            </h2>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {icon}
          </div>
        </div>

        <p className="mt-4 max-w-xl text-sm leading-6 text-white/48">
          {description}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {metrics.map((metric) => (
            <FeaturePill key={metric}>{metric}</FeaturePill>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
          <p className="text-sm font-semibold text-white/45">
            Open analyzer
          </p>

          <div
            className={`rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black ${text} transition group-hover:bg-white/[0.07]`}
          >
            Compare →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ComparePage() {
  return (
    <main className="page-shell relative space-y-6 py-6 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.07),transparent_30%)]" />

      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.10] bg-[#080a0f] px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:px-8 md:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.10),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-[-0.06em] text-white md:text-7xl">
              Compare Center
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-3 md:min-w-[360px]">
            <div className={panel + " p-4"}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                Modes
              </p>
              <p className="mt-2 text-3xl font-black text-white">2</p>
            </div>

            <div className={panel + " p-4"}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                Radar
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-300">ON</p>
            </div>

            <div className={panel + " p-4"}>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                Edge
              </p>
              <p className="mt-2 text-3xl font-black text-white">AI</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <CompareCard
          href="/teams/compare"
          label=""
          title="Team Battle Analyzer"
          description="Compare team-level firepower, WWCD output, ranking score, placement efficiency, recent momentum and head-to-head history."
          accent="emerald"
          icon="⚔️"
          metrics={[
            "Ranking Score",
            "WWCD",
            "Kills",
            "Momentum",
            "H2H",
            "Radar Matrix",
          ]}
        />

        <CompareCard
          href="/players/compare"
          label=""
          title="Player Duel Analyzer"
          description="Compare player fragging, damage output, entry pressure, clutch impact, support value, current form and role-based edge."
          accent="blue"
          icon="🎯"
          metrics={[
            "Kills",
            "Damage",
            "Knocks",
            "MVP",
            "Role Duel",
            "Radar Matrix",
          ]}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
        <div className={panel + " p-5"}>
          <h3 className="mt-3 text-2xl font-black text-white">
            Clear winner signal
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Every duel produces an overall edge based on weighted PlayRank
            performance signals.
          </p>
        </div>

        <div className={panel + " p-5"}>
          <h3 className="mt-3 text-2xl font-black text-white">
            Radar-based view
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Compare multiple performance vectors visually instead of reading
            only raw tables.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[1.35rem] border border-emerald-300/25 bg-gradient-to-br from-emerald-400/[0.16] via-emerald-400/[0.07] to-white/[0.03] p-5 shadow-[0_0_45px_rgba(16,185,129,0.16),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="relative z-10">
            <h3 className="mt-3 text-2xl font-black text-white">
              Start with teams
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Team comparison has the strongest official ranking coverage right
              now.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}