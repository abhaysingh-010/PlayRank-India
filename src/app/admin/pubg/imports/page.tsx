import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PubgPromoteButton from "@/components/admin/PubgPromoteButton";

type PubgReadinessRow = 
{
  external_match_id: string;
  shard: string;
  map_name: string | null;
  game_mode: string | null;
  created_at_api: string | null;
  total_participants: number | null;
  mapped_players: number | null;
  mapped_players_with_team: number | null;
  mapped_teams: number | null;
  mapped_player_percentage: number | null;
  promotion_status: string | null;
  promotion_allowed: boolean | null;
};

function n(value: unknown, fallback = 0) 
{
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function statusTone(row: PubgReadinessRow) 
{
  if (row.promotion_allowed) 
  {
    return {
      label: "Ready",
      border: "border-emerald-400/30",
      bg: "bg-emerald-400/10",
      text: "text-emerald-300",
    };
  }

  if (row.promotion_status === "not_ready_no_players_mapped") 
  {
    return {
      label: "No Players Mapped",
      border: "border-red-400/30",
      bg: "bg-red-400/10",
      text: "text-red-300",
    };
  }

  return {
    label: "Blocked",
    border: "border-yellow-400/30",
    bg: "bg-yellow-400/10",
    text: "text-yellow-300",
  };
}

export default async function PubgImportsPage() 
{
  const { data, error } = await supabaseAdmin.from("pubg_match_promotion_readiness").select("*").order("created_at_api", { ascending: false });
  const rows = (data || []) as PubgReadinessRow[];
  const totalImported = rows.length;
  const readyCount = rows.filter((row) => row.promotion_allowed === true).length;
  const blockedCount = rows.filter((row) => row.promotion_allowed !== true).length;
  const totalParticipants = rows.reduce((sum, row) => sum + n(row.total_participants),0);
  const totalMappedPlayers = rows.reduce((sum, row) => sum + n(row.mapped_players),0);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10 px-7 py-20 md:px-14">
        <div className="mx-auto max-w-[1600px]">
          <p className="krafton-label">Admin Console</p>
          <h1 className="mt-5 text-5xl font-black uppercase tracking-[-0.06em] md:text-7xl">
            PUBG Import
            <br />
            Review
          </h1>
          <p className="mt-6 max-w-3xl text-white/55">
            Review imported PUBG API matches before they are allowed into
            PlayRank core match, player and team-stat tables.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/admin/data-health" className="btn-secondary px-6 py-3 text-sm">Data Health</Link>
            <Link href="/admin/pubg/mappings" className="btn-secondary px-6 py-3 text-sm">Player Mappings</Link>
            <Link href="/admin" className="btn-secondary px-6 py-3 text-sm">Admin Home</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-white/10 px-7 py-10 md:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-5 md:grid-cols-4">
          <div className="krafton-card p-6">
            <p className="data-label">Imported Matches</p>
            <p className="mt-3 text-5xl font-black">{totalImported.toLocaleString("en-IN")}</p>
          </div>
          <div className="krafton-card border-emerald-400/25 p-6">
            <p className="data-label text-emerald-300">Ready</p>
            <p className="mt-3 text-5xl font-black text-emerald-300">{readyCount.toLocaleString("en-IN")}</p>
          </div>
          <div className="krafton-card border-yellow-400/25 p-6">
            <p className="data-label text-yellow-300">Blocked</p>
            <p className="mt-3 text-5xl font-black text-yellow-300">{blockedCount.toLocaleString("en-IN")}</p>
          </div>
          <div className="krafton-card p-6">
            <p className="data-label">Mapped Players</p>
            <p className="mt-3 text-5xl font-black">{totalMappedPlayers.toLocaleString("en-IN")}
              <span className="text-white/30">/{totalParticipants.toLocaleString("en-IN")}</span>
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-7 py-14 md:px-14">
        <div className="mb-8 border-b border-white/10 pb-5">
          <p className="krafton-label">Promotion Queue</p>
          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em]">Imported PUBG Matches</h2>
        </div>
        {error ? 
          (
            <div className="border border-red-400/25 bg-red-400/10 p-6">
              <p className="font-black uppercase text-red-300">Failed to load PUBG imports</p>
              <p className="mt-3 text-white/55">{error.message}</p>
            </div>
          ) 
          : null
        }
        <div className="space-y-5">
          {rows.length === 0 ? 
            (
              <div className="border border-white/10 bg-white/[0.03] p-6">
                <p className="font-black uppercase text-white">No PUBG matches imported yet.</p>
                <p className="mt-3 text-white/50">Import a PUBG match first using the protected admin import route.</p>
              </div>
            ) : null
          }
          {rows.map
            ((row) => 
              {
                const tone = statusTone(row);
                const mappedPlayers = n(row.mapped_players);
                const totalPlayers = n(row.total_participants);
                const mappedTeams = n(row.mapped_teams);
                const percentage = n(row.mapped_player_percentage);

                return (
                  <div key={row.external_match_id}className={`krafton-card p-6 ${tone.border}`}>
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="break-all text-2xl font-black tracking-[-0.04em]">{row.external_match_id}</h3>
                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone.border} ${tone.bg} ${tone.text}`}>
                            {tone.label}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-white/45">
                          {row.shard} • {row.map_name || "Unknown Map"} •{" "}{row.game_mode || "Unknown Mode"}
                        </p>

                        <p className="mt-1 text-sm text-white/35">
                          Imported match date:{" "}{row.created_at_api? new Date(row.created_at_api).toLocaleString("en-IN") : "Unknown"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link href={`/admin/pubg/mappings?q=${encodeURIComponent(row.external_match_id)}`}className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/60 hover:text-white">
                          View Mappings
                        </Link>
                        <PubgPromoteButton externalMatchId={row.external_match_id}promotionAllowed={row.promotion_allowed === true}/>
                      </div>
                    </div>
                    <div className="mt-8 grid gap-4 md:grid-cols-4">
                      <div className="border border-white/10 bg-white/[0.03] p-5">
                        <p className="data-label">Participants</p>
                        <p className="mt-3 text-3xl font-black text-white">{totalPlayers.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="border border-white/10 bg-white/[0.03] p-5">
                        <p className="data-label">Mapped Players</p>
                        <p className="mt-3 text-3xl font-black text-white">{mappedPlayers.toLocaleString("en-IN")}
                          <span className="text-white/30">/{totalPlayers.toLocaleString("en-IN")}</span>
                        </p>
                      </div>
                      <div className="border border-white/10 bg-white/[0.03] p-5">
                        <p className="data-label">Mapped Teams</p>
                        <p className="mt-3 text-3xl font-black text-white">{mappedTeams.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="border border-white/10 bg-white/[0.03] p-5">
                        <p className="data-label">Mapped %</p>
                        <p className="mt-3 text-3xl font-black text-white">{percentage.toFixed(2)}%</p>
                      </div>
                    </div>
                    <div className={`mt-6 border p-5 ${tone.border} ${tone.bg}`}>
                      <p className={`text-xs font-black uppercase tracking-[0.16em] ${tone.text}`}>Promotion Status</p>
                      <p className="mt-2 text-sm font-black uppercase text-white">{(row.promotion_status || "unknown").replace(/_/g, " ")}</p>
                      <p className="mt-3 max-w-4xl text-sm leading-6 text-white/55">
                        A PUBG API match is only allowed into PlayRank core data
                        when enough players are mapped to real PlayRank players and
                        those players are linked to teams.
                      </p>
                    </div>
                  </div>
                );
              }
            )
          }
        </div>
      </section>
    </main>
  );
}