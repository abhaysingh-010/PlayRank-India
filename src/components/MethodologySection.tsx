import DataSourceBadge from "@/components/DataSourceBadge";

const card =
  "rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";

const softCard =
  "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

type MethodTone = "official" | "verified" | "analytics" | "staged" | "warning";

type MethodItem = {
  title: string;
  badge: string;
  description: string;
  points: string[];
  tone: MethodTone;
};

const methodologyItems: MethodItem[] = [
  {
    title: "Official Data",
    badge: "Official Source",
    tone: "official",
    description:
      "Official data means rankings, source rows or tournament records imported from recognized source systems where available.",
    points: [
      "Used as the highest-trust source layer.",
      "Stored separately before being mapped into PlayRank entities.",
      "Shown with official or source badges wherever available.",
    ],
  },
  {
    title: "Verified Records",
    badge: "Verified Data",
    tone: "verified",
    description:
      "Verified records are PlayRank-normalized teams or players that have been matched against trusted source data, aliases, IDs or manual validation.",
    points: [
      "Used for team and player profile confidence.",
      "Helps avoid duplicate entities, wrong spellings and broken slugs.",
      "Improves search, rankings, rosters, profiles and comparisons.",
    ],
  },
  {
    title: "Ranking Snapshot",
    badge: "Ranking Snapshot",
    tone: "analytics",
    description:
      "Ranking snapshots preserve ranking state at a point in time so PlayRank can show history, movement and ranking evolution instead of only current order.",
    points: [
      "Current rankings power public ranking tables.",
      "Historical snapshots support trend and movement analysis.",
      "Snapshot dates should be shown wherever ranking claims are made.",
    ],
  },
  {
    title: "PlayRank Analytics",
    badge: "Analytics Generated",
    tone: "analytics",
    description:
      "PlayRank analytics are calculated signals derived from ranking data, match data, team stats, player stats and recent-form samples.",
    points: [
      "Used in edge scores, radar charts, momentum and rivalry reads.",
      "These are directional intelligence signals, not predictions.",
      "Every analytic claim should show data source or confidence context.",
    ],
  },
  {
    title: "Confidence Layer",
    badge: "Confidence Layer",
    tone: "warning",
    description:
      "Confidence labels explain how much data supports an insight. This prevents overclaiming when data is limited, new or still being validated.",
    points: [
      "High confidence: verified source and strong supporting sample.",
      "Medium confidence: credible but partial sample.",
      "Low confidence: limited sample, directional only.",
    ],
  },
  {
    title: "PUBG API Staging",
    badge: "Staged Data",
    tone: "staged",
    description:
      "PUBG API imports are stored in staging first. They are not treated as public PlayRank core data until mapping, roster and promotion checks pass.",
    points: [
      "Raw imports remain traceable for audit.",
      "Unmapped players block public promotion.",
      "Roster health must pass before staged data becomes public core data.",
    ],
  },
  {
    title: "Comparative Edge",
    badge: "Comparative Edge",
    tone: "analytics",
    description:
      "Comparative Edge is a PlayRank-generated score that compares two teams or players using weighted performance signals.",
    points: [
      "Uses rankings, kills, wins, damage, MVPs, momentum and available match context.",
      "The score explains current advantage, not future certainty.",
      "The formula should stay understandable without exposing every internal weight.",
    ],
  },
  {
    title: "Independent Platform",
    badge: "Independent",
    tone: "official",
    description:
      "PlayRank is an independent esports intelligence platform. Source data and PlayRank-generated analytics must stay clearly separated.",
    points: [
      "Official source data is credited where available.",
      "PlayRank analytics are independently calculated.",
      "The platform should avoid implying official affiliation or endorsement.",
    ],
  },
];

function toneClass(tone: MethodTone) {
  if (tone === "official") {
    return "border-blue-400/20 bg-blue-400/[0.055]";
  }

  if (tone === "verified") {
    return "border-emerald-400/20 bg-emerald-400/[0.055]";
  }

  if (tone === "analytics") {
    return "border-[#ffd21a]/20 bg-[#ffd21a]/[0.055]";
  }

  if (tone === "staged") {
    return "border-purple-400/20 bg-purple-400/[0.055]";
  }

  return "border-red-400/20 bg-red-400/[0.055]";
}

function dotClass(tone: MethodTone) {
  if (tone === "official") return "bg-blue-300";
  if (tone === "verified") return "bg-emerald-300";
  if (tone === "analytics") return "bg-[#ffd21a]";
  if (tone === "staged") return "bg-purple-300";

  return "bg-red-300";
}

function MethodologyCard({ item }: { item: MethodItem }) {
  return (
    <div className={`${softCard} ${toneClass(item.tone)} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/35">
            Method
          </p>

          <h3 className="mt-2 text-xl font-black text-white">{item.title}</h3>
        </div>

        <DataSourceBadge label={item.badge} />
      </div>

      <p className="mt-4 text-sm leading-7 text-white/55">{item.description}</p>

      <ul className="mt-4 space-y-2">
        {item.points.map((point) => (
          <li
            key={point}
            className="flex gap-3 text-sm leading-6 text-white/45"
          >
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass(
                item.tone,
              )}`}
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RuleCard({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd21a]">
        {label}
      </p>
      <h3 className="mt-3 text-xl font-black text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/50">{description}</p>
    </article>
  );
}

export default function MethodologySection() {
  return (
    <section className={`${card} p-6`}>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <DataSourceBadge label="Data Methodology" size="md" />
            <DataSourceBadge label="Source Transparency" size="md" />
            <DataSourceBadge label="No Predictions" size="md" />
            <DataSourceBadge label="Confidence Labels" size="md" />
          </div>

          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ff4038]">
            Methodology
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
            How PlayRank reads esports data
          </h2>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/55">
            PlayRank separates official source data, verified records, staged
            imports and PlayRank-generated analytics. This makes it clear what
            comes from a source system and what is independently calculated by
            the platform.
          </p>
        </div>

        <div className="rounded-2xl border border-[#ff4038]/25 bg-[#ff4038]/10 p-4 md:max-w-xs">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff4038]">
            Important
          </p>

          <p className="mt-2 text-sm leading-6 text-white/60">
            PlayRank analytics are directional intelligence signals. They are
            not betting tips, guarantees, official standings, or predictions.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {methodologyItems.map((item) => (
          <MethodologyCard key={item.title} item={item} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <RuleCard
          label="Rule 01"
          title="Source before insight"
          description="Every strong claim should show whether it is based on official source data, verified records, ranking snapshots, match data, player stats or staged imports."
        />
        <RuleCard
          label="Rule 02"
          title="Confidence before certainty"
          description="Analytics should show confidence context when data is limited, newly imported, derived, or not yet promoted into public core tables."
        />
        <RuleCard
          label="Rule 03"
          title="No fake freshness"
          description="When a reliable timestamp exists, PlayRank should show it. When it does not exist, the platform should say not available instead of inventing recency."
        />
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">
              Public Trust Rule
            </p>

            <h3 className="mt-2 text-2xl font-black text-white">
              Every strong claim needs a visible source or confidence signal.
            </h3>
          </div>

          <DataSourceBadge label="Trust Standard" />
        </div>

        <p className="mt-4 max-w-5xl text-sm leading-7 text-white/55">
          If a section says a team has an edge, a player is in better form, or a
          rivalry is strong, the page should also show whether the claim is
          based on official data, ranking snapshots, match data, player stats,
          or a limited sample. This keeps PlayRank useful without overclaiming.
        </p>
      </div>
    </section>
  );
}
