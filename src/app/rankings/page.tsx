import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Clock3,
  Minus,
  ShieldCheck,
} from "lucide-react";
import { Reveal } from "@/components/home/HomeMotion";
import { supabase } from "@/lib/supabase";

type RankingRow = {
  entity_id: string;
  rank: number;
  score: number;
  change: number | null;
  updated_at: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  logo_url: string | null;
  wins: number | null;
  matches_played: number | null;
  source: string | null;
  verified: boolean | null;
};

type PlayerRow = {
  id: string;
  ign: string;
  slug: string;
  role: string | null;
  total_kills: number | null;
  avg_damage: number | null;
  mvp_count: number | null;
  recent_form: number | string | null;
  verified: boolean | null;
};

function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not available";
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function EntityMark({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-white/[0.035]">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          width={44}
          height={44}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <span className="text-[11px] font-black text-white/65">
          {initials(name)}
        </span>
      )}
    </div>
  );
}

function Movement({ value }: { value: number | null }) {
  if (!value)
    return (
      <span className="inline-flex items-center gap-1 text-white/35">
        <Minus size={13} /> 0
      </span>
    );
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-1 text-[var(--pr-positive)]">
        <ArrowUp size={13} /> {value}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[var(--pr-red)]">
      <ArrowDown size={13} /> {Math.abs(value)}
    </span>
  );
}

function RankNumber({ rank }: { rank: number }) {
  return (
    <span
      className={`text-xl font-semibold tracking-[-0.04em] ${rank <= 3 ? "text-[var(--pr-gold)]" : "text-white/55"}`}
    >
      {String(rank).padStart(2, "0")}
    </span>
  );
}

export default async function RankingsPage() {
  const [
    teamRankingsResult,
    playerRankingsResult,
    snapshotResult,
    teamCountResult,
    playerCountResult,
  ] = await Promise.all([
    supabase
      .from("rankings")
      .select("entity_id,rank,score,change,updated_at")
      .eq("entity_type", "team")
      .order("rank", { ascending: true })
      .range(0, 19),
    supabase
      .from("rankings")
      .select("entity_id,rank,score,change,updated_at")
      .eq("entity_type", "player")
      .order("rank", { ascending: true })
      .range(0, 19),
    supabase
      .from("ranking_history")
      .select("snapshot_date,created_at")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("players").select("*", { count: "exact", head: true }),
  ]);

  const teamRankings = (teamRankingsResult.data || []) as RankingRow[];
  const playerRankings = (playerRankingsResult.data || []) as RankingRow[];
  const teamIds = teamRankings.map((row) => row.entity_id);
  const playerIds = playerRankings.map((row) => row.entity_id);

  const [
    { data: teamsRaw, error: teamsError },
    { data: playersRaw, error: playersError },
  ] = await Promise.all([
    teamIds.length
      ? supabase
          .from("teams")
          .select(
            "id,name,short_name,slug,logo_url,wins,matches_played,source,verified",
          )
          .in("id", teamIds)
      : Promise.resolve({ data: [], error: null }),
    playerIds.length
      ? supabase
          .from("players")
          .select(
            "id,ign,slug,role,total_kills,avg_damage,mvp_count,recent_form,verified",
          )
          .in("id", playerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (
    teamRankingsResult.error ||
    playerRankingsResult.error ||
    teamsError ||
    playersError
  ) {
    return (
      <main className="pr-container py-20">
        <section className="border border-[var(--pr-red)]/30 bg-[var(--pr-red)]/5 p-8">
          <p className="pr-kicker">Data unavailable</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Rankings could not be loaded.
          </h1>
          <p className="mt-3 text-white/50">
            Check the Supabase permissions and ranking snapshot.
          </p>
        </section>
      </main>
    );
  }

  const teams = (teamsRaw || []) as TeamRow[];
  const players = (playersRaw || []) as PlayerRow[];
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const playerById = new Map(players.map((player) => [player.id, player]));
  const rankedTeams = teamRankings
    .map((ranking) => ({ ranking, team: teamById.get(ranking.entity_id) }))
    .filter((item): item is { ranking: RankingRow; team: TeamRow } =>
      Boolean(item.team),
    );
  const rankedPlayers = playerRankings
    .map((ranking) => ({ ranking, player: playerById.get(ranking.entity_id) }))
    .filter((item): item is { ranking: RankingRow; player: PlayerRow } =>
      Boolean(item.player),
    );
  const snapshot =
    teamRankings[0]?.updated_at ||
    snapshotResult.data?.snapshot_date ||
    snapshotResult.data?.created_at ||
    null;

  return (
    <main className="bg-[var(--pr-bg)] text-white">
      <section className="border-b border-white/15">
        <div className="pr-container grid gap-12 py-16 md:py-24 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="pr-kicker">Competitive order · BGMI India</p>
            <h1 className="mt-5 text-[clamp(4.5rem,9vw,9rem)] font-semibold uppercase leading-[.78] tracking-[-.08em] text-white">
              Rankings
              <br />
              <span className="text-[var(--pr-red)]">that move.</span>
            </h1>
          </div>
          <div className="lg:pb-2">
            <p className="max-w-xl text-base leading-7 text-white/52">
              A transparent view of team and player order, built from verified
              records, available match data and the latest ranking snapshot.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/rankings/teams"
                className="pr-button pr-button-primary text-[11px]"
              >
                Team rankings
              </Link>
              <Link
                href="/rankings/players"
                className="pr-button pr-button-secondary text-[11px]"
              >
                Player rankings
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/15">
        <div className="pr-container grid grid-cols-2 md:grid-cols-4">
          {[
            [formatDate(snapshot), "Latest snapshot"],
            [rankedTeams.length.toLocaleString("en-IN"), "Ranked teams"],
            [rankedPlayers.length.toLocaleString("en-IN"), "Ranked players"],
            [
              (
                (teamCountResult.count || 0) + (playerCountResult.count || 0)
              ).toLocaleString("en-IN"),
              "Database entities",
            ],
          ].map(([value, label]) => (
            <div
              key={label}
              className="border-r border-white/15 px-5 py-7 first:border-l md:px-7"
            >
              <p className="text-lg font-semibold tracking-[-.03em] text-white md:text-2xl">
                {value}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pr-container py-20 md:py-24">
        <Reveal>
          <div className="flex items-end justify-between gap-6 border-b border-white/15 pb-8">
            <div>
              <p className="pr-kicker">The podium</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.055em] text-white md:text-6xl">
                India&apos;s top three.
              </h2>
            </div>
            <Link
              href="/rankings/teams"
              className="hidden items-center gap-3 text-xs font-black uppercase tracking-[.16em] text-white/45 hover:text-white sm:inline-flex"
            >
              Full table <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3">
          {rankedTeams.slice(0, 3).map(({ ranking, team }, index) => (
            <Reveal
              key={team.id}
              delay={index * 0.08}
              className="border-b border-white/15 py-8 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            >
              <Link href={`/teams/${team.slug}`} className="group block">
                <div className="flex items-start justify-between">
                  <EntityMark name={team.name} logoUrl={team.logo_url} />
                  <span className="text-6xl font-semibold tracking-[-.08em] text-[var(--pr-gold)]">
                    {String(ranking.rank).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-16 text-2xl font-semibold tracking-[-.04em] text-white">
                  {team.name}
                </h3>
                <div className="mt-5 flex items-end justify-between border-t border-white/15 pt-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/30">
                      Ranking score
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {Math.round(ranking.score)}
                    </p>
                  </div>
                  <Movement value={ranking.change} />
                </div>
                <p className="mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-white/35 transition group-hover:text-[var(--pr-red)]">
                  Team profile <ArrowRight size={13} />
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-white/15 bg-[var(--pr-surface)]">
        <div className="pr-container grid lg:grid-cols-2">
          <Leaderboard
            title="Team leaderboard"
            subtitle="Official and verified team layer"
            href="/rankings/teams"
          >
            {rankedTeams.slice(0, 10).map(({ ranking, team }) => (
              <Link
                key={team.id}
                href={`/teams/${team.slug}`}
                className="pr-ranking-row group grid grid-cols-[48px_1fr_auto_auto] items-center gap-3 border-t border-white/10 py-4"
              >
                <RankNumber rank={ranking.rank} />
                <div className="flex min-w-0 items-center gap-3">
                  <EntityMark name={team.name} logoUrl={team.logo_url} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {team.name}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[.14em] text-white/30">
                      {team.short_name || "Team"}
                    </p>
                  </div>
                </div>
                <Movement value={ranking.change} />
                <p className="w-16 text-right font-semibold">
                  {Math.round(ranking.score)}
                </p>
              </Link>
            ))}
          </Leaderboard>

          <Leaderboard
            title="Player leaderboard"
            subtitle="PlayRank performance order"
            href="/rankings/players"
            right
          >
            {rankedPlayers.slice(0, 10).map(({ ranking, player }) => (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="pr-ranking-row group grid grid-cols-[48px_1fr_auto_auto] items-center gap-3 border-t border-white/10 py-4"
              >
                <RankNumber rank={ranking.rank} />
                <div className="flex min-w-0 items-center gap-3">
                  <EntityMark name={player.ign} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {player.ign}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[.14em] text-white/30">
                      {player.role || "Player"}
                    </p>
                  </div>
                </div>
                <Movement value={ranking.change} />
                <p className="w-16 text-right font-semibold">
                  {Math.round(ranking.score)}
                </p>
              </Link>
            ))}
          </Leaderboard>
        </div>
      </section>

      <section className="pr-container py-16 md:py-20">
        <div className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="pr-kicker">Trust layer</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] text-white">
              Know what the rank means.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TrustItem
              icon={<ShieldCheck size={18} />}
              title="Source-aware"
              body="Official team data is attributed where available. PlayRank-generated analysis is labelled separately."
            />
            <TrustItem
              icon={<Clock3 size={18} />}
              title="Snapshot-based"
              body={`This view reflects the latest available snapshot: ${formatDate(snapshot)}.`}
            />
          </div>
        </div>
        <details className="group border-b border-white/15 py-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
            <span>How PlayRank rankings should be interpreted</span>
            <span className="text-[var(--pr-red)] transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-5 max-w-4xl text-sm leading-7 text-white/45">
            Team rankings combine official and verified records where available.
            Player rankings are generated from available player, match and
            performance data and should be treated as directional while sample
            sizes develop. Rankings are intelligence signals—not predictions or
            official tournament decisions.
          </p>
        </details>
      </section>
    </main>
  );
}

function Leaderboard({
  title,
  subtitle,
  href,
  right = false,
  children,
}: {
  title: string;
  subtitle: string;
  href: string;
  right?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`py-12 lg:py-16 ${right ? "lg:border-l lg:border-white/15 lg:pl-10" : "lg:pr-10"}`}
    >
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="pr-kicker">{subtitle}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-white">
            {title}
          </h2>
        </div>
        <Link href={href} className="text-white/35 transition hover:text-white">
          <ArrowRight size={18} />
        </Link>
      </div>
      <div>{children}</div>
    </section>
  );
}

function TrustItem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="border border-white/15 p-5">
      <div className="text-[var(--pr-red)]">{icon}</div>
      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/45">{body}</p>
    </article>
  );
}
