import DataSourceBadge from "@/components/DataSourceBadge";

const card =
  "rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_24px_80px_rgba(0,0,0,0.35)]";

const softCard =
  "rounded-2xl border border-white/10 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

type MethodItem = {
  title: string;
  badge: string;
  description: string;
  points: string[];
};

const methodologyItems: MethodItem[] = [
  {
    title: "Official Data",
    badge: "Official Source",
    description:
      "Official data means rankings, team records or source rows imported from recognized source systems such as Krafton India Esports where available.",
    points: [
      "Used as the highest-trust source layer.",
      "Stored separately before being mapped into PlayRank entities.",
      "Shown with official or source badges when available.",
    ],
  },
  {
    title: "Verified Records",
    badge: "Verified Data",
    description:
      "Verified records are PlayRank-normalized teams or players that have been matched against trusted source data, aliases, IDs or manual validation.",
    points: [
      "Used for team and player profile confidence.",
      "Helps avoid duplicate entities and wrong spellings.",
      "Can be improved later with admin review tools.",
    ],
  },
  {
    title: "Ranking Snapshot",
    badge: "Ranking Snapshot",
    description:
      "Ranking snapshots preserve ranking state at a point in time so PlayRank can show history, movement and ranking evolution instead of only current order.",
    points: [
      "Current rankings power public ranking tables.",
      "Historical snapshots support trend analysis.",
      "Snapshot dates should be shown wherever ranking claims are made.",
    ],
  },
  {
    title: "PlayRank Analytics",
    badge: "Analytics Generated",
    description:
      "PlayRank analytics are calculated signals derived from ranking data, match data, team stats, player stats and recent-form samples.",
    points: [
      "Used in edge scores, radar charts, momentum and rivalry reads.",
      "These are directional insights, not predictions.",
      "Every analytic claim should show data source or confidence context.",
    ],
  },
  {
    title: "Confidence Layer",
    badge: "Confidence Layer",
    description:
      "Confidence labels explain how much data supports an insight. This prevents overclaiming when data is limited.",
    points: [
      "High confidence: strong sample size.",
      "Medium confidence: usable but partial sample.",
      "Low confidence: limited sample, directional only.",
    ],
  },
  {
    title: "Comparative Edge",
    badge: "Comparative Edge",
    description:
      "Comparative Edge is a PlayRank-generated score that compares two teams or players using weighted performance signals.",
    points: [
      "Uses rankings, kills, wins, damage, MVPs, momentum and available match context.",
      "The score explains current advantage, not future certainty.",
      "The formula should stay transparent at a high level without exposing every internal weight.",
    ],
  },
];

function MethodologyCard({ item }: { item: MethodItem }) {
  return (
    <div className={softCard + " p-5"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/35">
            Method
          </p>

          <h3 className="mt-2 text-xl font-black text-white">{item.title}</h3>
        </div>

        <DataSourceBadge label={item.badge} />
      </div>

      <p className="mt-4 text-sm leading-7 text-white/55">
        {item.description}
      </p>

      <ul className="mt-4 space-y-2">
        {item.points.map((point) => (
          <li key={point} className="flex gap-3 text-sm leading-6 text-white/45">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff4038]" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MethodologySection() {
  return (
    <section className={card + " p-6"}>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <DataSourceBadge label="Data Methodology" size="md" />
            <DataSourceBadge label="Source Transparency" size="md" />
            <DataSourceBadge label="No Predictions" size="md" />
          </div>

          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ff4038]">
            Methodology
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
            How PlayRank reads esports data
          </h2>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/55">
            PlayRank separates official source data, verified records and
            PlayRank-generated analytics. This makes it clear what comes from a
            source system and what is calculated by the platform.
          </p>
        </div>

        <div className="rounded-2xl border border-[#ff4038]/25 bg-[#ff4038]/10 p-4 md:max-w-xs">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff4038]">
            Important
          </p>

          <p className="mt-2 text-sm leading-6 text-white/60">
            PlayRank analytics are directional intelligence signals. They are
            not betting tips, guarantees, or predictions.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {methodologyItems.map((item) => (
          <MethodologyCard key={item.title} item={item} />
        ))}
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
          rivalry is strong, the page should also show whether the claim is based
          on official data, ranking snapshots, match data, player stats, or a
          limited sample.
        </p>
      </div>
    </section>
  );
}