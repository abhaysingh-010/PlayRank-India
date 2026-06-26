import Link from "next/link";
import DataSourceBadge from "@/components/DataSourceBadge";

const principles = [
  {
    label: "Source Layer",
    title: "Verified Data Foundation",
    description:
      "PlayRank is built around structured esports data: teams, players, matches, tournaments, rankings, official source rows and historical snapshots.",
  },
  {
    label: "Analysis Layer",
    title: "Competitive Intelligence",
    description:
      "We convert performance data into rank movement, player impact, team strength, match reads and comparison signals.",
  },
  {
    label: "Trust Layer",
    title: "Source Before Insight",
    description:
      "PlayRank separates official source data, verified records, staged imports and PlayRank-generated analytics so users understand what each claim is based on.",
  },
];

const modules = [
  "Rankings Intelligence",
  "Team Intelligence",
  "Player Intelligence",
  "Match Intelligence",
  "Tournament Intelligence",
  "Compare Intelligence",
];

const trustRules = [
  {
    label: "Independent",
    title: "Not an official Krafton platform",
    description:
      "PlayRank is independent. It is not affiliated with, endorsed by, or operated by Krafton, PUBG, BGMI, or tournament organizers.",
  },
  {
    label: "Attributed",
    title: "Official source data is credited",
    description:
      "When PlayRank uses official or external source data, it should be clearly labeled and credited wherever possible.",
  },
  {
    label: "Calculated",
    title: "Analytics are PlayRank-generated",
    description:
      "Rank reads, edge scores, confidence labels and comparison signals are independently calculated from available data.",
  },
  {
    label: "No Predictions",
    title: "Intelligence, not betting or guarantees",
    description:
      "PlayRank analytics explain current competitive context. They are not betting tips, outcome guarantees or official predictions.",
  },
];

function TrustRuleCard({
  item,
  index,
}: {
  item: {
    label: string;
    title: string;
    description: string;
  };
  index: number;
}) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffd21a]">
          {item.label}
        </p>
        <span className="text-sm font-black text-white/25">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h3 className="mt-6 text-2xl font-black uppercase leading-tight tracking-[-0.04em] text-white">
        {item.title}
      </h3>

      <p className="mt-4 text-sm leading-7 text-white/50">
        {item.description}
      </p>
    </article>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="krafton-grid relative min-h-[calc(100vh-82px)] overflow-hidden">
        <div className="blueprint-lines" />
        <div className="absolute left-[46%] top-[20%] hidden h-[430px] w-[430px] border border-white/20 opacity-25 lg:block" />
        <div className="absolute left-[49%] top-[34%] hidden h-[280px] w-[520px] -skew-x-12 border border-white/20 opacity-25 lg:block" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-82px)] max-w-[1600px] flex-col justify-center px-7 py-20 md:px-14">
          <div className="flex flex-wrap gap-2">
            <DataSourceBadge label="Independent Platform" size="md" />
            <DataSourceBadge label="Esports Intelligence" size="md" />
            <DataSourceBadge label="No Predictions" size="md" />
          </div>

          <p className="krafton-label mt-6">About PlayRank</p>

          <h1 className="krafton-display mt-6 max-w-[1500px] text-[17vw] md:text-[11vw] xl:text-[10rem]">
            INDIA&apos;S
            <br />
            ESPORTS
            <br />
            INTELLIGENCE
            <br />
            LAYER
          </h1>

          <p className="mt-8 max-w-4xl text-base font-black uppercase leading-6 tracking-[-0.03em] text-white md:text-xl">
            PlayRank exists to organize India&apos;s competitive esports
            ecosystem into a serious intelligence layer: ranking teams,
            profiling players, reading matches and comparing competitive edge.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/rankings" className="btn-primary px-6 py-3 text-sm">
              View Rankings
            </Link>
            <Link href="/compare" className="btn-secondary px-6 py-3 text-sm">
              Compare Intelligence
            </Link>
            <Link href="/data" className="btn-secondary px-6 py-3 text-sm">
              Data Trust
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-red-400/20 bg-red-400/[0.06] px-7 py-10 md:px-14">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-wrap gap-2">
            <DataSourceBadge label="Independent Platform" size="md" />
            <DataSourceBadge label="Source Attribution" size="md" />
          </div>

          <h2 className="mt-5 text-3xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            Independent Esports Intelligence Platform
          </h2>

          <p className="mt-4 max-w-5xl text-sm leading-7 text-white/60 md:text-base">
            PlayRank is an independent esports intelligence platform. It is not
            affiliated with, endorsed by, or operated by Krafton, PUBG, BGMI, or
            tournament organizers. Official source data is credited where
            available. PlayRank analytics, rankings, edge scores and confidence
            labels are independently calculated from available source, roster,
            match and ranking data.
          </p>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#050505] px-7 py-24 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-12 xl:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="krafton-label">Mission</p>
            <h2 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
              Build The
              <br />
              Competitive
              <br />
              Source Of Truth
            </h2>
          </div>

          <div className="max-w-5xl">
            <p className="text-2xl font-black uppercase leading-8 tracking-[-0.04em] text-white md:text-4xl md:leading-[1.05]">
              Indian esports has talent, tournaments, teams and stories, but the
              data is scattered. PlayRank brings that ecosystem into one
              connected product system.
            </p>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-white/50">
              The goal is not to guess outcomes. The goal is to make performance
              easier to understand: who is rising, which teams are consistent,
              who performs under pressure, and how competitive strength changes
              over time.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-24 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="krafton-label">Operating System</p>
            <DataSourceBadge label="Source Layer" />
            <DataSourceBadge label="Analytics Layer" />
            <DataSourceBadge label="Trust Layer" />
          </div>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            How PlayRank Works
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {principles.map((item, index) => (
            <div key={item.title} className="krafton-card min-h-[330px] p-7">
              <div className="flex items-start justify-between">
                <p className="text-sm font-black uppercase tracking-[0.28em] text-[#ff4038]">
                  {item.label}
                </p>
                <span className="text-sm font-black text-white/30">
                  0{index + 1}
                </span>
              </div>

              <h3 className="mt-9 text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] text-white">
                {item.title}
              </h3>

              <p className="mt-6 leading-7 text-white/50">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#050505] px-7 py-24 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-12 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="krafton-label">Product Modules</p>
            <h2 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
              One Layer.
              <br />
              Multiple
              <br />
              Signals.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {modules.map((module, index) => (
              <div
                key={module}
                className="border border-white/10 bg-[#111] p-6 transition hover:border-[#ff4038]"
              >
                <p className="text-sm font-black text-white/30">
                  0{index + 1}
                </p>
                <p className="mt-8 text-2xl font-black uppercase tracking-[-0.04em] text-white">
                  {module}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-7 py-24 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="krafton-label">Trust Rules</p>
            <DataSourceBadge label="No Overclaiming" />
            <DataSourceBadge label="Clear Attribution" />
          </div>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white md:text-5xl">
            What PlayRank Is And Is Not
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustRules.map((item, index) => (
            <TrustRuleCard key={item.title} item={item} index={index} />
          ))}
        </div>
      </section>

      <section className="krafton-grid relative overflow-hidden px-7 py-24 text-center md:px-14">
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="krafton-label">PlayRank</p>

          <h2 className="krafton-title mt-4 text-6xl text-white md:text-8xl">
            Built For
            <br />
            Competitive Clarity
          </h2>

          <p className="mx-auto mt-6 max-w-2xl leading-7 text-white/50">
            A serious esports platform for ranking, analysis, comparison and
            competitive context across India&apos;s BGMI ecosystem.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/teams" className="btn-primary px-6 py-3 text-sm">
              Explore Teams
            </Link>
            <Link href="/players" className="btn-secondary px-6 py-3 text-sm">
              Explore Players
            </Link>
            <Link href="/data" className="btn-secondary px-6 py-3 text-sm">
              Review Data Trust
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}