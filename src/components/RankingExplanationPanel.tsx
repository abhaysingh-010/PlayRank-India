import Link from "next/link";
import DataFreshnessBadge from "@/components/DataFreshnessBadge";
import DataSourceBadge from "@/components/DataSourceBadge";

type RankingExplanationPanelProps = {
  variant: "overview" | "team" | "player";
  lastUpdatedValue?: string | null;
};

const copy = {
  overview: {
    eyebrow: "Ranking Explanation",
    title: "How to read PlayRank rankings",
    description:
      "PlayRank rankings are analytical signals built from available ranking, roster, match, and performance data. Use the score, source badges, update timestamp, and confidence context together instead of reading rank as a standalone claim.",
    scoreTitle: "Score meaning",
    scoreText:
      "The score is a comparative strength indicator. A higher score means the entity has stronger available PlayRank signals, not a guaranteed future result.",
    sourceTitle: "Source confidence",
    sourceText:
      "Team rows may include official or verified source labels. Player rows are more analytical and should be read with sample-size context.",
    limitationTitle: "Interpretation limit",
    limitationText:
      "Rankings are not betting tips, predictions, or official tournament standings.",
  },
  team: {
    eyebrow: "Team Ranking Explanation",
    title: "How to read team rankings",
    description:
      "Team rankings combine current rank, score, source confidence, ranking movement, and the latest available update timestamp.",
    scoreTitle: "Team score",
    scoreText:
      "A team score is a comparative performance signal based on available ranking and team data. It should be read with source and verification labels.",
    sourceTitle: "Verified team layer",
    sourceText:
      "Official and verified team records carry stronger confidence than unverified or incomplete records.",
    limitationTitle: "Team ranking limit",
    limitationText:
      "Roster changes, inactive teams, missing match history, or delayed source updates can affect confidence.",
  },
  player: {
    eyebrow: "Player Ranking Explanation",
    title: "How to read player rankings",
    description:
      "Player rankings are generated from available player, match, seed, and performance signals. They are more directional than team rankings while the player sample size grows.",
    scoreTitle: "Player score",
    scoreText:
      "A player score is a comparative form and performance signal. It is useful for analysis, not certainty.",
    sourceTitle: "Sample-size context",
    sourceText:
      "Player rankings should be treated as directional when match samples, role data, or player mappings are limited.",
    limitationTitle: "Player ranking limit",
    limitationText:
      "Player rankings are not official predictions, betting tips, or guaranteed outcome indicators.",
  },
};

export default function RankingExplanationPanel({
  variant,
  lastUpdatedValue,
}: RankingExplanationPanelProps) {
  const item = copy[variant];

  return (
    <section className="rounded-[2rem] border border-[#ffd21a]/20 bg-[#ffd21a]/[0.06] p-6">
      <div className="flex flex-wrap gap-2">
        <DataSourceBadge label="Score Explained" />
        <DataSourceBadge label="Freshness Aware" />
        <DataSourceBadge label="Confidence Context" />
        <DataFreshnessBadge
          value={lastUpdatedValue}
          label="Ranking Freshness"
        />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_1.4fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#ffd21a]">
            {item.eyebrow}
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
            {item.title}
          </h2>

          <p className="mt-4 text-sm leading-7 text-white/55">
            {item.description}
          </p>

          <Link
            href="/methodology"
            className="mt-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:border-[#ffd21a] hover:text-[#ffd21a]"
          >
            Read full methodology
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Score
            </p>

            <h3 className="mt-3 text-lg font-black text-white">
              {item.scoreTitle}
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/50">
              {item.scoreText}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Source
            </p>

            <h3 className="mt-3 text-lg font-black text-white">
              {item.sourceTitle}
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/50">
              {item.sourceText}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Limit
            </p>

            <h3 className="mt-3 text-lg font-black text-white">
              {item.limitationTitle}
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/50">
              {item.limitationText}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
