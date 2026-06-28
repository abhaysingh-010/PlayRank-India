"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DataSourceBadge from "@/components/DataSourceBadge";

type Tab = "players" | "teams";

type PlayerRecord = {
  id: string;
  ign: string;
  slug: string;
  country: string | null;
  role: string | null;
  kd_ratio: number | null;
  avg_damage: number | null;
  win_rate: number | null;
  matches_played: number | null;
  total_kills: number | null;
  mvp_count: number | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};

type TeamRecord = {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  country: string | null;
  points: number | null;
  wins: number | null;
  kills: number | null;
  matches_played: number | null;
  source: string | null;
  verified: boolean | null;
  active: boolean | null;
};

type LeaderboardRow = {
  id: string;
  entity_id: string;
  entity_type: Tab extends "players" ? "player" : "team";
  rank: number;
  score: number;
  change: number | null;
  updated_at: string | null;
  player?: PlayerRecord | null;
  team?: TeamRecord | null;
};

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getChangeTone(change: number) {
  if (change > 0) return "text-emerald-300";
  if (change < 0) return "text-red-300";
  return "text-white/35";
}

function getChangeLabel(change: number) {
  if (change > 0) return `UP ${change}`;
  if (change < 0) return `DOWN ${Math.abs(change)}`;
  return "STABLE";
}

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRowName(row: LeaderboardRow, tab: Tab) {
  if (tab === "players") return row.player?.ign || "Unknown Player";
  return row.team?.name || "Unknown Team";
}

function getRowSubline(row: LeaderboardRow, tab: Tab) {
  if (tab === "players") {
    const role = row.player?.role || "Player";
    const country = row.player?.country || "India";
    return `${role} / ${country}`;
  }

  const shortName = row.team?.short_name || "Team";
  const country = row.team?.country || "India";
  return `${shortName} / ${country}`;
}

function getRowHref(row: LeaderboardRow, tab: Tab) {
  if (tab === "players") {
    return row.player?.slug ? `/players/${row.player.slug}` : "/players";
  }

  return row.team?.slug ? `/teams/${row.team.slug}` : "/teams";
}

function getRowSource(row: LeaderboardRow, tab: Tab) {
  if (tab === "players") {
    return {
      source: row.player?.source,
      verified: row.player?.verified,
      label: row.player?.verified ? "Verified Player" : "Player Ranking",
    };
  }

  return {
    source: row.team?.source,
    verified: row.team?.verified,
    label: row.team?.verified ? "Verified Team" : "Team Ranking",
  };
}

export default function LeaderboardsPage() {
  const [tab, setTab] = useState<Tab>("players");
  const [data, setData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const endpoint = tab === "players" ? "/api/players" : "/api/teams";
        const response = await fetch(endpoint, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load leaderboard data");
        }

        const json: unknown = await response.json();

        if (!Array.isArray(json)) {
          setData([]);
          return;
        }

        setData(json as LeaderboardRow[]);
      } catch (fetchError) {
        if (controller.signal.aborted) return;

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load leaderboard data"
        );
        setData([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [tab]);

  return (
    <main className="min-h-screen bg-[#030406] px-5 py-12 text-white md:px-8 md:py-16">
      <section className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-white/10 pb-8">
          <div className="flex flex-wrap gap-2">
            <DataSourceBadge label="PlayRank Rankings" size="md" />
            <DataSourceBadge label="Read Only API" size="md" />
            <DataSourceBadge label="RLS Protected" size="md" />
          </div>

          <h1 className="mt-6 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
            Leaderboards
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/50 md:text-base">
            Source-controlled team and player ranking views powered by protected
            public read APIs. Ranking movement is directional and depends on the
            latest available snapshot.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setTab("players")}
            className={`rounded-full border px-6 py-3 text-sm font-black uppercase tracking-[0.14em] transition ${
              tab === "players"
                ? "border-[#ffd21a]/40 bg-[#ffd21a]/15 text-[#ffd21a]"
                : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/25 hover:text-white"
            }`}
          >
            Players
          </button>

          <button
            type="button"
            onClick={() => setTab("teams")}
            className={`rounded-full border px-6 py-3 text-sm font-black uppercase tracking-[0.14em] transition ${
              tab === "teams"
                ? "border-[#ffd21a]/40 bg-[#ffd21a]/15 text-[#ffd21a]"
                : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/25 hover:text-white"
            }`}
          >
            Teams
          </button>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
            <p className="text-lg font-black text-white">Loading rankings...</p>
            <p className="mt-2 text-sm text-white/45">
              Fetching latest {tab} leaderboard.
            </p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-8">
            <p className="text-lg font-black text-red-300">
              Leaderboard unavailable
            </p>
            <p className="mt-2 text-sm text-white/55">{error}</p>
          </div>
        ) : null}

        {!loading && !error && data.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
            <p className="text-lg font-black text-white">No rankings found.</p>
            <p className="mt-2 text-sm text-white/45">
              Add ranking rows or run the protected ranking sync from admin.
            </p>
          </div>
        ) : null}

        {!loading && !error && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item) => {
              const change = n(item.change);
              const name = getRowName(item, tab);
              const source = getRowSource(item, tab);

              return (
                <Link
                  key={`${item.entity_type}-${item.entity_id}`}
                  href={getRowHref(item, tab)}
                  className="group block rounded-[28px] border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#ffd21a]/25 hover:bg-white/[0.055] md:p-7"
                >
                  <div className="grid gap-5 md:grid-cols-[1fr_0.4fr_0.35fr] md:items-center">
                    <div className="flex items-center gap-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-[#ffd21a]/20 bg-[#ffd21a]/10">
                        <span className="text-xl font-black text-[#ffd21a]">
                          #{item.rank}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-black tracking-[-0.04em] text-white">
                            {name}
                          </h2>

                          <DataSourceBadge
                            source={source.source}
                            verified={source.verified}
                            label={source.label}
                          />
                        </div>

                        <p className="mt-2 text-sm text-white/45">
                          {getRowSubline(item, tab)}
                        </p>

                        <div className="mt-3 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-black text-white/45">
                          {getInitials(name)}
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                        Score
                      </p>
                      <h3 className="mt-2 text-3xl font-black text-white">
                        {n(item.score).toLocaleString("en-IN")}
                      </h3>
                      <p className={`mt-2 text-sm font-black ${getChangeTone(change)}`}>
                        {getChangeLabel(change)}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                        Status
                      </p>
                      <h3 className="mt-2 text-sm font-black uppercase text-emerald-300">
                        Active
                      </h3>
                      <p className="mt-2 text-xs text-white/35">
                        View profile -&gt;
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}