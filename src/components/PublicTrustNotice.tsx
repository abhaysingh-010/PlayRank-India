import Link from "next/link";
import DataSourceBadge from "@/components/DataSourceBadge";

type PublicTrustNoticeProps = {
  variant: "teams" | "players" | "matches" | "tournaments";
};

const copy = {
  teams: {
    eyebrow: "Team Data Trust",
    title: "Team records are source-attributed intelligence",
    description:
      "PlayRank team pages combine official, verified, and structured team records where available. Team ranking and performance signals should be read with source badges, active status, roster context, and latest snapshot timing.",
    limitation:
      "Team records are not official tournament standings unless explicitly marked by source attribution.",
  },
  players: {
    eyebrow: "Player Data Trust",
    title: "Player records are analytical and sample-size aware",
    description:
      "PlayRank player pages use available ranking, role, team, and performance signals. Player intelligence is directional when match samples, role history, or player mappings are still limited.",
    limitation:
      "Player records are not predictions, betting tips, or guarantees of future performance.",
  },
  matches: {
    eyebrow: "Match Data Trust",
    title: "Match records separate source data from PlayRank analysis",
    description:
      "PlayRank match pages show completed records, promoted API records, winners, maps, stages, and team result rows where available. Missing result rows are shown as unavailable instead of being invented.",
    limitation:
      "A match record is only as complete as its source, promotion status, and linked team-result data.",
  },
  tournaments: {
    eyebrow: "Tournament Data Trust",
    title: "Tournament records track coverage, not authority",
    description:
      "PlayRank tournament pages show event metadata, prize pools, status, match coverage, and standings coverage. Event records should be read with source labels and coverage counts.",
    limitation:
      "Tournament records are not official rulebooks, registration pages, or final standings unless source attribution clearly supports that.",
  },
};

export default function PublicTrustNotice({ variant }: PublicTrustNoticeProps) {
  const item = copy[variant];

  return (
    <section className="rounded-[2rem] border border-blue-400/20 bg-blue-400/[0.06] p-6">
      <div className="flex flex-wrap gap-2">
        <DataSourceBadge label="Public Trust Notice" />
        <DataSourceBadge label="Source Attribution" />
        <DataSourceBadge label="Freshness Limits" />
        <DataSourceBadge label="No Predictions" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-200">
            {item.eyebrow}
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
            {item.title}
          </h2>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/55">
            {item.description}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            Important limit
          </p>

          <p className="mt-3 text-sm leading-6 text-white/55">
            {item.limitation}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/methodology"
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/60 transition hover:border-blue-300/40 hover:text-blue-200"
            >
              Methodology
            </Link>

            <Link
              href="/data"
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white/60 transition hover:border-blue-300/40 hover:text-blue-200"
            >
              Data Trust
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
