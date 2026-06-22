import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type RosterHealthRow = {
  player_id: string;
  ign: string;
  slug: string;
  player_team_id: string | null;
  player_team_name: string | null;
  active_roster_count: number | null;
  active_roster_team_id: string | null;
  active_roster_team_name: string | null;
  health_status: string;
  promotion_safe: boolean;
};

function n(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function statusTone(status: string) {
  if (status === "healthy") {
    return {
      label: "Healthy",
      border: "border-emerald-400/25",
      bg: "bg-emerald-400/10",
      text: "text-emerald-300",
    };
  }

  if (
    status === "player_team_roster_mismatch" ||
    status === "multiple_active_rosters"
  ) {
    return {
      label: "Critical",
      border: "border-red-400/25",
      bg: "bg-red-400/10",
      text: "text-red-300",
    };
  }

  return {
    label: "Needs Review",
    border: "border-yellow-400/25",
    bg: "bg-yellow-400/10",
    text: "text-yellow-300",
  };
}

export default async function AdminRosterHealthPage() {
  const { data, error } = await supabaseAdmin
    .from("player_roster_health")
    .select("*")
    .order("promotion_safe", { ascending: true })
    .order("health_status", { ascending: true })
    .order("ign", { ascending: true });

  const rows = (data || []) as RosterHealthRow[];

  const healthy = rows.filter((row) => row.health_status === "healthy").length;
  const promotionSafe = rows.filter((row) => row.promotion_safe === true).length;
  const issues = rows.filter((row) => row.health_status !== "healthy").length;

  const noTeamNoRoster = rows.filter(
    (row) => row.health_status === "no_team_no_active_roster"
  ).length;

  const teamButNoRoster = rows.filter(
    (row) => row.health_status === "player_has_team_but_no_active_roster"
  ).length;

  const rosterButTeamMissing = rows.filter(
    (row) => row.health_status === "active_roster_but_player_team_missing"
  ).length;

  const mismatch = rows.filter(
    (row) => row.health_status === "player_team_roster_mismatch"
  ).length;

  const multipleActive = rows.filter(
    (row) => row.health_status === "multiple_active_rosters"
  ).length;

  return (
    <main className="min-h-screen bg-black px-7 py-24 text-white md:px-14">
      <section className="krafton-grid relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07080c] p-8 md:p-12">
        <div className="blueprint-lines" />

        <div className="relative z-10">
          <p className="krafton-label">Admin Console</p>

          <h1 className="krafton-display mt-6 text-[14vw] md:text-[8vw] xl:text-[7rem]">
            ROSTER
            <br />
            HEALTH
          </h1>

          <p className="mt-6 max-w-3xl text-base font-black uppercase leading-6 tracking-[-0.03em] text-white/80 md:text-xl">
            Validate player-team links, active roster records and PUBG promotion
            safety before imported player data enters PlayRank core analytics.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/admin/rosters" className="btn-primary px-6 py-3 text-sm">
              Roster Control
            </Link>

            <Link href="/admin/pubg" className="btn-secondary px-6 py-3 text-sm">
              PUBG Admin Hub
            </Link>

            <Link
              href="/admin/data-health"
              className="btn-secondary px-6 py-3 text-sm"
            >
              Data Health
            </Link>

            <Link href="/admin" className="btn-secondary px-6 py-3 text-sm">
              Admin Home
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-4">
        <div className="krafton-card p-6">
          <p className="data-label">Players Checked</p>

          <p className="mt-3 text-5xl font-black">
            {rows.length.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="krafton-card border-emerald-400/25 p-6">
          <p className="data-label text-emerald-300">Healthy</p>

          <p className="mt-3 text-5xl font-black text-emerald-300">
            {healthy.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="krafton-card border-emerald-400/25 p-6">
          <p className="data-label text-emerald-300">Promotion Safe</p>

          <p className="mt-3 text-5xl font-black text-emerald-300">
            {promotionSafe.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="krafton-card border-yellow-400/25 p-6">
          <p className="data-label text-yellow-300">Issues</p>

          <p className="mt-3 text-5xl font-black text-yellow-300">
            {issues.toLocaleString("en-IN")}
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-5">
        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="data-label">No Team / No Roster</p>
          <p className="mt-3 text-3xl font-black">{noTeamNoRoster}</p>
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="data-label">Team / No Roster</p>
          <p className="mt-3 text-3xl font-black">{teamButNoRoster}</p>
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="data-label">Roster / Team Missing</p>
          <p className="mt-3 text-3xl font-black">{rosterButTeamMissing}</p>
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="data-label">Mismatch</p>
          <p className="mt-3 text-3xl font-black">{mismatch}</p>
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5">
          <p className="data-label">Multiple Active</p>
          <p className="mt-3 text-3xl font-black">{multipleActive}</p>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="krafton-label">Player Roster Audit</p>

          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em]">
            Health Records
          </h2>
        </div>

        {error ? (
          <div className="border border-red-400/25 bg-red-400/10 p-6">
            <p className="font-black uppercase text-red-300">
              Failed to load roster health
            </p>

            <p className="mt-3 text-white/55">{error.message}</p>
          </div>
        ) : null}

        <div className="space-y-4">
          {rows.length === 0 ? (
            <div className="border border-yellow-400/20 bg-yellow-400/10 p-6">
              <p className="font-black uppercase text-yellow-300">
                No player records found.
              </p>
            </div>
          ) : null}

          {rows.map((row) => {
            const tone = statusTone(row.health_status);

            return (
              <div
                key={row.player_id}
                className={`grid gap-4 border bg-white/[0.03] p-5 md:grid-cols-[1fr_1fr_1fr_1fr_auto] ${tone.border}`}
              >
                <div>
                  <p className="data-label">Player</p>

                  <p className="mt-2 font-black text-white">{row.ign}</p>

                  <p className="mt-1 text-xs text-white/35">{row.slug}</p>
                </div>

                <div>
                  <p className="data-label">Player Team</p>

                  <p className="mt-2 font-black text-white">
                    {row.player_team_name || "None"}
                  </p>
                </div>

                <div>
                  <p className="data-label">Active Roster Team</p>

                  <p className="mt-2 font-black text-white">
                    {row.active_roster_team_name || "None"}
                  </p>
                </div>

                <div>
                  <p className="data-label">Active Rosters</p>

                  <p className="mt-2 font-black text-white">
                    {n(row.active_roster_count)}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 md:items-end">
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone.border} ${tone.bg} ${tone.text}`}
                  >
                    {tone.label}
                  </span>

                  <span className="text-xs font-black uppercase tracking-[0.14em] text-white/45">
                    {row.health_status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}