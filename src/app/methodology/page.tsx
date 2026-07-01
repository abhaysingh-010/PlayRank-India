import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology | PlayRank India",
  description:
    "Understand how PlayRank India evaluates esports teams, players, rankings, data freshness, and platform limitations.",
};

const rankingSignals = [
  {
    title: "Recent performance",
    description:
      "Recent match and tournament results are treated as stronger signals than older results because esports form changes quickly.",
  },
  {
    title: "Consistency",
    description:
      "Teams and players that perform steadily across multiple events are treated differently from one-off spikes.",
  },
  {
    title: "Strength of competition",
    description:
      "Performance is interpreted in context. Results against stronger teams, higher-tier events, and more competitive lobbies carry more trust.",
  },
  {
    title: "Roster and activity context",
    description:
      "Roster changes, inactive players, missing mappings, and incomplete data can affect how confidently a ranking should be interpreted.",
  },
];

const dataSources = [
  "Publicly available esports match and tournament data",
  "Structured PlayRank team, player, match, and ranking records",
  "Admin-reviewed data-health checks",
  "PUBG/Krafton API import readiness checks where applicable",
];

const limitations = [
  "PlayRank rankings are analytical indicators, not official tournament standings.",
  "Incomplete historical data can affect older comparisons.",
  "Roster moves, aliases, and missing player mappings may temporarily affect accuracy.",
  "PUBG API imports are not promoted into core PlayRank records unless readiness checks pass.",
  "Scores should be read together with recent form, match context, and data freshness.",
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
            PlayRank methodology
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            How PlayRank India evaluates esports performance
          </h1>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            PlayRank is built to make Indian esports data easier to understand.
            Rankings are designed as analytical signals that combine performance,
            consistency, data quality, and context instead of treating every result
            as equal.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Current purpose</p>
            <p className="mt-2 text-xl font-semibold">Public analytics MVP</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Ranking type</p>
            <p className="mt-2 text-xl font-semibold">Performance signal</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">Data posture</p>
            <p className="mt-2 text-xl font-semibold">Safety first</p>
          </div>
        </div>

        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold">What the PlayRank score means</h2>
          <p className="mt-4 leading-8 text-muted-foreground">
            A PlayRank score is a comparative indicator of current competitive
            strength. It is not a guarantee of future results and it is not an
            official ranking from a tournament organizer. The score is most useful
            when viewed together with match history, recent form, roster status,
            and data freshness.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Ranking signals</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {rankingSignals.map((signal) => (
              <article
                key={signal.title}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold">{signal.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">
                  {signal.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold">Data sources used</h2>
            <ul className="mt-5 space-y-3 text-muted-foreground">
              {dataSources.map((source) => (
                <li key={source} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  <span>{source}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold">Data freshness</h2>
            <p className="mt-4 leading-8 text-muted-foreground">
              PlayRank should always be interpreted with freshness in mind. New
              matches, roster updates, player mappings, and tournament results can
              change the confidence level of a ranking. Sprint 3 will add clearer
              freshness labels across public ranking surfaces.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Important limitations</h2>
          <ul className="mt-5 space-y-3 text-muted-foreground">
            {limitations.map((limitation) => (
              <li key={limitation} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold">Safety rule for imported data</h2>
          <p className="mt-4 leading-8 text-muted-foreground">
            Imported match data is not automatically treated as trusted PlayRank
            core data. For PUBG/Krafton imports, promotion into core records must
            pass readiness checks such as player mapping, team mapping, roster
            safety, activity status, and AI-participant screening.
          </p>
        </section>
      </section>
    </main>
  );
}
